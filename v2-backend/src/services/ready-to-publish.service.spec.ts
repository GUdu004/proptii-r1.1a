import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadyToPublishService } from './ready-to-publish.service';

describe('ReadyToPublishService', () => {
  const factsStore = {
    isRuntimeFlagEnabled: vi.fn(),
  };

  let service: ReadyToPublishService;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.C1_VERIFICATION_GATE;
    delete process.env.FLAG_C1_VERIFICATION_GATE;
    service = new ReadyToPublishService(factsStore as any);
  });

  describe('wouldBecomeSearchable', () => {
    it('is true when creating as vacant', () => {
      expect(service.wouldBecomeSearchable('vacant', undefined)).toBe(true);
    });

    it('is true when transitioning draft → vacant', () => {
      expect(service.wouldBecomeSearchable('vacant', 'draft')).toBe(true);
    });

    it('is false when already vacant (edits to live listing)', () => {
      expect(service.wouldBecomeSearchable('vacant', 'vacant')).toBe(false);
    });

    it('is false for draft saves', () => {
      expect(service.wouldBecomeSearchable('draft', undefined)).toBe(false);
      expect(service.wouldBecomeSearchable('draft', 'draft')).toBe(false);
    });
  });

  describe('check — flag off preserves current behaviour', () => {
    it('returns ok with empty missing when gate disabled', async () => {
      factsStore.isRuntimeFlagEnabled.mockResolvedValue(false);
      const result = await service.check('landlord-1', 'prop-1', []);
      expect(result).toEqual({ ok: true, missing: [], gateEnabled: false });
    });
  });

  describe('check — flag on requires five items', () => {
    it('lists all missing when nothing submitted', async () => {
      factsStore.isRuntimeFlagEnabled.mockResolvedValue(true);
      // No Firestore — verification empty, docs empty
      const result = await service.check('landlord-1', undefined, []);
      expect(result.gateEnabled).toBe(true);
      expect(result.ok).toBe(false);
      expect(result.missing).toEqual(
        expect.arrayContaining([
          'photo_id',
          'proof_of_address',
          'gas-cert',
          'eicr',
          'epc',
          'deposit-protection',
        ]),
      );
    });

    it('requires epcRating on EPC docs', async () => {
      factsStore.isRuntimeFlagEnabled.mockResolvedValue(true);
      const result = await service.check('landlord-1', undefined, [
        { type: 'gas-cert', url: 'x' },
        { type: 'eicr', url: 'x' },
        { type: 'epc', url: 'x' }, // no rating
        { type: 'deposit-protection', url: 'x' },
      ]);
      expect(result.missing).toContain('epc');
      expect(result.missing).toContain('photo_id');
      expect(result.missing).toContain('proof_of_address');
      expect(result.missing).not.toContain('gas-cert');
    });

    it('accepts property docs when EPC has rating (account items still missing)', async () => {
      factsStore.isRuntimeFlagEnabled.mockResolvedValue(true);
      const result = await service.check('landlord-1', undefined, [
        { type: 'gas-cert' },
        { type: 'eicr' },
        { type: 'epc', epcRating: 'C' },
        { type: 'deposit-protection' },
      ]);
      expect(result.missing).toEqual(['photo_id', 'proof_of_address']);
      expect(result.ok).toBe(false);
    });
  });
});

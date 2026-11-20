import { describe, expect, it } from 'vitest';
import {
  AMENITY_CATEGORIES,
  PROPERTY_TYPE_GROUPS,
  getAmenitiesForSubtype,
  getAmenityById,
  getAmenityCategoriesForSubtype,
  normalizeLegacyAmenities,
  resolveClassificationFromStoredType,
  subtypeLabel,
  validateAmenityIds,
} from './index';

describe('propertyCatalogue', () => {
  it('maps amenity categories for every subtype', () => {
    const knownCategoryIds = new Set(AMENITY_CATEGORIES.map((c) => c.id));

    for (const group of PROPERTY_TYPE_GROUPS) {
      for (const subtype of group.subtypes) {
        expect(
          subtype.amenityCategoryIds.length,
          `${subtype.id} should declare amenity categories`,
        ).toBeGreaterThan(0);

        for (const catId of subtype.amenityCategoryIds) {
          expect(
            knownCategoryIds.has(catId),
            `${subtype.id} references unknown category ${catId}`,
          ).toBe(true);
        }

        const resolved = getAmenityCategoriesForSubtype(subtype.id);
        expect(resolved.length).toBe(subtype.amenityCategoryIds.length);
      }
    }
  });

  it('returns different amenity sets for detached-house vs warehouse vs room-in-shared-house', () => {
    const house = getAmenitiesForSubtype('detached-house');
    const warehouse = getAmenitiesForSubtype('warehouse');
    const shared = getAmenitiesForSubtype('room-in-shared-house');

    expect(house.length).toBeGreaterThan(0);
    expect(warehouse.length).toBeGreaterThan(0);
    expect(shared.length).toBeGreaterThan(0);

    const houseIds = new Set(house.map((a) => a.id));
    const warehouseIds = new Set(warehouse.map((a) => a.id));
    const sharedIds = new Set(shared.map((a) => a.id));

    // House has garden / outdoor; warehouse does not
    expect(houseIds.has('private_garden')).toBe(true);
    expect(warehouseIds.has('private_garden')).toBe(false);

    // Warehouse has industrial loading; house does not
    expect(warehouseIds.has('roller_shutter_loading') || warehouseIds.has('loading_bay')).toBe(
      true,
    );
    expect(houseIds.has('loading_bay')).toBe(false);

    // Shared room has private_room / shared kitchen; detached house does not
    expect(sharedIds.has('shared_kitchen') || sharedIds.has('double_bed')).toBe(true);
    expect(houseIds.has('shared_kitchen')).toBe(false);
    expect(warehouseIds.has('shared_kitchen')).toBe(false);

    // Sets should not be identical
    expect([...houseIds].sort().join(',')).not.toBe([...warehouseIds].sort().join(','));
    expect([...houseIds].sort().join(',')).not.toBe([...sharedIds].sort().join(','));
    expect([...warehouseIds].sort().join(',')).not.toBe([...sharedIds].sort().join(','));
  });

  it('resolves legacy amenity IDs', () => {
    expect(getAmenityById('wifi')?.id).toBe('wifi');
    expect(getAmenityById('pet-friendly')?.id).toBe('pet-friendly');
    expect(getAmenityById('washing-machine')?.id).toBe('washing-machine');

    const normalized = normalizeLegacyAmenities([
      'wifi',
      'parking',
      'pet-friendly',
      'gym',
      'pool',
      'garden',
      'security',
      'kitchen',
      'washing-machine',
      'custom_unknown',
    ]);

    expect(normalized).toEqual([
      'fibre_broadband',
      'off_street_parking',
      'pets_considered',
      'gym_on_site',
      'swimming_pool_building',
      'private_garden',
      'alarm_system',
      'fitted_kitchen',
      'washing_machine',
      'custom_unknown',
    ]);
  });

  it('filters unknown amenities via validateAmenityIds', () => {
    const { valid, invalid } = validateAmenityIds([
      'private_garden',
      'fibre_broadband',
      'not_a_real_amenity',
      'wifi',
      'totally-fake',
    ]);

    expect(valid).toContain('private_garden');
    expect(valid).toContain('fibre_broadband');
    expect(valid).toContain('wifi');
    expect(invalid).toEqual(expect.arrayContaining(['not_a_real_amenity', 'totally-fake']));
    expect(invalid).not.toContain('wifi');
  });

  it('restricts validateAmenityIds to subtype when provided', () => {
    const { valid, invalid } = validateAmenityIds(
      ['private_garden', 'loading_bay', 'shared_kitchen'],
      'warehouse',
    );

    expect(valid).toContain('loading_bay');
    expect(invalid).toEqual(expect.arrayContaining(['private_garden', 'shared_kitchen']));
  });

  it('resolves legacy stored types and labels', () => {
    expect(resolveClassificationFromStoredType('studio')).toEqual({
      categoryId: 'residential',
      typeGroupId: 'studio',
      subtypeId: 'standard-studio',
    });
    expect(resolveClassificationFromStoredType('detached-house')?.subtypeId).toBe(
      'detached-house',
    );
    expect(subtypeLabel('room-in-shared-house')).toBe('Room in shared house');
    expect(subtypeLabel('shared')).toBe('Room in shared house');
  });
});

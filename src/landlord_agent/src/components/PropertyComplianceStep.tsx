/**
 * Step 5 of AddPropertyWizard — UK property compliance checklist + deposit commitment.
 */
import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Info,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import {
  formatMissingVerification,
  getAccountVerification,
} from '../services/verificationService';

export type ComplianceDocKey = 'gas-cert' | 'eicr' | 'epc' | 'deposit-protection';

export interface WizardComplianceEntry {
  file?: File | null;
  fileName?: string;
  url?: string;
  storagePath?: string;
  epcRating?: string;
}

export type WizardComplianceDocuments = Partial<
  Record<ComplianceDocKey, WizardComplianceEntry>
>;

export type DepositWillProtect = 'landlord' | 'agent' | null;

export interface DepositCommitment {
  takesDeposit: 'yes' | 'no' | null;
  depositAmount: string;
  depositProtectionConfirmed: boolean;
  depositProtectedBy: DepositWillProtect;
}

const EPC_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Exempt'];

const UPLOAD_ITEMS: Array<{
  key: Exclude<ComplianceDocKey, 'deposit-protection'>;
  title: string;
  description: string;
}> = [
  {
    key: 'gas-cert',
    title: 'Gas Safety Certificate (CP12)',
    description: 'Legally required annual check confirming gas appliances are safe.',
  },
  {
    key: 'eicr',
    title: 'Electrical Installation Condition Report (EICR)',
    description: "Confirms the property's electrical installations meet UK safety standards.",
  },
  {
    key: 'epc',
    title: 'Energy Performance Certificate (EPC)',
    description: "Shows the property's energy efficiency rating as required by UK law.",
  },
];

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const MAX_BYTES = 10 * 1024 * 1024;

const INP = [
  'w-full h-12 bg-white border border-[#e2e8f0] rounded-2xl px-4',
  'font-[Nunito_Sans,sans-serif] text-[14px] text-[#1e293b]',
  'transition-all outline-none',
  'hover:border-[#cbd5e1]',
  'focus:border-[#136C9E] focus:ring-[3.5px] focus:ring-[rgba(19,108,158,0.12)]',
  'placeholder:text-[#94a3b8] placeholder:font-normal',
].join(' ');

interface PropertyComplianceStepProps {
  documents: WizardComplianceDocuments;
  deposit: DepositCommitment;
  onChange: (next: WizardComplianceDocuments) => void;
  onDepositChange: (next: DepositCommitment) => void;
  onContinue: () => void;
  onBack: () => void;
  onVerifyAccount?: () => void;
}

function hasDoc(entry?: WizardComplianceEntry): boolean {
  return Boolean(entry?.file || entry?.url || entry?.fileName);
}

function Pill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-medium transition-all"
      style={{
        borderColor: selected ? '#136C9E' : '#d5dde7',
        background: selected ? '#136C9E' : '#fff',
        color: selected ? '#fff' : '#1e293b',
        fontFamily: 'Archivo,sans-serif',
      }}
    >
      {selected && <Check size={14} strokeWidth={3} />}
      {label}
    </button>
  );
}

export function isDepositCommitmentSatisfied(deposit: DepositCommitment): boolean {
  if (deposit.takesDeposit === 'no') return true;
  if (deposit.takesDeposit !== 'yes') return false;
  const amount = parseFloat(deposit.depositAmount);
  return (
    deposit.depositProtectionConfirmed &&
    Boolean(deposit.depositAmount.trim()) &&
    !isNaN(amount) &&
    amount > 0
  );
}

export function PropertyComplianceStep({
  documents,
  deposit,
  onChange,
  onDepositChange,
  onContinue,
  onBack,
  onVerifyAccount,
}: PropertyComplianceStepProps) {
  const inputRefs = useRef<Partial<Record<ComplianceDocKey, HTMLInputElement | null>>>({});
  const [accountMissing, setAccountMissing] = useState<string[]>([]);
  const [accountLoading, setAccountLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAccountLoading(true);
    void getAccountVerification()
      .then((verification) => {
        if (cancelled) return;
        const missing: string[] = [];
        if (!verification?.photoId?.storagePath && !verification?.photoId?.submittedAt) {
          missing.push('photo_id');
        }
        if (
          !verification?.proofOfAddress?.storagePath &&
          !verification?.proofOfAddress?.submittedAt
        ) {
          missing.push('proof_of_address');
        }
        setAccountMissing(missing);
      })
      .catch(() => {
        if (!cancelled) setAccountMissing([]);
      })
      .finally(() => {
        if (!cancelled) setAccountLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setEntry(key: ComplianceDocKey, patch: Partial<WizardComplianceEntry> | null) {
    if (patch === null) {
      const next = { ...documents };
      delete next[key];
      onChange(next);
      return;
    }
    onChange({
      ...documents,
      [key]: { ...documents[key], ...patch },
    });
  }

  function onFilePicked(key: ComplianceDocKey, file: File | undefined) {
    setLocalError(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setLocalError(`${file.name} exceeds the 10 MB limit.`);
      return;
    }
    setEntry(key, {
      file,
      fileName: file.name,
      url: undefined,
      storagePath: undefined,
      ...(key === 'epc' ? { epcRating: documents.epc?.epcRating } : {}),
    });
  }

  function patchDeposit(patch: Partial<DepositCommitment>) {
    setDepositError(null);
    onDepositChange({ ...deposit, ...patch });
  }

  function handleContinue() {
    if (deposit.takesDeposit === null) {
      setDepositError('Choose whether you will take a deposit.');
      return;
    }
    if (deposit.takesDeposit === 'yes') {
      const amount = parseFloat(deposit.depositAmount);
      if (!deposit.depositAmount.trim() || isNaN(amount) || amount <= 0) {
        setDepositError('Enter a valid deposit amount.');
        return;
      }
      if (!deposit.depositProtectionConfirmed) {
        setDepositError('Confirm you will protect the deposit to continue.');
        return;
      }
    }
    setDepositError(null);
    onContinue();
  }

  return (
    <div className="space-y-5">
      {accountLoading ? null : accountMissing.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-[14px] border border-amber-200 bg-amber-50">
          <p className="flex-1 text-[12.5px] text-amber-900 leading-relaxed">
            <span className="font-semibold">Account verification: </span>
            {accountMissing.length} item{accountMissing.length === 1 ? '' : 's'} needed
            ({formatMissingVerification(accountMissing)}). Complete once on your Landlord Dashboard.
          </p>
          {onVerifyAccount && (
            <button
              type="button"
              onClick={onVerifyAccount}
              className="shrink-0 h-9 px-3.5 rounded-xl border border-[#e2e8f0] bg-white text-[12.5px] font-semibold text-[#1e293b] hover:bg-[#f8fafc] transition-colors"
              style={{ fontFamily: 'Archivo,sans-serif' }}
            >
              Verify account on Dashboard →
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3.5 rounded-[14px] border border-emerald-200 bg-emerald-50">
          <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-emerald-800 leading-relaxed">
            Account verification is complete. You can still upload property compliance documents below.
          </p>
        </div>
      )}

      {localError && (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-red-700">{localError}</p>
        </div>
      )}

      <div className="space-y-3">
        {UPLOAD_ITEMS.map((item) => {
          const entry = documents[item.key];
          const uploaded = hasDoc(entry);
          return (
            <div
              key={item.key}
              className="rounded-[18px] border border-[#e2e8f0] bg-white px-4 py-4 sm:px-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wide"
                    style={{
                      background: uploaded ? '#ecfdf5' : '#f1f5f9',
                      color: uploaded ? '#047857' : '#64748b',
                      fontFamily: 'Archivo,sans-serif',
                    }}
                  >
                    {uploaded ? 'Uploaded' : 'Missing'}
                  </span>
                  <p
                    className="text-[14.5px] font-bold text-[#1e293b] mt-2"
                    style={{ fontFamily: 'Archivo,sans-serif' }}
                  >
                    {item.title}
                  </p>
                  <p className="text-[12.5px] text-[#64748b] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-[11.5px] text-[#94a3b8] mt-2">
                    PDF, JPG, or PNG · Max 10 MB
                  </p>
                  {uploaded && (
                    <div className="mt-2.5 flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-[#136C9E] shrink-0" />
                      <span className="text-[12.5px] text-[#334155] truncate">
                        {entry?.fileName || 'Document on file'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEntry(item.key, null)}
                        className="w-5 h-5 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0 hover:bg-[#fca5a5] transition-colors"
                        title="Remove"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:pt-1">
                  {item.key === 'epc' && (
                    <select
                      value={entry?.epcRating || ''}
                      onChange={(e) =>
                        setEntry('epc', {
                          ...entry,
                          epcRating: e.target.value,
                          file: entry?.file,
                          fileName: entry?.fileName,
                          url: entry?.url,
                        })
                      }
                      className="h-10 min-w-[132px] rounded-xl border border-[#e2e8f0] bg-white px-3 text-[12.5px] text-[#1e293b] outline-none focus:border-[#136C9E] focus:ring-[3px] focus:ring-[rgba(19,108,158,0.12)]"
                      style={{ fontFamily: 'Archivo,sans-serif' }}
                    >
                      <option value="">Select rating</option>
                      {EPC_RATINGS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[item.key] = el;
                    }}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      onFilePicked(item.key, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => inputRefs.current[item.key]?.click()}
                    className="h-10 px-4 rounded-xl font-semibold text-[13px] text-white flex items-center gap-1.5 transition-all hover:-translate-y-px"
                    style={{
                      background: '#0f3d5c',
                      fontFamily: 'Archivo,sans-serif',
                      boxShadow: '0 2px 8px rgba(15,61,92,0.2)',
                    }}
                  >
                    <Upload size={14} strokeWidth={2.5} />
                    {uploaded ? 'Replace' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit commitment — replaces deposit-protection document upload at listing time */}
      <div className="pt-2 space-y-4">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#64748b] flex items-center gap-2.5 m-0">
          Deposit
          <span className="flex-1 h-px bg-[#e3e8ef]" />
        </p>

        <div>
          <label
            className="block text-[13.5px] font-semibold text-[#1e293b] mb-2"
            style={{ fontFamily: 'Archivo,sans-serif' }}
          >
            Will you take a deposit? <span className="text-[#e5484d]">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Pill
              label="Yes"
              selected={deposit.takesDeposit === 'yes'}
              onClick={() =>
                patchDeposit({
                  takesDeposit: 'yes',
                  depositProtectionConfirmed: false,
                })
              }
            />
            <Pill
              label="No"
              selected={deposit.takesDeposit === 'no'}
              onClick={() =>
                patchDeposit({
                  takesDeposit: 'no',
                  depositAmount: '',
                  depositProtectionConfirmed: false,
                  depositProtectedBy: null,
                })
              }
            />
          </div>
        </div>

        {deposit.takesDeposit === 'yes' && (
          <>
            <div>
              <label
                className="block text-[13.5px] font-semibold text-[#1e293b] mb-2"
                style={{ fontFamily: 'Archivo,sans-serif' }}
              >
                Deposit amount (£) <span className="text-[#e5484d]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a99ad] text-[14.5px] pointer-events-none">
                  £
                </span>
                <input
                  type="number"
                  min="1"
                  value={deposit.depositAmount}
                  onChange={(e) => patchDeposit({ depositAmount: e.target.value })}
                  placeholder="e.g. 1500"
                  className={`${INP} pl-9`}
                />
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-[#64748b] leading-snug">
                <Info size={14} className="shrink-0 mt-0.5 text-[#8a99ad]" />
                <span>
                  Shown on your listing. Must not exceed the legal limit for where the property is.
                </span>
              </p>
            </div>

            <div className="rounded-[16px] border border-[#d6e6f5] bg-[#f3f8fd] p-4 space-y-3.5">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#136C9E] shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p
                    className="text-[13.5px] font-bold text-[#1e293b]"
                    style={{ fontFamily: 'Archivo,sans-serif' }}
                  >
                    Deposit protection
                  </p>
                  <p className="text-[12.5px] text-[#30506f] mt-1.5 leading-relaxed">
                    If you take a deposit, you’re legally required to protect it in a
                    government-approved deposit protection scheme and give your tenant the scheme
                    details within the legal deadline. Unprotected deposits can lead to financial
                    penalties and limit your ability to regain possession.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deposit.depositProtectionConfirmed}
                  onChange={(e) =>
                    patchDeposit({ depositProtectionConfirmed: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-[#b8c4d3] text-[#136C9E] focus:ring-[#136C9E]"
                />
                <span
                  className="text-[13px] font-medium text-[#1e293b] leading-snug"
                  style={{ fontFamily: 'Archivo,sans-serif' }}
                >
                  I confirm I’ll protect any deposit in a government-approved scheme within the
                  legal deadline. <span className="text-[#e5484d]">*</span>
                </span>
              </label>

              <div>
                <label
                  className="block text-[13px] font-semibold text-[#334155] mb-2"
                  style={{ fontFamily: 'Archivo,sans-serif' }}
                >
                  Who will protect it?{' '}
                  <span className="text-[#94a3b8] font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <Pill
                    label="I will"
                    selected={deposit.depositProtectedBy === 'landlord'}
                    onClick={() =>
                      patchDeposit({
                        depositProtectedBy:
                          deposit.depositProtectedBy === 'landlord' ? null : 'landlord',
                      })
                    }
                  />
                  <Pill
                    label="My letting agent will"
                    selected={deposit.depositProtectedBy === 'agent'}
                    onClick={() =>
                      patchDeposit({
                        depositProtectedBy:
                          deposit.depositProtectedBy === 'agent' ? null : 'agent',
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {depositError && (
          <p className="flex items-center gap-1 text-[11.5px] text-[#dc2626]">
            <AlertTriangle size={12} />
            {depositError}
          </p>
        )}
      </div>

      <p className="text-[12px] text-[#64748b] text-center leading-relaxed">
        You can continue without every document and save as draft. Publishing may require
        outstanding compliance items when verification gates are enabled.
      </p>

      <div className="pt-1 space-y-3">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
          style={{
            background: '#DC5F12',
            fontFamily: 'Archivo,sans-serif',
            boxShadow: '0 4px 14px rgba(220,95,18,0.32)',
          }}
        >
          Review & Publish <ArrowRight size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all"
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Back to Photos & Notes
        </button>
      </div>
    </div>
  );
}

export default PropertyComplianceStep;

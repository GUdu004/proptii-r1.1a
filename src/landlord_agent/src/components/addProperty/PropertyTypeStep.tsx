/**
 * Step 1 — Property Type (simplified residential cards + inline subtype panel).
 */
import type { CSSProperties } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  HelpCircle,
  Home,
  Info,
  Layout,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  WIZARD_TYPE_CARDS,
  type WizardTypeCard,
} from './flowConfig';

function BungalowIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 13 12 6.5 22 13" />
      <path d="M4 12v8h16v-8" />
      <path d="M10 20v-4.5h4V20" />
    </svg>
  );
}

const ICON_BY_KEY: Record<WizardTypeCard['icon'], LucideIcon | typeof BungalowIcon> = {
  home: Home,
  building: Building2,
  bungalow: BungalowIcon,
  studio: Layout,
  users: Users,
  help: HelpCircle,
};

interface PropertyTypeStepProps {
  selectedCardId: string | null;
  selectedChipLabel: string | null;
  error?: string;
  onSelectCard: (cardId: string) => void;
  onSelectSubtype: (cardId: string, chipLabel: string, subtypeId: string) => void;
  onContinue: () => void;
}

export function PropertyTypeStep({
  selectedCardId,
  selectedChipLabel,
  error,
  onSelectCard,
  onSelectSubtype,
  onContinue,
}: PropertyTypeStepProps) {
  const selectedCard = WIZARD_TYPE_CARDS.find((c) => c.id === selectedCardId) ?? null;
  const needsSubtype = Boolean(selectedCard && selectedCard.subtypes.length > 0);
  const canContinue =
    Boolean(selectedCard) &&
    (!needsSubtype || Boolean(selectedChipLabel));

  const selectedIndex = selectedCard
    ? WIZARD_TYPE_CARDS.findIndex((c) => c.id === selectedCard.id)
    : -1;
  const rowEnd = selectedIndex >= 0 ? Math.floor(selectedIndex / 2) * 2 + 1 : 0;
  const col = selectedIndex % 2;
  const hint =
    selectedCard?.subtypes.find((s) => s.label === selectedChipLabel)?.hint;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {WIZARD_TYPE_CARDS.map((card, i) => {
          const Icon = ICON_BY_KEY[card.icon];
          const on = selectedCardId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              aria-pressed={on}
              onClick={() => onSelectCard(card.id)}
              className="relative text-left rounded-[16px] border-[1.5px] p-4 transition-all hover:-translate-y-0.5"
              style={{
                order: i * 10,
                borderColor: on ? '#136C9E' : '#d5dde7',
                background: on ? '#f6fafe' : '#fff',
                boxShadow: on ? '0 0 0 3px #e1edf8' : 'none',
              }}
            >
              <span
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: on ? '#136C9E' : '#e5eaf0' }}
              >
                <Check size={11} className="text-white" strokeWidth={3} />
              </span>
              <span
                className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3.5"
                style={{
                  background: on ? '#dceaf6' : '#f1f4f8',
                  color: on ? '#136C9E' : '#5b6b80',
                }}
              >
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <p
                className="text-[14.5px] font-bold text-[#1e293b] mb-1"
                style={{ fontFamily: 'Archivo,sans-serif' }}
              >
                {card.label}
              </p>
              <p className="text-[12.5px] text-[#64748b] leading-snug pr-2">
                {card.description}
              </p>
            </button>
          );
        })}

        {selectedCard && selectedCard.subtypes.length > 0 && (
          <div
            className="col-span-1 sm:col-span-2 relative rounded-[16px] border border-[#e3e8ef] bg-[#f7f9fc] p-[18px] mt-0.5 mb-1 ap-subpick"
            style={
              {
                ['--o-d' as string]: String(rowEnd * 10 + 5),
                ['--o-m' as string]: String(selectedIndex * 10 + 5),
                ['--arrow' as string]: col === 1 ? '75%' : '25%',
              } as CSSProperties
            }
          >
            {/* Desktop pointer toward selected column */}
            <span
              className="hidden sm:block absolute -top-[7px] w-3 h-3 bg-[#f7f9fc] border-l border-t border-[#e3e8ef] rotate-45"
              style={{ left: 'var(--arrow)', transform: 'translateX(-50%) rotate(45deg)' }}
              aria-hidden
            />
            {/* Mobile pointer (under card) */}
            <span
              className="sm:hidden absolute -top-[7px] left-10 w-3 h-3 bg-[#f7f9fc] border-l border-t border-[#e3e8ef]"
              style={{ transform: 'rotate(45deg)' }}
              aria-hidden
            />

            <p
              className="text-[13.5px] font-semibold text-[#1e293b] mb-3"
              style={{ fontFamily: 'Archivo,sans-serif' }}
            >
              {selectedCard.question}{' '}
              <span className="text-[#e5484d]">*</span>
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={selectedCard.question}>
              {selectedCard.subtypes.map((sub) => {
                const on = selectedChipLabel === sub.label;
                return (
                  <button
                    key={sub.subtypeId}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() =>
                      onSelectSubtype(selectedCard.id, sub.label, sub.subtypeId)
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-medium transition-all"
                    style={{
                      borderColor: on ? '#136C9E' : '#d5dde7',
                      background: on ? '#136C9E' : '#fff',
                      color: on ? '#fff' : '#1e293b',
                      fontFamily: 'Archivo,sans-serif',
                    }}
                  >
                    {on && <Check size={14} strokeWidth={3} />}
                    {sub.label}
                  </button>
                );
              })}
            </div>
            {hint && (
              <div className="mt-3 flex items-start gap-1.5 text-[12.5px] text-[#64748b] leading-snug">
                <Info size={14} className="shrink-0 mt-0.5 text-[#8a99ad]" />
                <span>{hint}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .ap-subpick { order: var(--o-d); }
        @media (max-width: 639px) {
          .ap-subpick { order: var(--o-m) !important; }
          .ap-subpick > span.ap-arrow-desktop { display: none !important; }
        }
      `}</style>

      {error && (
        <p className="flex items-center gap-1 text-[11.5px] text-[#dc2626]">
          {error}
        </p>
      )}

      <div className="pt-1 space-y-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed hover:enabled:-translate-y-px"
          style={{
            background: canContinue ? '#136C9E' : '#a9bdd1',
            fontFamily: 'Archivo,sans-serif',
            boxShadow: canContinue ? '0 4px 14px rgba(19,108,158,0.28)' : 'none',
          }}
        >
          Continue <ArrowRight size={18} strokeWidth={2.5} />
        </button>
        {!canContinue && (
          <p className="text-center text-[12px] text-[#64748b]">
            {!selectedCard
              ? 'Choose a property type to continue'
              : 'Choose a sub-type to continue'}
          </p>
        )}
      </div>
    </div>
  );
}

export default PropertyTypeStep;

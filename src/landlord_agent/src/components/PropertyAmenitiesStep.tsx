/**
 * Step 3 — Features & Amenities (checkbox chips, type-filtered, show more).
 */
import { useMemo, useState } from 'react';
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Package,
  Sofa,
  Trees,
} from 'lucide-react';
import { getAmenityById, subtypeLabel } from '../../../shared/propertyCatalogue';
import {
  FEATURE_GROUPS,
  WIZARD_FEATURE_ITEMS,
  featureVisibility,
  getWizardKind,
  resolveWizardTypeFromSubtype,
  type FeatureVis,
  type WizardFeatureItem,
  type WizardKind,
} from './addProperty/flowConfig';
import type { AmenityAccessType } from '../../../shared/propertyCatalogue';

export type AmenityDetail = {
  amenityId: string;
  accessType?: AmenityAccessType;
  additionalCost?: boolean;
  notes?: string;
};

interface PropertyAmenitiesStepProps {
  subtypeId: string | null;
  amenities: string[];
  amenityDetails: AmenityDetail[];
  additionalFeatures: string;
  floorNumber?: string;
  wizardCardId?: string | null;
  wizardChipLabel?: string | null;
  onAmenitiesChange: (ids: string[]) => void;
  onAmenityDetailsChange: (details: AmenityDetail[]) => void;
  onAdditionalFeaturesChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onChangeType?: () => void;
}

const GROUP_ICONS = {
  trees: Trees,
  sofa: Sofa,
  access: Accessibility,
  box: Package,
  building: Building2,
} as const;

function detailNotes(
  details: AmenityDetail[],
  amenityId: string,
): string | undefined {
  return details.find((d) => d.amenityId === amenityId)?.notes;
}

export function PropertyAmenitiesStep({
  subtypeId,
  amenities,
  amenityDetails,
  additionalFeatures,
  floorNumber,
  wizardCardId,
  wizardChipLabel,
  onAmenitiesChange,
  onAmenityDetailsChange,
  onAdditionalFeaturesChange,
  onContinue,
  onBack,
  onChangeType,
}: PropertyAmenitiesStepProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const resolved = useMemo(() => {
    if (wizardCardId) {
      return { cardId: wizardCardId, chipLabel: wizardChipLabel ?? null };
    }
    return resolveWizardTypeFromSubtype(subtypeId);
  }, [wizardCardId, wizardChipLabel, subtypeId]);

  const kind: WizardKind | null = useMemo(
    () => getWizardKind(resolved.cardId, resolved.chipLabel),
    [resolved.cardId, resolved.chipLabel],
  );

  const typeDisplay = useMemo(() => {
    if (!subtypeId) return 'Property';
    return subtypeLabel(subtypeId) || 'Property';
  }, [subtypeId]);

  function visFor(item: WizardFeatureItem): FeatureVis {
    return featureVisibility(item, kind, {
      floorNumber,
      cardId: resolved.cardId,
      chipLabel: resolved.chipLabel,
    });
  }

  function isSelected(item: WizardFeatureItem): boolean {
    if (amenities.includes(item.amenityId)) return true;
    // Heating (and similar) may store a swapped primary amenity from the option list
    if (item.id === 'heating') {
      return (item.options ?? []).some((o) =>
        (o.amenityIds ?? []).some((id) => amenities.includes(id)),
      );
    }
    return false;
  }

  function upsertNotes(amenityId: string, notes: string | undefined) {
    const existing = amenityDetails.find((d) => d.amenityId === amenityId);
    if (!notes) {
      if (!existing) return;
      onAmenityDetailsChange(
        amenityDetails.map((d) =>
          d.amenityId === amenityId ? { ...d, notes: undefined } : d,
        ),
      );
      return;
    }
    if (existing) {
      onAmenityDetailsChange(
        amenityDetails.map((d) =>
          d.amenityId === amenityId ? { ...d, notes } : d,
        ),
      );
    } else {
      onAmenityDetailsChange([...amenityDetails, { amenityId, notes }]);
    }
  }

  function toggleItem(item: WizardFeatureItem) {
    const on = isSelected(item);
    if (on) {
      const optionExtra =
        item.options?.flatMap((o) => o.amenityIds ?? []) ?? [];
      const remove = new Set([item.amenityId, ...optionExtra]);
      onAmenitiesChange(amenities.filter((id) => !remove.has(id)));
      onAmenityDetailsChange(
        amenityDetails.filter((d) => d.amenityId !== item.amenityId),
      );
    } else {
      onAmenitiesChange([...amenities, item.amenityId]);
    }
  }

  function selectOption(item: WizardFeatureItem, optionLabel: string) {
    const option = item.options?.find((o) => o.label === optionLabel);
    if (!option) return;

    // Drop previous option amenity ids for this item
    const allOptionIds = new Set(
      (item.options ?? []).flatMap((o) => o.amenityIds ?? []),
    );
    let next = amenities.filter((id) => !allOptionIds.has(id) || id === item.amenityId);
    if (!next.includes(item.amenityId)) next = [...next, item.amenityId];
    if (option.amenityIds) {
      for (const id of option.amenityIds) {
        if (!next.includes(id)) next.push(id);
      }
    }
    // For heating, primary amenity may swap
    if (item.id === 'heating' && option.amenityIds?.[0]) {
      next = next.filter((id) => id !== item.amenityId);
      if (!next.includes(option.amenityIds[0])) next.push(option.amenityIds[0]);
    }
    onAmenitiesChange(next);
    upsertNotes(item.amenityId, option.notes ?? optionLabel);
  }

  function countInSection(section: 'features' | 'amenities'): number {
    return WIZARD_FEATURE_ITEMS.filter((item) => {
      const g = FEATURE_GROUPS.find((x) => x.id === item.groupId);
      if (!g || g.section !== section) return false;
      if (visFor(item) === '-') return false;
      return isSelected(item);
    }).length;
  }

  function renderGroup(groupId: string) {
    const group = FEATURE_GROUPS.find((g) => g.id === groupId);
    if (!group) return null;

    const items = WIZARD_FEATURE_ITEMS.filter((i) => i.groupId === groupId)
      .map((i) => ({ item: i, vv: visFor(i) }))
      .filter((x) => x.vv !== '-');

    if (!items.length) return null;

    const open = Boolean(expanded[groupId]);
    const moreHidden = items.filter(
      (x) => x.vv === 'm' && !isSelected(x.item),
    );
    const shown = open
      ? items
      : items.filter((x) => x.vv === 'd' || isSelected(x.item));
    const selectedCount = items.filter((x) => isSelected(x.item)).length;
    const label =
      group.id === 'building' && kind === 'room'
        ? group.roomLabel ?? group.label
        : group.label;
    const Icon = GROUP_ICONS[group.icon];

    return (
      <div
        key={group.id}
        className="rounded-[16px] border border-[#e3e8ef] p-4 mt-3"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-7 h-7 rounded-lg bg-[#f1f4f8] flex items-center justify-center text-[#5b6b80]">
            <Icon size={16} strokeWidth={1.75} />
          </span>
          <p
            className="text-[13.5px] font-semibold text-[#1e293b]"
            style={{ fontFamily: 'Archivo,sans-serif' }}
          >
            {label}
          </p>
          {selectedCount > 0 && (
            <span className="ml-auto text-[12px] font-semibold text-[#136C9E]">
              {selectedCount} selected
            </span>
          )}
        </div>

        {shown.length === 0 ? (
          <p className="text-[12.5px] text-[#64748b]">
            Less common for this property type. Open “Show more” to add any that apply.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {shown.map(({ item }) => {
              const on = isSelected(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleItem(item)}
                  className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] px-3 py-2 text-[13.5px] transition-all"
                  style={{
                    borderColor: on ? '#136C9E' : '#d5dde7',
                    background: on ? '#f3f8fd' : '#fff',
                    color: on ? '#1e4f7b' : '#1e293b',
                    fontWeight: on ? 500 : 400,
                    fontFamily: 'Archivo,sans-serif',
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0"
                    style={{
                      borderColor: on ? '#136C9E' : '#b8c4d3',
                      background: on ? '#136C9E' : 'transparent',
                    }}
                  >
                    <Check
                      size={11}
                      className="text-white"
                      strokeWidth={3}
                      style={{ opacity: on ? 1 : 0 }}
                    />
                  </span>
                  {item.label}
                  {item.options && !on && (
                    <span
                      className="w-[5px] h-[5px] rounded-full bg-[#9db0c6]"
                      title="Asks a follow-up question"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {shown
          .filter(({ item }) => item.options && isSelected(item))
          .map(({ item }) => {
            const cur = detailNotes(amenityDetails, item.amenityId);
            return (
              <div
                key={`${item.id}-opts`}
                className="mt-2.5 flex flex-wrap items-center gap-2 rounded-[10px] bg-[#f7f9fc] px-3 py-2.5 text-[12.5px]"
              >
                <b className="font-semibold mr-1">{item.label}:</b>
                {item.options!.map((o) => {
                  const on = cur === o.label || cur === o.notes;
                  return (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => selectOption(item, o.label)}
                      className="rounded-full border-[1.5px] px-3 py-1 text-[12.5px] font-medium transition-all"
                      style={{
                        borderColor: on ? '#136C9E' : '#d5dde7',
                        background: on ? '#136C9E' : '#fff',
                        color: on ? '#fff' : '#1e293b',
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
                {!cur && (
                  <span className="ml-auto text-[11.5px] text-[#b54708]">
                    Choose one
                  </span>
                )}
              </div>
            );
          })}

        {(moreHidden.length > 0 || open) && (
          <button
            type="button"
            onClick={() =>
              setExpanded((prev) => ({ ...prev, [groupId]: !open }))
            }
            className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#136C9E] bg-transparent border-0 p-0"
          >
            {open
              ? 'Show fewer'
              : `Show ${moreHidden.length} more`}
            <ChevronDown
              size={14}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
    );
  }

  if (!subtypeId) {
    return (
      <div className="space-y-5">
        <div className="p-4 rounded-[16px] border border-amber-200 bg-amber-50 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p
              className="text-[13.5px] font-semibold text-amber-900"
              style={{ fontFamily: 'Archivo,sans-serif' }}
            >
              Select a property subtype first
            </p>
            <p className="text-[12.5px] text-amber-800 mt-1">
              Features & amenities depend on the property type. Go back to Step 1 and choose a subtype.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all"
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Back to Property Details
        </button>
      </div>
    );
  }

  // Orphan catalogue amenities (selected but not in wizard feature list)
  const wizardAmenityIds = new Set(WIZARD_FEATURE_ITEMS.map((i) => i.amenityId));
  const orphanIds = amenities.filter((id) => {
    if (wizardAmenityIds.has(id)) return false;
    // option extras + letting terms may appear — hide pure option extras that belong to selected parents
    const parent = WIZARD_FEATURE_ITEMS.find((i) =>
      i.options?.some((o) => o.amenityIds?.includes(id)),
    );
    if (parent && amenities.includes(parent.amenityId)) return false;
    if (parent && parent.id === 'heating') return false;
    return true;
  });

  const fc = countInSection('features');
  const ac = countInSection('amenities');

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-center flex-wrap gap-2.5 -mt-2 mb-2 text-[13px] text-[#64748b]">
        <span>Showing options for</span>
        <span
          className="px-3 py-1 rounded-full text-[13px] font-semibold border"
          style={{
            background: '#eaf3fb',
            color: '#1e4f7b',
            borderColor: '#b7d3ec',
          }}
        >
          {typeDisplay}
          {kind === 'flat' && floorNumber ? ` · ${floorNumber}` : ''}
        </span>
        {onChangeType && (
          <button
            type="button"
            onClick={onChangeType}
            className="text-[#136C9E] font-semibold text-[13px] bg-transparent border-0 p-0"
          >
            Change
          </button>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-6 mb-0.5">
        <h3
          className="text-[17px] font-bold text-[#1e293b] m-0"
          style={{ fontFamily: 'Archivo,sans-serif' }}
        >
          Features
        </h3>
        {fc > 0 && (
          <span className="text-[12.5px] font-semibold text-[#136C9E]">
            {fc} selected
          </span>
        )}
      </div>
      <p className="text-[13px] text-[#64748b] mb-1">
        Part of the home itself: outdoor space, parking, rooms, heating and access.
      </p>
      {FEATURE_GROUPS.filter((g) => g.section === 'features').map((g) =>
        renderGroup(g.id),
      )}

      <div className="flex items-baseline justify-between mt-7 mb-0.5">
        <h3
          className="text-[17px] font-bold text-[#1e293b] m-0"
          style={{ fontFamily: 'Archivo,sans-serif' }}
        >
          Amenities
        </h3>
        {ac > 0 && (
          <span className="text-[12.5px] font-semibold text-[#136C9E]">
            {ac} selected
          </span>
        )}
      </div>
      <p className="text-[13px] text-[#64748b] mb-1">
        What’s provided for the tenant: appliances, broadband and shared facilities.
      </p>
      {FEATURE_GROUPS.filter((g) => g.section === 'amenities').map((g) =>
        renderGroup(g.id),
      )}

      {orphanIds.length > 0 && (
        <div className="rounded-[16px] border border-[#e3e8ef] p-4 mt-4">
          <p
            className="text-[13.5px] font-semibold text-[#1e293b] mb-3"
            style={{ fontFamily: 'Archivo,sans-serif' }}
          >
            Also selected
          </p>
          <div className="flex flex-wrap gap-2">
            {orphanIds.map((id) => {
              const def = getAmenityById(id);
              const on = true;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    onAmenitiesChange(amenities.filter((x) => x !== id))
                  }
                  className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] px-3 py-2 text-[13.5px]"
                  style={{
                    borderColor: '#136C9E',
                    background: '#f3f8fd',
                    color: '#1e4f7b',
                    fontFamily: 'Archivo,sans-serif',
                  }}
                >
                  <span className="w-4 h-4 rounded-[5px] bg-[#136C9E] flex items-center justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                  {def?.label ?? id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5">
        <label className="block text-[13px] font-semibold text-[#334155] mb-1.5" style={{ fontFamily: 'Archivo,sans-serif' }}>
          Additional features{' '}
          <span className="text-[#94a3b8] font-normal">(optional)</span>
        </label>
        <textarea
          value={additionalFeatures}
          onChange={(e) => onAdditionalFeaturesChange(e.target.value)}
          rows={3}
          placeholder="Anything else renters should know that is not listed above…"
          className="w-full min-h-[80px] bg-white border border-[#e2e8f0] rounded-2xl px-4 py-3 font-[Nunito_Sans,sans-serif] text-[14px] text-[#1e293b] outline-none focus:border-[#136C9E] focus:ring-[3.5px] focus:ring-[rgba(19,108,158,0.12)] resize-y"
        />
      </div>

      <div className="pt-3 space-y-3">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
          style={{
            background: '#136C9E',
            fontFamily: 'Archivo,sans-serif',
            boxShadow: '0 4px 14px rgba(19,108,158,0.28)',
          }}
        >
          Continue <ArrowRight size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all"
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Back to Property Details
        </button>
      </div>
    </div>
  );
}

export default PropertyAmenitiesStep;

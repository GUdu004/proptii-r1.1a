/**
 * AddPropertyWizard
 *
 * Multi-step wizard for adding/editing a property listing.
 * Uses the shared UK property catalogue for type hierarchy and amenities.
 *
 * Steps:
 *   1 — Property Type (residential cards + subtype chips; commercial/land keep hierarchy)
 *   2 — Property Details (conditional form + letting terms)
 *   3 — Features & Amenities
 *   4 — Photos & Notes
 *   5 — Compliance
 *   6 — Review & Publish
 *
 * Design system: Archivo headings, Nunito Sans body, primary #136C9E, accent #DC5F12.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Home,
  Building2,
  Users,
  Briefcase,
  HelpCircle,
  MapPin,
  PoundSterling,
  BedDouble,
  Bath,
  Maximize2,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Plus,
  Check,
  Map as MapIcon,
  Trees,
  Warehouse,
  Layout,
  Store,
  Factory,
  Hotel,
  Dumbbell,
  Landmark,
  Layers,
  Sparkles,
  Calendar,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import {
  formatMissingVerification,
  getPublishGateStatus,
} from '../services/verificationService';
import {
  getAllCategories,
  getTypeGroupsForCategory,
  getSubtypeById,
  getAmenitiesForSubtype,
  getAmenityById,
  getAmenityLabel,
  subtypeLabel,
  resolveClassificationFromStoredType,
  type PropertyCategoryId,
  type AmenityAccessType,
} from '../../../shared/propertyCatalogue';
import { PropertyAmenitiesStep, type AmenityDetail } from './PropertyAmenitiesStep';
import {
  PropertyComplianceStep,
  isDepositCommitmentSatisfied,
  type DepositCommitment,
  type WizardComplianceDocuments,
} from './PropertyComplianceStep';
import { PropertyTypeStep } from './addProperty/PropertyTypeStep';
import {
  BILLS_OPTIONS,
  FURNISHING_OPTIONS,
  LETTING_TERM_AMENITY_IDS,
  LISTING_TAG_OPTIONS,
  PETS_OPTIONS,
  WIZARD_FEATURE_ITEMS,
  WIZARD_TYPE_CARDS,
  featureVisibility,
  getWizardKind,
  lettingTermsToAmenityIds,
  resolveWizardTypeFromSubtype,
} from './addProperty/flowConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardPropertyData {
  propertyType: string | null; // store SUBTYPE id (or legacy id while incomplete)
  propertyCategory: 'residential' | 'commercial' | 'land' | null;
  propertyTypeGroup: string | null;
  propertySubtype: string | null; // same as propertyType when complete
  /** Wizard Step 1 card id (house/flat/bungalow/studio/room/other) */
  wizardTypeCard?: string | null;
  address: string;
  monthlyRent: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  // residential extras
  receptionRooms?: string;
  floorNumber?: string;
  constructionType?: string;
  tenure?: string;
  epcRating?: string;
  // Step 2 letting terms / room extras
  furnishing?: string;
  billsIncluded?: string;
  petsPolicy?: string;
  listingTags?: string[];
  availableFrom?: string;
  roomSize?: string;
  housemates?: string;
  // commercial extras
  propertyUse?: string;
  numberOfFloors?: string;
  buildingSpecification?: string;
  permittedUse?: string;
  businessRates?: string;
  // land extras
  landArea?: string;
  planningStatus?: string;
  landAccess?: string;
  landUtilities?: string;
  boundaries?: string;
  /** @deprecated Prefer complianceDocuments — kept for legacy draft sync */
  uploadedDocuments: File[];
  complianceDocuments: WizardComplianceDocuments;
  /** Listing-time deposit commitment (replaces deposit-protection upload) */
  takesDeposit?: 'yes' | 'no' | null;
  depositAmount?: string;
  depositProtectionConfirmed?: boolean;
  depositProtectedBy?: 'landlord' | 'agent' | null;
  /** Step 4 photo authenticity confirmation */
  photosConfirmed?: boolean;
  amenities: string[];
  amenityDetails?: Array<{
    amenityId: string;
    accessType?: AmenityAccessType;
    additionalCost?: boolean;
    notes?: string;
  }>;
  additionalFeatures?: string;
  images: string[];
  imageFiles: File[];
  description: string;
  additionalNotes: string;
  status?: 'vacant' | 'occupied' | 'under-renovation' | 'draft';
}

interface AddPropertyWizardProps {
  initialData?: Partial<WizardPropertyData>;
  isEditing?: boolean;
  isPublishing?: boolean;
  isSavingForTenant?: boolean;
  isSavingDraft?: boolean;
  onPublish: (data: WizardPropertyData) => Promise<void>;
  onBulkImport?: () => void;
  onBack: () => void;
  onAddTenant?: (data: WizardPropertyData) => void;
  onSaveDraft?: (data: WizardPropertyData) => Promise<void>;
  onVerifyAccount?: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type FieldErrors = Partial<Record<string, string>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { step: 1 as Step, label: 'Step 1:', sub: 'Property Type', icon: Home },
  { step: 2 as Step, label: 'Step 2:', sub: 'Property Details', icon: MapPin },
  { step: 3 as Step, label: 'Step 3:', sub: 'Features & Amenities', icon: Sparkles },
  { step: 4 as Step, label: 'Step 4:', sub: 'Photos & Notes', icon: ImageIcon },
  { step: 5 as Step, label: 'Step 5:', sub: 'Compliance', icon: FileText },
  { step: 6 as Step, label: 'Step 6:', sub: 'Review & Publish', icon: CheckCircle },
];

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Building2,
  Briefcase,
  Map: MapIcon,
  Trees,
  Warehouse,
  Users,
  Layout,
  Store,
  Factory,
  Hotel,
  Dumbbell,
  Landmark,
  Layers,
  HelpCircle,
};

function catalogueIcon(name?: string): LucideIcon {
  if (!name) return HelpCircle;
  return ICON_MAP[name] ?? HelpCircle;
}

const PLANNING_OPTIONS = [
  'Full planning',
  'Outline planning',
  'Permission in principle',
  'Agricultural',
  'No planning',
  'Other',
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const INP = [
  'w-full h-12 bg-white border border-[#e2e8f0] rounded-2xl px-4',
  'font-[Nunito_Sans,sans-serif] text-[14px] text-[#1e293b]',
  'transition-all outline-none',
  'hover:border-[#cbd5e1]',
  'focus:border-[#136C9E] focus:ring-[3.5px] focus:ring-[rgba(19,108,158,0.12)]',
  'placeholder:text-[#94a3b8] placeholder:font-normal',
].join(' ');

const INP_ERR = 'border-[#ef4444] bg-[#fffafb]';
const LBL = 'block text-[13px] font-semibold text-[#334155] mb-1.5 font-[Archivo,sans-serif]';
const HINT = 'flex items-center gap-1 text-[11.5px] text-[#dc2626] mt-1.5';
const SEL = `${INP} appearance-none`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Fld({
  label, required, error, icon: Icon, children, hint,
}: {
  label: string; required?: boolean; error?: string;
  icon?: React.ElementType; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className={LBL}>
        {label}{required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none flex">
            <Icon size={17} strokeWidth={2} />
          </span>
        )}
        {children}
      </div>
      {hint && !error && (
        <p className="text-[11.5px] text-[#64748b] mt-1.5">{hint}</p>
      )}
      {error && (
        <p className={HINT}>
          <AlertTriangle size={12} />{error}
        </p>
      )}
    </div>
  );
}

function StepItem({
  s, current, done, onClick,
}: {
  s: typeof STEPS[0]; current: boolean; done: boolean; onClick: () => void;
}) {
  const Icon = s.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-3.5 px-3.5 py-3 rounded-[18px] w-full text-left border transition-all duration-200',
        current
          ? 'bg-[#edf6fb] border-[rgba(19,108,158,0.15)] shadow-[0_4px_12px_rgba(19,108,158,0.05)]'
          : 'bg-transparent border-transparent hover:bg-[#f8fafc]',
      ].join(' ')}
    >
      <span
        className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
        style={{ background: current ? '#dcf1fc' : '#f1f5f9' }}
      >
        <Icon size={20} strokeWidth={2} style={{ color: current ? '#136C9E' : '#94a3b8' }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight"
          style={{ color: current ? '#0c4a6e' : '#1e293b', fontFamily: 'Archivo,sans-serif' }}>
          {s.label}
        </p>
        <p className="text-[12.5px] mt-0.5 truncate"
          style={{ color: current ? '#0284c7' : '#64748b', fontFamily: 'Archivo,sans-serif', fontWeight: current ? 600 : 400 }}>
          {s.sub}
        </p>
      </div>
      <span className={[
        'w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all',
        done
          ? 'bg-white border-2 border-[#DC5F12] shadow-[0_2px_6px_rgba(220,95,18,0.2)]'
          : 'bg-white border-[1.5px] border-[#cbd5e1]',
      ].join(' ')}>
        <CheckCircle size={13} className={done ? 'text-[#DC5F12]' : 'text-[#cbd5e1]'} />
      </span>
    </button>
  );
}

function SelectCard({
  selected, title, description, icon: Icon, onClick,
}: {
  selected: boolean; title: string; description?: string; icon: LucideIcon; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-start gap-2 p-4 rounded-[18px] border-2 transition-all text-left hover:-translate-y-0.5"
      style={{
        borderColor: selected ? '#136C9E' : '#e2e8f0',
        background: selected ? '#f0f8fd' : '#fff',
        boxShadow: selected ? '0 4px 16px rgba(19,108,158,0.12)' : 'none',
      }}
    >
      <span
        className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: selected ? '#136C9E' : '#f1f5f9' }}
      >
        <Check size={11} className="text-white" strokeWidth={3} />
      </span>
      <span
        className="w-10 h-10 rounded-[12px] flex items-center justify-center"
        style={{ background: selected ? '#dcf1fc' : '#f8fafc' }}
      >
        <Icon size={20} style={{ color: selected ? '#136C9E' : '#94a3b8' }} />
      </span>
      <div>
        <p className="text-[13.5px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
          {title}
        </p>
        {description && (
          <p className="text-[11.5px] text-[#64748b] mt-0.5 leading-snug">{description}</p>
        )}
      </div>
    </button>
  );
}

// ─── Blank form / draft helpers ───────────────────────────────────────────────

function hydrateClassification(init?: Partial<WizardPropertyData>): Pick<
  WizardPropertyData,
  'propertyCategory' | 'propertyTypeGroup' | 'propertySubtype' | 'propertyType'
> {
  let propertyCategory = init?.propertyCategory ?? null;
  let propertyTypeGroup = init?.propertyTypeGroup ?? null;
  let propertySubtype = init?.propertySubtype ?? null;
  let propertyType = init?.propertyType ?? null;

  const seed = propertySubtype || propertyType;
  if (seed && (!propertyCategory || !propertyTypeGroup || !propertySubtype)) {
    const resolved = resolveClassificationFromStoredType(seed);
    if (resolved) {
      propertyCategory = propertyCategory ?? resolved.categoryId;
      propertyTypeGroup = propertyTypeGroup ?? resolved.typeGroupId;
      propertySubtype = propertySubtype ?? resolved.subtypeId;
      propertyType = propertySubtype;
    }
  }

  return { propertyCategory, propertyTypeGroup, propertySubtype, propertyType };
}

function blank(init?: Partial<WizardPropertyData>): WizardPropertyData {
  const classification = hydrateClassification(init);
  const fromSubtype = resolveWizardTypeFromSubtype(
    classification.propertySubtype || classification.propertyType,
  );
  return {
    ...classification,
    wizardTypeCard: init?.wizardTypeCard ?? fromSubtype.cardId,
    address: init?.address ?? '',
    monthlyRent: init?.monthlyRent ?? '',
    bedrooms: init?.bedrooms ?? '',
    bathrooms: init?.bathrooms ?? '',
    squareFootage: init?.squareFootage ?? '',
    receptionRooms: init?.receptionRooms ?? '',
    floorNumber: init?.floorNumber ?? '',
    constructionType: init?.constructionType ?? '',
    tenure: init?.tenure ?? '',
    epcRating: init?.epcRating ?? '',
    furnishing: init?.furnishing ?? '',
    billsIncluded: init?.billsIncluded ?? '',
    petsPolicy: init?.petsPolicy ?? 'Considered on request',
    listingTags: init?.listingTags ?? [],
    availableFrom: init?.availableFrom ?? '',
    roomSize: init?.roomSize ?? '',
    housemates: init?.housemates ?? '',
    propertyUse: init?.propertyUse ?? '',
    numberOfFloors: init?.numberOfFloors ?? '',
    buildingSpecification: init?.buildingSpecification ?? '',
    permittedUse: init?.permittedUse ?? '',
    businessRates: init?.businessRates ?? '',
    landArea: init?.landArea ?? '',
    planningStatus: init?.planningStatus ?? '',
    landAccess: init?.landAccess ?? '',
    landUtilities: init?.landUtilities ?? '',
    boundaries: init?.boundaries ?? '',
    uploadedDocuments: init?.uploadedDocuments ?? [],
    complianceDocuments: init?.complianceDocuments ?? {},
    takesDeposit: init?.takesDeposit ?? null,
    depositAmount: init?.depositAmount ?? '',
    depositProtectionConfirmed: init?.depositProtectionConfirmed ?? false,
    depositProtectedBy: init?.depositProtectedBy ?? null,
    photosConfirmed: init?.photosConfirmed ?? false,
    amenities: init?.amenities ?? [],
    amenityDetails: init?.amenityDetails ?? [],
    additionalFeatures: init?.additionalFeatures ?? '',
    images: init?.images ?? [],
    imageFiles: init?.imageFiles ?? [],
    description: init?.description ?? '',
    additionalNotes: init?.additionalNotes ?? '',
    status: init?.status,
  };
}

function complianceDocsForGate(docs: WizardComplianceDocuments) {
  return (Object.entries(docs) as Array<[string, { file?: File | null; url?: string; fileName?: string; epcRating?: string }]> )
    .filter(([, e]) => Boolean(e?.file || e?.url || e?.fileName))
    .map(([type, e]) => ({
      type,
      epcRating: e?.epcRating,
      rating: e?.epcRating,
    }));
}

const DRAFT_STORAGE_KEY = 'proptii_property_wizard_draft';

function loadSavedDraft(): Partial<WizardPropertyData> | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function filterAmenitiesForSubtype(
  amenities: string[],
  amenityDetails: AmenityDetail[] | undefined,
  subtypeId: string | null,
  opts?: {
    wizardCardId?: string | null;
    chipLabel?: string | null;
    floorNumber?: string;
  },
): { amenities: string[]; amenityDetails: AmenityDetail[] } {
  if (!subtypeId) {
    return { amenities: [], amenityDetails: [] };
  }
  const allowed = new Set(
    getAmenitiesForSubtype(subtypeId, { includeLegacy: true }).map((a) => a.id),
  );
  const resolved = resolveWizardTypeFromSubtype(subtypeId);
  const cardId = opts?.wizardCardId ?? resolved.cardId;
  const chipLabel = opts?.chipLabel ?? resolved.chipLabel;
  const kind = getWizardKind(cardId, chipLabel);

  const wizardHidden = new Set<string>();
  if (kind) {
    for (const item of WIZARD_FEATURE_ITEMS) {
      const vis = featureVisibility(item, kind, {
        floorNumber: opts?.floorNumber,
        cardId,
        chipLabel,
      });
      if (vis === '-') {
        wizardHidden.add(item.amenityId);
        for (const o of item.options ?? []) {
          for (const id of o.amenityIds ?? []) wizardHidden.add(id);
        }
      }
    }
  }

  const nextAmenities = amenities.filter((id) => {
    if (LETTING_TERM_AMENITY_IDS.has(id)) return true;
    if (wizardHidden.has(id)) return false;
    if (allowed.has(id)) return true;
    const def = getAmenityById(id);
    return def ? allowed.has(def.id) : false;
  });
  const nextDetails = (amenityDetails ?? []).filter((d) =>
    nextAmenities.includes(d.amenityId),
  );
  return { amenities: nextAmenities, amenityDetails: nextDetails };
}

function mergeLettingTermAmenities(
  amenities: string[],
  terms: {
    furnishing?: string | null;
    billsIncluded?: string | null;
    petsPolicy?: string | null;
    listingTags?: string[];
  },
): string[] {
  const without = amenities.filter((id) => !LETTING_TERM_AMENITY_IDS.has(id));
  return [
    ...without,
    ...lettingTermsToAmenityIds({
      furnishing: terms.furnishing,
      bills: terms.billsIncluded,
      pets: terms.petsPolicy,
      tags: terms.listingTags,
    }),
  ];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AddPropertyWizard({
  initialData, isEditing = false, isPublishing = false,
  onPublish, onBulkImport, onBack, onAddTenant, isSavingForTenant = false,
  onSaveDraft, isSavingDraft = false, onVerifyAccount,
}: AddPropertyWizardProps) {
  const [form, setForm] = useState<WizardPropertyData>(() => {
    if (initialData) return blank(initialData);
    if (!isEditing) {
      const draft = loadSavedDraft();
      if (draft && (draft.address || draft.propertyType || draft.propertySubtype || draft.monthlyRent || draft.description)) {
        return blank(draft);
      }
    }
    return blank();
  });
  /** Step 1 sub-pages: category → type → subtype (separate screens, not stacked) */
  type TypePage = 'category' | 'type' | 'subtype';
  const [typePage, setTypePage] = useState<TypePage>(() => {
    const seed = blank(initialData);
    if (seed.propertySubtype || (seed.propertyType && getSubtypeById(seed.propertyType || ''))) {
      return 'subtype';
    }
    if (seed.propertyTypeGroup) return 'subtype';
    if (seed.propertyCategory) return 'type';
    return 'category';
  });
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState<Record<Step, boolean>>({
    1: false, 2: false, 3: false, 4: false, 5: false, 6: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGE] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [reviewAmenitiesOpen, setReviewAmenitiesOpen] = useState(false);
  const [showModeModal, setShowModeModal] = useState(!isEditing && !!onBulkImport);
  const [modeChoice, setModeChoice] = useState<'single' | 'bulk'>('single');
  const [publishGate, setPublishGate] = useState<{
    loading: boolean;
    gateEnabled: boolean;
    canPublish: boolean;
    missing: string[];
  }>({ loading: false, gateEnabled: false, canPublish: true, missing: [] });

  useEffect(() => {
    if (initialData) setForm(blank(initialData));
  }, [JSON.stringify(initialData)]);

  useEffect(() => {
    if (step !== 6 || isEditing) return;
    let cancelled = false;
    setPublishGate((prev) => ({ ...prev, loading: true }));
    void getPublishGateStatus({
      propertyDocs: complianceDocsForGate(form.complianceDocuments),
      depositSatisfied: isDepositCommitmentSatisfied({
        takesDeposit: form.takesDeposit ?? null,
        depositAmount: form.depositAmount ?? '',
        depositProtectionConfirmed: Boolean(form.depositProtectionConfirmed),
        depositProtectedBy: form.depositProtectedBy ?? null,
      }),
    })
      .then((status) => {
        if (cancelled) return;
        setPublishGate({
          loading: false,
          gateEnabled: status.gateEnabled,
          canPublish: status.canPublish,
          missing: status.missing,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPublishGate({ loading: false, gateEnabled: false, canPublish: true, missing: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [
    step,
    isEditing,
    form.complianceDocuments,
    form.takesDeposit,
    form.depositAmount,
    form.depositProtectionConfirmed,
    form.depositProtectedBy,
  ]);

  useEffect(() => {
    if (isEditing) return;
    try {
      const draftPayload = {
        propertyType: form.propertyType,
        propertyCategory: form.propertyCategory,
        propertyTypeGroup: form.propertyTypeGroup,
        propertySubtype: form.propertySubtype,
        wizardTypeCard: form.wizardTypeCard,
        address: form.address,
        monthlyRent: form.monthlyRent,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        squareFootage: form.squareFootage,
        receptionRooms: form.receptionRooms,
        floorNumber: form.floorNumber,
        constructionType: form.constructionType,
        tenure: form.tenure,
        epcRating: form.epcRating,
        furnishing: form.furnishing,
        billsIncluded: form.billsIncluded,
        petsPolicy: form.petsPolicy,
        listingTags: form.listingTags,
        availableFrom: form.availableFrom,
        roomSize: form.roomSize,
        housemates: form.housemates,
        takesDeposit: form.takesDeposit,
        depositAmount: form.depositAmount,
        depositProtectionConfirmed: form.depositProtectionConfirmed,
        depositProtectedBy: form.depositProtectedBy,
        photosConfirmed: form.photosConfirmed,
        propertyUse: form.propertyUse,
        numberOfFloors: form.numberOfFloors,
        buildingSpecification: form.buildingSpecification,
        permittedUse: form.permittedUse,
        businessRates: form.businessRates,
        landArea: form.landArea,
        planningStatus: form.planningStatus,
        landAccess: form.landAccess,
        landUtilities: form.landUtilities,
        boundaries: form.boundaries,
        amenities: form.amenities,
        amenityDetails: form.amenityDetails,
        additionalFeatures: form.additionalFeatures,
        description: form.description,
        additionalNotes: form.additionalNotes,
        status: form.status,
        complianceDocuments: Object.fromEntries(
          Object.entries(form.complianceDocuments || {}).map(([key, entry]) => [
            key,
            {
              fileName: entry?.fileName,
              url: entry?.url,
              storagePath: entry?.storagePath,
              epcRating: entry?.epcRating,
            },
          ]),
        ),
      };
      if (form.address || form.propertyType || form.propertySubtype || form.monthlyRent || form.description) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      }
    } catch { /* ignore quota */ }
  }, [form, isEditing]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function sf<K extends keyof WizardPropertyData>(k: K, v: WizardPropertyData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
    if ((errors as any)[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
    if (globalError) setGE(null);
  }

  const resolvedSubtypeId = form.propertySubtype || form.propertyType;
  const subtypeDef = resolvedSubtypeId ? getSubtypeById(resolvedSubtypeId) : undefined;
  const detailsForm = subtypeDef?.detailsForm ?? 'residential';

  const categories = useMemo(() => getAllCategories(), []);
  const typeGroups = useMemo(
    () => (form.propertyCategory ? getTypeGroupsForCategory(form.propertyCategory) : []),
    [form.propertyCategory],
  );
  const selectedGroup = useMemo(
    () => typeGroups.find((g) => g.id === form.propertyTypeGroup) ?? null,
    [typeGroups, form.propertyTypeGroup],
  );

  function selectCategory(categoryId: PropertyCategoryId) {
    setForm((prev) => {
      const same = prev.propertyCategory === categoryId;
      if (same) return prev;
      return {
        ...prev,
        propertyCategory: categoryId,
        propertyTypeGroup: null,
        propertySubtype: null,
        propertyType: null,
        wizardTypeCard: null,
        amenities: [],
        amenityDetails: [],
      };
    });
    setTypePage('type');
    if (errors.propertyType) setErrors((prev) => ({ ...prev, propertyType: undefined }));
    if (globalError) setGE(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function selectTypeGroup(groupId: string) {
    setForm((prev) => {
      if (prev.propertyTypeGroup === groupId) return prev;
      return {
        ...prev,
        propertyTypeGroup: groupId,
        propertySubtype: null,
        propertyType: null,
        wizardTypeCard: null,
        amenities: [],
        amenityDetails: [],
      };
    });
    setTypePage('subtype');
    if (errors.propertyType) setErrors((prev) => ({ ...prev, propertyType: undefined }));
    if (globalError) setGE(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function applySubtype(
    subtypeId: string,
    wizardCardId: string | null,
    chipLabel: string | null,
  ) {
    const resolved = resolveClassificationFromStoredType(subtypeId);
    setForm((prev) => {
      const filtered = filterAmenitiesForSubtype(
        prev.amenities,
        prev.amenityDetails,
        subtypeId,
        {
          wizardCardId,
          chipLabel,
          floorNumber: prev.floorNumber,
        },
      );
      const next: WizardPropertyData = {
        ...prev,
        propertySubtype: subtypeId,
        propertyType: subtypeId,
        propertyCategory: resolved?.categoryId ?? prev.propertyCategory ?? 'residential',
        propertyTypeGroup: resolved?.typeGroupId ?? prev.propertyTypeGroup,
        wizardTypeCard: wizardCardId,
        amenities: filtered.amenities,
        amenityDetails: filtered.amenityDetails,
      };
      if (wizardCardId === 'studio') {
        next.bedrooms = '0';
        next.bathrooms = '1';
      }
      if (wizardCardId === 'room' && !next.billsIncluded) {
        next.billsIncluded = 'All included';
      }
      return next;
    });
    if (errors.propertyType) setErrors((prev) => ({ ...prev, propertyType: undefined }));
    if (globalError) setGE(null);
  }

  function selectSubtype(subtypeId: string) {
    const resolved = resolveWizardTypeFromSubtype(subtypeId);
    applySubtype(subtypeId, resolved.cardId, resolved.chipLabel);
  }

  function selectWizardCard(cardId: string) {
    const card = WIZARD_TYPE_CARDS.find((c) => c.id === cardId);
    if (!card) return;
    if (card.autoSubtypeId) {
      applySubtype(card.autoSubtypeId, cardId, null);
      return;
    }
    setForm((prev) => {
      if (prev.wizardTypeCard === cardId && prev.propertySubtype) return prev;
      return {
        ...prev,
        wizardTypeCard: cardId,
        propertyCategory: 'residential',
        propertyTypeGroup: card.typeGroupId,
        propertySubtype: null,
        propertyType: null,
      };
    });
    if (errors.propertyType) setErrors((prev) => ({ ...prev, propertyType: undefined }));
    if (globalError) setGE(null);
  }

  function selectWizardSubtype(cardId: string, chipLabel: string, subtypeId: string) {
    applySubtype(subtypeId, cardId, chipLabel);
  }

  function goBackTypePage() {
    if (typePage === 'subtype') {
      setTypePage('type');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (typePage === 'type') {
      setTypePage('category');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  function v1(): FieldErrors {
    const e: FieldErrors = {};
    const subtype = form.propertySubtype || form.propertyType;
    if (!subtype || !getSubtypeById(subtype)) {
      e.propertyType = 'Please select a property subtype';
    }
    return e;
  }

  function v2(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.address.trim()) e.address = 'Property address is required';
    const rent = parseFloat(form.monthlyRent);
    if (!form.monthlyRent || isNaN(rent) || rent <= 0) e.monthlyRent = 'Enter a valid monthly rent';
    if (form.description.trim().length < 10) {
      e.description = 'Property description must be at least 10 characters';
    }

    const wizardKind = getWizardKind(
      form.wizardTypeCard ?? resolveWizardTypeFromSubtype(resolvedSubtypeId).cardId,
      resolveWizardTypeFromSubtype(resolvedSubtypeId).chipLabel,
    );

    if (detailsForm === 'residential') {
      if (!form.furnishing) e.furnishing = 'Choose a furnishing option';

      if (wizardKind === 'studio') {
        // bedrooms/bathrooms locked
      } else if (wizardKind === 'room') {
        if (!form.roomSize) e.roomSize = 'Choose a room size';
        const beds = parseInt(form.bedrooms, 10);
        if (!form.bedrooms || isNaN(beds) || beds < 1 || beds > 50) {
          e.bedrooms = 'Enter bedrooms in the property';
        }
        const baths = parseInt(form.bathrooms, 10);
        if (!form.bathrooms || isNaN(baths) || baths < 1 || baths > 20) {
          e.bathrooms = 'Enter bathrooms in the property';
        }
      } else {
        const beds = parseInt(form.bedrooms, 10);
        if (!form.bedrooms || isNaN(beds) || beds < 0 || beds > 50) {
          e.bedrooms = 'Enter a valid number of bedrooms (0–50)';
        }
        const baths = parseInt(form.bathrooms, 10);
        if (!form.bathrooms || isNaN(baths) || baths < 0 || baths > 20) {
          e.bathrooms = 'Enter a valid number of bathrooms (0–20)';
        }
      }
    }
    return e;
  }

  const bedroomsValue = parseInt(form.bedrooms, 10);
  const bathroomsValue = parseInt(form.bathrooms, 10);
  const specWarning = React.useMemo(() => {
    if (detailsForm !== 'residential') return null;
    if (isNaN(bedroomsValue) || isNaN(bathroomsValue)) return null;
    if (bedroomsValue === 0 && bathroomsValue > 1) {
      return 'Studio properties typically have 1 bathroom. Please confirm this specification is intended.';
    }
    if (bedroomsValue === 1 && bathroomsValue >= 3) {
      return 'A 1-bedroom flat configured with 3 or more bathrooms is unusual. Please confirm this specification is intended.';
    }
    if (bedroomsValue >= 2 && bathroomsValue > bedroomsValue + 2) {
      return `Bathroom count (${bathroomsValue}) unusually exceeds bedroom count (${bedroomsValue}). Please verify this specification.`;
    }
    return null;
  }, [bedroomsValue, bathroomsValue, detailsForm]);

  function advance(fromStep: Step) {
    const validators: Partial<Record<Step, () => FieldErrors>> = { 1: v1, 2: v2 };
    const validate = validators[fromStep];
    if (validate) {
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length) { setGE('Please fix the errors above.'); return; }
    }
    if (fromStep === 2) {
      setForm((prev) => ({
        ...prev,
        amenities: mergeLettingTermAmenities(prev.amenities, {
          furnishing: prev.furnishing,
          billsIncluded: prev.billsIncluded,
          petsPolicy: prev.petsPolicy,
          listingTags: prev.listingTags,
        }),
      }));
    }
    if (fromStep === 4 && form.images.length > 0 && !form.photosConfirmed) {
      setErrors({ photosConfirmed: 'Confirm your photos meet the guidelines to continue' });
      setGE('Please confirm the photo guidelines.');
      return;
    }
    setErrors({}); setGE(null);
    setDone((prev) => ({ ...prev, [fromStep]: true }));
    const next = (fromStep + 1) as Step;
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncTypePageForForm(next: WizardPropertyData = form) {
    if (next.propertySubtype || (next.propertyType && getSubtypeById(next.propertyType))) {
      setTypePage('subtype');
    } else if (next.propertyTypeGroup) {
      setTypePage('subtype');
    } else if (next.propertyCategory) {
      setTypePage('type');
    } else {
      setTypePage('category');
    }
  }

  function goTo(s: Step) {
    if (s < step || done[s as Step] || s <= step) {
      if (s === 1) syncTypePageForForm();
      setStep(s);
    }
  }

  function goToStep1() {
    syncTypePageForForm();
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const publishBlocked =
    !isEditing &&
    publishGate.gateEnabled &&
    !publishGate.canPublish &&
    !publishGate.loading;

  const publishBlockedReason = publishBlocked
    ? `To publish, add these verification documents first: ${formatMissingVerification(publishGate.missing)}. You can save as draft meanwhile.`
    : '';

  async function handlePublish() {
    if (publishBlocked) {
      setGE(publishBlockedReason);
      return;
    }
    const e = { ...v1(), ...v2() };
    if (Object.keys(e).length) { setErrors(e); setGE('Fix the highlighted errors before publishing.'); return; }
    setGE(null);
    setPublishing(true);
    try {
      await onPublish(form);
      try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch {}
    } catch (err: any) {
      setGE(err?.message || 'Failed to save property. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      await onSaveDraft?.({ ...form, status: 'draft' });
    } catch (err: any) {
      setGE(err?.message || 'Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  }

  function addImages(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const blobs = arr.map((f) => URL.createObjectURL(f));
    sf('images', [...form.images, ...blobs]);
    sf('imageFiles', [...form.imageFiles, ...arr]);
  }

  function removeImage(i: number) {
    const img = form.images[i];
    const blobsBefore = form.images.slice(0, i).filter((u) => u.startsWith('blob:')).length;
    const newImages = form.images.filter((_, idx) => idx !== i);
    let newFiles = form.imageFiles;
    if (img?.startsWith('blob:')) newFiles = form.imageFiles.filter((_, fi) => fi !== blobsBefore);
    sf('images', newImages);
    sf('imageFiles', newFiles);
  }


  const reviewAmenitiesByCategory = useMemo((): Array<[string, string[]]> => {
    const map = new globalThis.Map<string, string[]>();
    for (const id of form.amenities) {
      const def = getAmenityById(id);
      const catLabel = def?.categoryId
        ? def.categoryId.replace(/_/g, ' ')
        : 'Other';
      const label = getAmenityLabel(id);
      const list = map.get(catLabel) ?? [];
      list.push(label);
      map.set(catLabel, list);
    }
    return Array.from(map.entries());
  }, [form.amenities]);

  // ─── Mode modal ──────────────────────────────────────────────────────────────

  if (showModeModal && onBulkImport) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'url(/images/pti_home_background.png) center/cover no-repeat', fontFamily: 'Nunito Sans,sans-serif' }}>
        <div style={{
          background: '#fff', borderRadius: 26, padding: '40px 44px', maxWidth: 500, width: '100%',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.06)',
        }}>
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4"
            style={{ background: '#eaf3f8', color: '#136C9E' }}>
            <Home size={24} />
          </div>
          <h2 className="text-[22px] font-bold mb-1.5"
            style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>
            How would you like to add properties?
          </h2>
          <p className="text-[13.5px] text-[#64748b] mb-7">
            Add a single property step-by-step, or import many at once from a spreadsheet.
          </p>

          <div className="flex flex-col gap-3 mb-7">
            <button type="button" onClick={() => setModeChoice('single')}
              className="flex items-center gap-4 p-5 rounded-[20px] text-left transition-all"
              style={{
                border: `2px solid ${modeChoice === 'single' ? '#136C9E' : '#e2e8f0'}`,
                background: modeChoice === 'single' ? '#f0f7fb' : '#fff',
              }}>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
                style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <Home size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-[#1e293b]"
                  style={{ fontFamily: 'Archivo,sans-serif' }}>Single Property</p>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">
                  Fill in details step-by-step for one property.
                </p>
              </div>
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: modeChoice === 'single' ? '#136C9E' : '#cbd5e1',
                  background: modeChoice === 'single' ? '#136C9E' : 'transparent',
                }}>
                {modeChoice === 'single' && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </button>

            <button type="button" onClick={() => setModeChoice('bulk')}
              className="flex items-center gap-4 p-5 rounded-[20px] text-left transition-all"
              style={{
                border: `2px solid ${modeChoice === 'bulk' ? '#DC5F12' : '#e2e8f0'}`,
                background: modeChoice === 'bulk' ? '#fff3ec' : '#fff',
              }}>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
                style={{ background: '#fff3ec', color: '#DC5F12' }}>
                <Upload size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-[#1e293b]"
                  style={{ fontFamily: 'Archivo,sans-serif' }}>Multiple Properties (CSV)</p>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">
                  Upload a spreadsheet to add up to 500 properties at once.
                </p>
              </div>
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: modeChoice === 'bulk' ? '#DC5F12' : '#cbd5e1',
                  background: modeChoice === 'bulk' ? '#DC5F12' : 'transparent',
                }}>
                {modeChoice === 'bulk' && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </button>
          </div>

          <button type="button"
            onClick={() => {
              if (modeChoice === 'bulk') { onBulkImport(); }
              else { setShowModeModal(false); }
            }}
            className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
            style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
            Continue <ArrowRight size={18} strokeWidth={2.5} />
          </button>

          <button type="button" onClick={onBack}
            className="w-full mt-3 text-[13px] text-[#64748b] hover:text-[#1e293b] font-semibold py-2 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === form.propertyCategory);
  const useLegacyTypeFlow =
    form.propertyCategory === 'commercial' || form.propertyCategory === 'land';
  const wizardResolved = resolveWizardTypeFromSubtype(resolvedSubtypeId);
  const wizardCardId = form.wizardTypeCard ?? wizardResolved.cardId;
  const wizardChipLabel = wizardResolved.chipLabel;
  const wizardKind = getWizardKind(wizardCardId, wizardChipLabel);

  const STEP_META: Record<Step, { title: string; sub: string }> = {
    1: useLegacyTypeFlow
      ? {
          title:
            typePage === 'category'
              ? 'Property Category'
              : typePage === 'type'
                ? 'Property Type'
                : 'Property Subtype',
          sub:
            typePage === 'category'
              ? 'Is this residential, commercial, or land?'
              : typePage === 'type'
                ? `Choose a ${selectedCategory?.label?.toLowerCase() || 'property'} type`
                : `Choose the specific ${selectedGroup?.label?.toLowerCase() || 'property'} subtype`,
        }
      : {
          title: 'Property Type',
          sub: 'Choose the type that best describes your property',
        },
    2: {
      title: 'Property Details',
      sub: 'Address, rent, letting terms and key specifications',
    },
    3: {
      title: 'Features & Amenities',
      sub: 'Select what this property has. Options are tailored to the property type.',
    },
    4: { title: 'Photos & Notes', sub: 'Add photos and any internal notes' },
    5: {
      title: 'Property compliance documents',
      sub: 'Required before making your property available to tenants. You can save a draft at any time.',
    },
    6: { title: 'Review & Publish', sub: isEditing ? 'Confirm changes before saving' : 'Check all details before going live' },
  };
  const { title, sub } = STEP_META[step];

  const complianceCount = Object.values(form.complianceDocuments || {}).filter(
    (e) => e && (e.file || e.url || e.fileName),
  ).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'url(/images/pti_home_background.png) center/cover no-repeat', fontFamily: 'Nunito Sans,sans-serif' }}>
      <header className="h-[68px] px-6 sm:px-8 md:px-12 sticky top-0 z-50 flex items-center justify-center"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.80)', borderBottom: '1px solid rgba(226,232,240,0.65)' }}>
        <div className="w-full max-w-[1060px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={onBack}
              className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
            <nav className="hidden sm:flex items-center gap-2 text-[13px] text-[#64748b]">
              <span className="text-[#94a3b8] text-[11px]">/</span>
              <span className="font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                {isEditing ? 'Edit Property' : 'Add New Property'}
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#64748b] font-medium" style={{ fontFamily: 'Archivo,sans-serif' }}>
              Step {step} of 6
            </span>
            <button type="button" onClick={onBack}
              className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all"
              title="Cancel">
              <X size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-10 pb-16">
        <div className="flex items-start justify-center gap-9 w-full max-w-[1060px]">

          <div className="hidden md:flex flex-col w-[280px] shrink-0 sticky top-[88px] gap-3.5">
            <aside
              style={{ background: 'white', borderRadius: 28, boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)', padding: '24px 16px' }}>
              <div className="px-3 pb-4 mb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <p className="text-[15px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                  {isEditing ? 'Edit Property' : 'Add Property'}
                </p>
                <p className="text-[12px] text-[#64748b] mt-0.5">6 steps to list your property</p>
              </div>
              <div className="flex flex-col gap-2">
                {STEPS.map((s) => (
                  <StepItem key={s.step} s={s} current={step === s.step} done={done[s.step]} onClick={() => goTo(s.step)} />
                ))}
              </div>
            </aside>

            {!isEditing && onSaveDraft && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || isSavingDraft}
                className="w-full py-2.5 px-4 rounded-2xl border-2 border-[#136C9E] text-[#136C9E] bg-white hover:bg-[#136C9E]/5 active:scale-[0.99] font-bold text-[13.5px] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                style={{ fontFamily: 'Archivo,sans-serif' }}
              >
                {(savingDraft || isSavingDraft) ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>

          <section style={{
            width: step === 3 || step === 5 ? 640 : 530, maxWidth: '100%', background: 'white',
            borderRadius: 28,
            boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)',
            padding: '40px 42px 44px',
          }}>
            <h1 className="text-[24px] font-bold text-center mb-1 tracking-[-0.02em]"
              style={{ fontFamily: 'Archivo,sans-serif', color: '#1e293b' }}>{title}</h1>
            <p className="text-[13.5px] text-[#64748b] text-center mb-7">{sub}</p>

            {globalError && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 mb-5">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[13px] text-red-700">{globalError}</p>
              </div>
            )}

            {/* ── STEP 1: Property type ───────────────────────────────────── */}
            {step === 1 && !useLegacyTypeFlow && (
              <PropertyTypeStep
                selectedCardId={wizardCardId}
                selectedChipLabel={wizardChipLabel}
                error={errors.propertyType}
                onSelectCard={selectWizardCard}
                onSelectSubtype={selectWizardSubtype}
                onContinue={() => advance(1)}
              />
            )}

            {step === 1 && useLegacyTypeFlow && (
              <div className="space-y-5">
                {typePage !== 'category' && (
                  <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                    <button
                      type="button"
                      onClick={goBackTypePage}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#136C9E] hover:bg-[#f0f8fd] px-2 py-1 rounded-lg transition-all"
                      style={{ fontFamily: 'Archivo,sans-serif' }}
                    >
                      <ArrowLeft size={14} strokeWidth={2.5} /> Back
                    </button>
                    <span className="text-[#cbd5e1]">·</span>
                    <span className="truncate">
                      {selectedCategory?.label}
                      {selectedGroup && typePage === 'subtype' ? ` / ${selectedGroup.label}` : ''}
                    </span>
                  </div>
                )}

                {typePage === 'category' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <SelectCard
                        key={cat.id}
                        selected={form.propertyCategory === cat.id}
                        title={cat.label}
                        description={cat.description}
                        icon={catalogueIcon(cat.icon)}
                        onClick={() => selectCategory(cat.id)}
                      />
                    ))}
                  </div>
                )}

                {typePage === 'type' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {typeGroups.map((g) => (
                      <SelectCard
                        key={g.id}
                        selected={form.propertyTypeGroup === g.id}
                        title={g.label}
                        description={g.description}
                        icon={catalogueIcon(g.icon)}
                        onClick={() => selectTypeGroup(g.id)}
                      />
                    ))}
                  </div>
                )}

                {typePage === 'subtype' && selectedGroup && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedGroup.subtypes.map((st) => (
                      <SelectCard
                        key={st.id}
                        selected={form.propertySubtype === st.id || form.propertyType === st.id}
                        title={st.label}
                        description={st.description}
                        icon={catalogueIcon(selectedGroup.icon)}
                        onClick={() => selectSubtype(st.id)}
                      />
                    ))}
                  </div>
                )}

                {errors.propertyType && (
                  <p className={HINT}><AlertTriangle size={12} />{errors.propertyType}</p>
                )}

                {typePage === 'subtype' && (
                  <div className="pt-2 space-y-3">
                    <button type="button" onClick={() => advance(1)}
                      className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                      style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                      Continue <ArrowRight size={18} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={goBackTypePage}
                      className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all"
                    >
                      <ArrowLeft size={14} strokeWidth={2.5} /> Back to Property Type
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Details ─────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#64748b] flex items-center gap-2.5 m-0">
                  The property
                  <span className="flex-1 h-px bg-[#e3e8ef]" />
                </p>

                <Fld label="Property Address" required error={errors.address} icon={MapPin}>
                  <input type="text" value={form.address}
                    onChange={(e) => sf('address', e.target.value)}
                    placeholder="e.g. 12 Church Lane, London, SW1A 1AA"
                    className={`${INP} pl-11 ${errors.address ? INP_ERR : ''}`} />
                </Fld>

                {detailsForm === 'residential' && wizardKind === 'room' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Fld label="Monthly rent for the room (£)" required error={errors.monthlyRent} icon={PoundSterling}>
                        <input type="number" min="1" value={form.monthlyRent}
                          onChange={(e) => sf('monthlyRent', e.target.value)}
                          placeholder="650"
                          className={`${INP} pl-11 ${errors.monthlyRent ? INP_ERR : ''}`} />
                      </Fld>
                      <div>
                        <label className={LBL}>Room size <span className="text-[#ef4444]">*</span></label>
                        <div className="flex flex-wrap gap-2">
                          {(['Single', 'Double'] as const).map((o) => {
                            const on = form.roomSize === o;
                            return (
                              <button key={o} type="button" onClick={() => sf('roomSize', o)}
                                className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-medium"
                                style={{
                                  borderColor: on ? '#136C9E' : '#d5dde7',
                                  background: on ? '#136C9E' : '#fff',
                                  color: on ? '#fff' : '#1e293b',
                                  fontFamily: 'Archivo,sans-serif',
                                }}>
                                {on && <Check size={14} strokeWidth={3} />}{o}
                              </button>
                            );
                          })}
                        </div>
                        {errors.roomSize && <p className={HINT}><AlertTriangle size={12} />{errors.roomSize}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Fld label="Bedrooms in the property" required error={errors.bedrooms} icon={BedDouble}>
                        <input type="number" min="1" max="50" value={form.bedrooms}
                          onChange={(e) => sf('bedrooms', e.target.value)}
                          placeholder="4"
                          className={`${INP} pl-11 ${errors.bedrooms ? INP_ERR : ''}`} />
                      </Fld>
                      <Fld label="Bathrooms in the property" required error={errors.bathrooms} icon={Bath}>
                        <input type="number" min="1" max="20" value={form.bathrooms}
                          onChange={(e) => sf('bathrooms', e.target.value)}
                          placeholder="2"
                          className={`${INP} pl-11 ${errors.bathrooms ? INP_ERR : ''}`} />
                      </Fld>
                    </div>
                    <Fld label="Current housemates" icon={Users}>
                      <input type="number" min="0" value={form.housemates ?? ''}
                        onChange={(e) => sf('housemates', e.target.value)}
                        placeholder="3" className={`${INP} pl-11`} />
                    </Fld>
                  </>
                ) : (
                  <Fld label="Monthly Rent (£)" required error={errors.monthlyRent} icon={PoundSterling}>
                    <input type="number" min="1" value={form.monthlyRent}
                      onChange={(e) => sf('monthlyRent', e.target.value)}
                      placeholder="1200"
                      className={`${INP} pl-11 ${errors.monthlyRent ? INP_ERR : ''}`} />
                  </Fld>
                )}

                <Fld
                  label="Property Description"
                  required
                  error={errors.description}
                  hint="Shown on the listing for renters and buyers"
                >
                  <textarea
                    value={form.description}
                    onChange={(e) => sf('description', e.target.value)}
                    rows={4}
                    placeholder="Describe the property, location highlights, and who it suits…"
                    className={`${INP} h-auto py-3 resize-y min-h-[110px] ${errors.description ? INP_ERR : ''}`}
                    style={{ lineHeight: 1.5 }}
                  />
                </Fld>

                {detailsForm === 'residential' && wizardKind === 'studio' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={LBL}>Bedrooms</label>
                        <div className="h-12 rounded-2xl border border-[#e2e8f0] bg-[#f7f9fc] px-4 flex items-center gap-2.5">
                          <BedDouble size={17} className="text-[#94a3b8]" />
                          <span className="text-[14.5px] text-[#1e293b]">Studio</span>
                          <span className="ml-auto text-[11.5px] text-[#64748b]">Set by type</span>
                        </div>
                      </div>
                      <div>
                        <label className={LBL}>Bathrooms</label>
                        <div className="h-12 rounded-2xl border border-[#e2e8f0] bg-[#f7f9fc] px-4 flex items-center gap-2.5">
                          <Bath size={17} className="text-[#94a3b8]" />
                          <span className="text-[14.5px] text-[#1e293b]">1</span>
                          <span className="ml-auto text-[11.5px] text-[#64748b]">Set by type</span>
                        </div>
                      </div>
                    </div>
                    <Fld label="Square Footage" icon={Maximize2}>
                      <input type="number" min="1" value={form.squareFootage}
                        onChange={(e) => sf('squareFootage', e.target.value)}
                        placeholder="e.g. 400" className={`${INP} pl-11`} />
                    </Fld>
                  </>
                )}

                {detailsForm === 'residential' && wizardKind !== 'studio' && wizardKind !== 'room' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Fld label="Bedrooms" required error={errors.bedrooms} icon={BedDouble}>
                        <input type="number" min="0" max="50" value={form.bedrooms}
                          onChange={(e) => sf('bedrooms', e.target.value)}
                          placeholder="2"
                          className={`${INP} pl-11 ${errors.bedrooms ? INP_ERR : ''}`} />
                      </Fld>
                      <Fld label="Bathrooms" required error={errors.bathrooms} icon={Bath}>
                        <input type="number" min="0" max="20" value={form.bathrooms}
                          onChange={(e) => sf('bathrooms', e.target.value)}
                          placeholder="1"
                          className={`${INP} pl-11 ${errors.bathrooms ? INP_ERR : ''}`} />
                      </Fld>
                    </div>
                    {specWarning && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-[12px] flex items-start gap-2.5 text-amber-900 text-[12.5px] leading-relaxed">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-800">Specification Warning: </span>
                          <span>{specWarning}</span>
                        </div>
                      </div>
                    )}
                    <Fld label="Square Footage" icon={Maximize2}>
                      <input type="number" min="1" value={form.squareFootage}
                        onChange={(e) => sf('squareFootage', e.target.value)}
                        placeholder="e.g. 750" className={`${INP} pl-11`} />
                    </Fld>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Fld label="Reception rooms">
                        <input type="number" min="0" value={form.receptionRooms ?? ''}
                          onChange={(e) => sf('receptionRooms', e.target.value)}
                          placeholder="1" className={INP} />
                      </Fld>
                      <Fld label="Number of floors" icon={Layers}>
                        <input type="number" min="1" value={form.numberOfFloors ?? ''}
                          onChange={(e) => sf('numberOfFloors', e.target.value)}
                          placeholder="e.g. 2" className={`${INP} pl-11`} />
                      </Fld>
                    </div>
                  </>
                )}

                {detailsForm === 'residential' && (
                  <>
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#64748b] flex items-center gap-2.5 pt-2 m-0">
                      Letting terms
                      <span className="flex-1 h-px bg-[#e3e8ef]" />
                    </p>
                    <div>
                      <label className={LBL}>Furnishing <span className="text-[#ef4444]">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {FURNISHING_OPTIONS.map((o) => {
                          const on = form.furnishing === o;
                          return (
                            <button key={o} type="button" onClick={() => sf('furnishing', o)}
                              className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-medium"
                              style={{
                                borderColor: on ? '#136C9E' : '#d5dde7',
                                background: on ? '#136C9E' : '#fff',
                                color: on ? '#fff' : '#1e293b',
                                fontFamily: 'Archivo,sans-serif',
                              }}>
                              {on && <Check size={14} strokeWidth={3} />}{o}
                            </button>
                          );
                        })}
                      </div>
                      {errors.furnishing && <p className={HINT}><AlertTriangle size={12} />{errors.furnishing}</p>}
                    </div>
                    <div>
                      <label className={LBL}>Bills</label>
                      <div className="flex flex-wrap gap-2">
                        {BILLS_OPTIONS.map((o) => {
                          const on = form.billsIncluded === o;
                          return (
                            <button key={o} type="button"
                              onClick={() => sf('billsIncluded', on ? '' : o)}
                              className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-medium"
                              style={{
                                borderColor: on ? '#136C9E' : '#d5dde7',
                                background: on ? '#136C9E' : '#fff',
                                color: on ? '#fff' : '#1e293b',
                                fontFamily: 'Archivo,sans-serif',
                              }}>
                              {on && <Check size={14} strokeWidth={3} />}{o}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className={LBL}>Pets</label>
                      <div className="flex flex-wrap gap-2">
                        {PETS_OPTIONS.map((o) => {
                          const on = form.petsPolicy === o;
                          return (
                            <button key={o} type="button" onClick={() => sf('petsPolicy', o)}
                              className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-medium"
                              style={{
                                borderColor: on ? '#136C9E' : '#d5dde7',
                                background: on ? '#136C9E' : '#fff',
                                color: on ? '#fff' : '#1e293b',
                                fontFamily: 'Archivo,sans-serif',
                              }}>
                              {on && <Check size={14} strokeWidth={3} />}{o}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2.5 flex gap-2.5 rounded-[12px] border border-[#d6e6f5] bg-[#f3f8fd] px-3.5 py-2.5 text-[12.5px] text-[#30506f] leading-relaxed">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-[#136C9E]" />
                        <span>
                          In England, landlords can’t unreasonably refuse a tenant’s written request to keep a pet.
                          Choose “Restricted by lease” only if the lease or freeholder bans pets.
                        </span>
                      </div>
                    </div>
                    <Fld label="Available from" icon={Calendar}>
                      <input type="date" value={form.availableFrom ?? ''}
                        onChange={(e) => sf('availableFrom', e.target.value)}
                        className={`${INP} pl-11`} />
                    </Fld>

                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[#64748b] flex items-center gap-2.5 pt-1 m-0">
                      Listing tags
                      <span className="text-[11.5px] font-normal normal-case tracking-normal text-[#94a3b8]">(optional)</span>
                      <span className="flex-1 h-px bg-[#e3e8ef]" />
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...LISTING_TAG_OPTIONS, ...(wizardKind === 'room' ? ['Licensed HMO'] as const : [])].map((tag) => {
                        const on = (form.listingTags ?? []).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const cur = form.listingTags ?? [];
                              sf('listingTags', on ? cur.filter((t) => t !== tag) : [...cur, tag]);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-medium"
                            style={{
                              borderColor: on ? '#136C9E' : '#d5dde7',
                              background: on ? '#136C9E' : '#fff',
                              color: on ? '#fff' : '#1e293b',
                              fontFamily: 'Archivo,sans-serif',
                            }}
                          >
                            {on && <Check size={14} strokeWidth={3} />}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {detailsForm === 'commercial' && (
                  <>
                    <Fld label="Property use">
                      <input type="text" value={form.propertyUse ?? ''}
                        onChange={(e) => sf('propertyUse', e.target.value)}
                        placeholder="e.g. Retail, Office, Warehouse"
                        className={INP} />
                    </Fld>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Fld label="Floor area (sq ft)" icon={Maximize2}>
                        <input type="number" min="1" value={form.squareFootage}
                          onChange={(e) => sf('squareFootage', e.target.value)}
                          placeholder="2500" className={`${INP} pl-11`} />
                      </Fld>
                      <Fld label="Number of floors">
                        <input type="number" min="0" value={form.numberOfFloors ?? ''}
                          onChange={(e) => sf('numberOfFloors', e.target.value)}
                          placeholder="2" className={INP} />
                      </Fld>
                    </div>
                    <Fld label="Building specification">
                      <input type="text" value={form.buildingSpecification ?? ''}
                        onChange={(e) => sf('buildingSpecification', e.target.value)}
                        placeholder="e.g. Grade A, shell & core"
                        className={INP} />
                    </Fld>
                    <Fld label="Permitted use">
                      <input type="text" value={form.permittedUse ?? ''}
                        onChange={(e) => sf('permittedUse', e.target.value)}
                        placeholder="e.g. Class E"
                        className={INP} />
                    </Fld>
                    <Fld label="Business rates (£ / year)">
                      <input type="number" min="0" value={form.businessRates ?? ''}
                        onChange={(e) => sf('businessRates', e.target.value)}
                        placeholder="12000" className={INP} />
                    </Fld>
                  </>
                )}

                {detailsForm === 'land' && (
                  <>
                    <Fld label="Land area">
                      <input type="text" value={form.landArea ?? ''}
                        onChange={(e) => sf('landArea', e.target.value)}
                        placeholder="e.g. 2.5 acres / 1 ha"
                        className={INP} />
                    </Fld>
                    <Fld label="Planning status">
                      <select value={form.planningStatus ?? ''} onChange={(e) => sf('planningStatus', e.target.value)} className={SEL}>
                        <option value="">Select…</option>
                        {PLANNING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </Fld>
                    <Fld label="Access">
                      <input type="text" value={form.landAccess ?? ''}
                        onChange={(e) => sf('landAccess', e.target.value)}
                        placeholder="e.g. Adopted road, private track"
                        className={INP} />
                    </Fld>
                    <Fld label="Utilities">
                      <input type="text" value={form.landUtilities ?? ''}
                        onChange={(e) => sf('landUtilities', e.target.value)}
                        placeholder="e.g. Water, electricity on boundary"
                        className={INP} />
                    </Fld>
                    <Fld label="Boundaries">
                      <input type="text" value={form.boundaries ?? ''}
                        onChange={(e) => sf('boundaries', e.target.value)}
                        placeholder="e.g. Fenced, hedged, open"
                        className={INP} />
                    </Fld>
                  </>
                )}

                <div className="pt-2 space-y-3">
                  <button type="button" onClick={() => advance(2)}
                    className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                    style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                    Continue <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                  <button type="button" onClick={goToStep1}
                    className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all">
                    <ArrowLeft size={14} strokeWidth={2.5} /> Back to Property Type
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Features & Amenities ────────────────────────────── */}
            {step === 3 && (
              <PropertyAmenitiesStep
                subtypeId={resolvedSubtypeId && getSubtypeById(resolvedSubtypeId) ? resolvedSubtypeId : null}
                amenities={form.amenities}
                amenityDetails={form.amenityDetails ?? []}
                additionalFeatures={form.additionalFeatures ?? ''}
                floorNumber={form.floorNumber}
                wizardCardId={wizardCardId}
                wizardChipLabel={wizardChipLabel}
                onAmenitiesChange={(ids) => sf('amenities', ids)}
                onAmenityDetailsChange={(details) => sf('amenityDetails', details)}
                onAdditionalFeaturesChange={(v) => sf('additionalFeatures', v)}
                onContinue={() => advance(3)}
                onBack={() => setStep(2)}
                onChangeType={goToStep1}
              />
            )}

            {/* ── STEP 4: Photos & Notes ──────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className={LBL}>Property Photos <span className="text-[#94a3b8] font-normal">(recommended: 4+)</span></label>
                  <div
                    className="border-2 border-dashed border-[#e2e8f0] rounded-[18px] p-8 text-center cursor-pointer transition-all hover:border-[#136C9E] hover:bg-[#f0f8fd]"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); addImages(e.dataTransfer.files); }}>
                    <Upload size={32} className="mx-auto mb-3 text-[#94a3b8]" />
                    <p className="text-[14px] font-semibold text-[#334155]"
                      style={{ fontFamily: 'Archivo,sans-serif' }}>Drag & drop or click to upload</p>
                    <p className="text-[12px] text-[#64748b] mt-1">JPG, PNG, HEIC — max 10MB each</p>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*"
                    className="hidden" onChange={(e) => addImages(e.target.files)} />
                  <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-[14px] border border-[#d6e6f5] bg-[#f3f8fd]">
                    <AlertTriangle size={15} className="text-[#136C9E] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                        Photo guidelines
                      </p>
                      <p className="text-[12px] text-[#30506f] mt-1 leading-relaxed">
                        Please upload recent, real photos of this property as it is today. Light adjustments to brightness, colour or cropping are fine. AI-generated images or edits that add, remove or hide anything aren’t allowed.
                      </p>
                      <p className="text-[12px] text-[#30506f] mt-1.5 leading-relaxed">
                        Listings with misleading photos may be edited or removed.
                      </p>
                      <label className="mt-3 flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(form.photosConfirmed)}
                          onChange={(e) => sf('photosConfirmed', e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-[#b8c4d3] text-[#136C9E] focus:ring-[#136C9E]"
                        />
                        <span className="text-[12.5px] font-medium text-[#1e293b] leading-snug" style={{ fontFamily: 'Archivo,sans-serif' }}>
                          I confirm these photos are recent, real photos of this property.
                        </span>
                      </label>
                      {errors.photosConfirmed && (
                        <p className={`${HINT} mt-2`}><AlertTriangle size={12} />{errors.photosConfirmed}</p>
                      )}
                    </div>
                  </div>
                </div>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {form.images.map((src, i) => (
                      <div key={i} className="relative group aspect-video rounded-[12px] overflow-hidden bg-[#f1f5f9]">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif' }}>Cover</span>
                        )}
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="aspect-video rounded-[12px] border-2 border-dashed border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] hover:border-[#136C9E] hover:text-[#136C9E] hover:bg-[#f0f8fd] transition-all">
                      <Plus size={20} />
                    </button>
                  </div>
                )}

                {form.images.length > 0 && form.images.length < 4 && (
                  <div className="flex items-center gap-2 p-3 rounded-[12px] bg-amber-50 border border-amber-200">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    <p className="text-[12px] text-amber-700">
                      Properties with 4+ photos attract more enquiries.
                    </p>
                  </div>
                )}

                <div>
                  <label className={LBL}>Additional Notes <span className="text-[#94a3b8] font-normal">(internal, optional)</span></label>
                  <textarea
                    value={form.additionalNotes}
                    onChange={(e) => sf('additionalNotes', e.target.value)}
                    rows={4}
                    placeholder="Internal notes — not shown on the public listing…"
                    className={`${INP} h-auto py-3 resize-y min-h-[96px]`}
                    style={{ lineHeight: 1.5 }}
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <button type="button" onClick={() => advance(4)}
                    className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                    style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}>
                    Continue <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                  <button type="button" onClick={() => setStep(3)}
                    className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] px-3 py-1.5 rounded-lg transition-all">
                    <ArrowLeft size={14} strokeWidth={2.5} /> Back to Features & Amenities
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Compliance documents ────────────────────────────── */}
            {step === 5 && (
              <PropertyComplianceStep
                documents={form.complianceDocuments}
                deposit={{
                  takesDeposit: form.takesDeposit ?? null,
                  depositAmount: form.depositAmount ?? '',
                  depositProtectionConfirmed: Boolean(form.depositProtectionConfirmed),
                  depositProtectedBy: form.depositProtectedBy ?? null,
                }}
                onChange={(next) => {
                  const epcRating = next.epc?.epcRating || '';
                  setForm((prev) => ({
                    ...prev,
                    complianceDocuments: next,
                    epcRating: epcRating || prev.epcRating,
                  }));
                  if (globalError) setGE(null);
                }}
                onDepositChange={(next: DepositCommitment) => {
                  setForm((prev) => ({
                    ...prev,
                    takesDeposit: next.takesDeposit,
                    depositAmount: next.depositAmount,
                    depositProtectionConfirmed: next.depositProtectionConfirmed,
                    depositProtectedBy: next.depositProtectedBy,
                  }));
                  if (globalError) setGE(null);
                }}
                onContinue={() => advance(5)}
                onBack={() => setStep(4)}
                onVerifyAccount={onVerifyAccount}
              />
            )}

            {/* ── STEP 6: Review ──────────────────────────────────────────── */}
            {step === 6 && (
              <div className="space-y-5">
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[18px] p-8 space-y-6 min-w-0 overflow-hidden">
                  {form.images.length > 0 && (
                    <div className="rounded-[12px] overflow-hidden aspect-square">
                      <img src={form.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[16px] font-bold text-[#1e293b] break-words"
                          style={{ fontFamily: 'Archivo,sans-serif', overflowWrap: 'anywhere' }}
                        >
                          {form.address || '—'}
                        </p>
                        <p className="text-[13px] text-[#64748b] mt-0.5 break-words">
                          {subtypeLabel(form.propertySubtype || form.propertyType || '')}
                        </p>
                      </div>
                      <span className="text-[15px] font-bold text-[#136C9E] shrink-0"
                        style={{ fontFamily: 'Archivo,sans-serif' }}>
                        £{parseFloat(form.monthlyRent || '0').toLocaleString('en-GB')}/mo
                      </span>
                    </div>
                  </div>

                  {form.description && (
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase font-semibold tracking-wide text-[#94a3b8] mb-1">Description</p>
                      <p
                        className="text-[13px] text-[#475569] leading-relaxed whitespace-pre-wrap break-words"
                        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                      >
                        {form.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(detailsForm === 'residential'
                      ? [
                          { label: 'Bedrooms', value: form.bedrooms || '—' },
                          { label: 'Bathrooms', value: form.bathrooms || '—' },
                          { label: 'Sq Ft', value: form.squareFootage || '—' },
                        ]
                      : detailsForm === 'commercial'
                        ? [
                            { label: 'Floor area', value: form.squareFootage || '—' },
                            { label: 'Floors', value: form.numberOfFloors || '—' },
                            { label: 'Use', value: form.propertyUse || '—' },
                          ]
                        : [
                            { label: 'Land area', value: form.landArea || '—' },
                            { label: 'Planning', value: form.planningStatus || '—' },
                            { label: 'Access', value: form.landAccess || '—' },
                          ]
                    ).map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-[12px] border border-[#e2e8f0] p-3 text-center">
                        <p className="text-[11px] uppercase font-semibold tracking-wide text-[#94a3b8]">{label}</p>
                        <p className="text-[15px] font-bold text-[#1e293b] mt-0.5"
                          style={{ fontFamily: 'Archivo,sans-serif' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {specWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-[12px] flex items-start gap-2.5 text-amber-900 text-[12.5px] leading-relaxed">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-800">Specification Notice: </span>
                        <span>{specWarning}</span>
                      </div>
                    </div>
                  )}

                  {reviewAmenitiesByCategory.length > 0 && (
                    <div className="rounded-[14px] border border-[#e2e8f0] overflow-hidden bg-white min-w-0">
                      <button
                        type="button"
                        onClick={() => setReviewAmenitiesOpen((v) => !v)}
                        className="w-full flex items-center gap-2 px-3.5 py-3 text-left hover:bg-[#f8fafc] transition-colors"
                      >
                        <span
                          className="flex-1 text-[13px] font-semibold text-[#1e293b]"
                          style={{ fontFamily: 'Archivo,sans-serif' }}
                        >
                          Features & Amenities
                        </span>
                        <span className="text-[11.5px] font-semibold text-[#136C9E] shrink-0">
                          {form.amenities.length} selected
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-[#94a3b8] shrink-0 transition-transform ${reviewAmenitiesOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {reviewAmenitiesOpen && (
                        <div className="px-3.5 pb-3.5 border-t border-[#f1f5f9] space-y-3.5 pt-3">
                          {reviewAmenitiesByCategory.map(([cat, labels]) => (
                            <div key={cat} className="min-w-0">
                              <p className="text-[11.5px] font-semibold text-[#64748b] capitalize mb-1.5">
                                {cat}
                                <span className="text-[#94a3b8] font-normal"> · {labels.length}</span>
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {labels.map((label) => (
                                  <span
                                    key={label}
                                    className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full max-w-full break-words"
                                    style={{
                                      background: '#eaf3f8',
                                      color: '#136C9E',
                                      border: '1px solid rgba(19,108,158,0.18)',
                                      overflowWrap: 'anywhere',
                                    }}
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {form.additionalFeatures && (
                    <div>
                      <p className="text-[11px] uppercase font-semibold tracking-wide text-[#94a3b8] mb-1">Additional features</p>
                      <p className="text-[13px] text-[#475569] leading-relaxed">{form.additionalFeatures}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] uppercase font-semibold tracking-wide text-[#94a3b8] mb-2">Compliance documents</p>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        ['gas-cert', 'Gas Safety'],
                        ['eicr', 'EICR'],
                        ['epc', 'EPC'],
                      ] as const).map(([key, label]) => {
                        const entry = form.complianceDocuments?.[key];
                        const ok = Boolean(entry?.file || entry?.url || entry?.fileName);
                        const epcExtra =
                          key === 'epc' && entry?.epcRating ? ` (${entry.epcRating})` : '';
                        return (
                          <span
                            key={key}
                            className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              background: ok ? '#ecfdf5' : '#f1f5f9',
                              color: ok ? '#047857' : '#64748b',
                              border: ok ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            }}
                          >
                            {label}{epcExtra}: {ok ? 'Uploaded' : 'Missing'}
                          </span>
                        );
                      })}
                      {(() => {
                        const depositOk = isDepositCommitmentSatisfied({
                          takesDeposit: form.takesDeposit ?? null,
                          depositAmount: form.depositAmount ?? '',
                          depositProtectionConfirmed: Boolean(form.depositProtectionConfirmed),
                          depositProtectedBy: form.depositProtectedBy ?? null,
                        });
                        const depositLabel =
                          form.takesDeposit === 'no'
                            ? 'No deposit'
                            : form.takesDeposit === 'yes' && form.depositAmount
                              ? `Deposit £${Number(form.depositAmount).toLocaleString('en-GB')}`
                              : 'Deposit';
                        return (
                          <span
                            className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              background: depositOk ? '#ecfdf5' : '#f1f5f9',
                              color: depositOk ? '#047857' : '#64748b',
                              border: depositOk ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            }}
                          >
                            {depositLabel}: {depositOk ? 'Confirmed' : 'Incomplete'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <p className="text-[12.5px] text-[#64748b]">
                    {form.images.length} photo{form.images.length !== 1 ? 's' : ''} · {complianceCount} compliance document{complianceCount !== 1 ? 's' : ''}
                  </p>

                  {form.additionalNotes && (
                    <div>
                      <p className="text-[11px] uppercase font-semibold tracking-wide text-[#94a3b8] mb-1">Internal notes</p>
                      <p className="text-[13px] text-[#475569] leading-relaxed">{form.additionalNotes}</p>
                    </div>
                  )}

                  {publishBlocked && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-[12px] flex items-start gap-2.5 text-amber-900 text-[12.5px] leading-relaxed">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-800">Verification required to publish. </span>
                        <span>
                          Add: {formatMissingVerification(publishGate.missing)}. Save for now, then upload these from Account / Documents.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(5)}
                    className="flex-1 h-[50px] rounded-[14px] border font-semibold text-[14.5px] flex items-center justify-center transition-all hover:bg-[#eaf3f8]"
                    style={{ borderColor: '#136C9E', color: '#136C9E', fontFamily: 'Archivo,sans-serif' }}>
                    Edit Compliance
                  </button>
                  <div className="relative flex-1 group">
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishing || isPublishing || publishBlocked || publishGate.loading}
                      title={publishBlocked ? publishBlockedReason : undefined}
                      aria-disabled={publishBlocked}
                      className="w-full h-[50px] rounded-[14px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 hover:-translate-y-px"
                      style={{
                        background: publishBlocked ? '#94a3b8' : '#DC5F12',
                        fontFamily: 'Archivo,sans-serif',
                        boxShadow: publishBlocked ? 'none' : '0 4px 14px rgba(220,95,18,0.32)',
                      }}
                    >
                      {(publishing || isPublishing)
                        ? <><Loader2 size={18} className="animate-spin" />{isEditing ? 'Saving…' : 'Publishing…'}</>
                        : publishGate.loading
                          ? <><Loader2 size={18} className="animate-spin" />Checking…</>
                          : <><CheckCircle size={18} />{isEditing ? 'Save Changes' : 'Publish Property'}</>}
                    </button>
                    {publishBlocked && (
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-[min(320px,80vw)] -translate-x-1/2 rounded-[12px] bg-[#1e293b] px-3 py-2.5 text-[12px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      >
                        {publishBlockedReason}
                      </div>
                    )}
                  </div>
                </div>

                {!isEditing && onAddTenant && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (publishBlocked) {
                        setGE(publishBlockedReason);
                        return;
                      }
                      try {
                        await onAddTenant?.(form);
                      } catch (err: any) {
                        setGE(err?.message || 'Failed to save property. Please try again.');
                      }
                    }}
                    disabled={isSavingForTenant || publishBlocked}
                    title={publishBlocked ? publishBlockedReason : undefined}
                    className="w-full h-[44px] rounded-[14px] border border-dashed border-[#136C9E] text-[13.5px] font-semibold text-[#136C9E] flex items-center justify-center gap-2 hover:bg-[#f0f8fd] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>
                    {isSavingForTenant
                      ? <><Loader2 size={15} className="animate-spin" /> Saving property…</>
                      : <><Plus size={15} strokeWidth={2.5} /> Add a Tenant Now</>
                    }
                  </button>
                )}

                {!isEditing && onSaveDraft && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || isSavingDraft}
                    className="w-full h-[44px] rounded-[14px] border font-semibold text-[13.5px] flex items-center justify-center gap-2 transition-all hover:bg-[#f8fafc] disabled:opacity-50"
                    style={{
                      borderColor: publishBlocked ? '#136C9E' : '#cbd5e1',
                      color: publishBlocked ? '#136C9E' : '#64748b',
                      background: publishBlocked ? '#eaf3f8' : 'transparent',
                      fontFamily: 'Archivo,sans-serif',
                    }}
                  >
                    {(savingDraft || isSavingDraft)
                      ? <><Loader2 size={15} className="animate-spin" /> Saving draft…</>
                      : 'Save'
                    }
                  </button>
                )}
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}

export default AddPropertyWizard;

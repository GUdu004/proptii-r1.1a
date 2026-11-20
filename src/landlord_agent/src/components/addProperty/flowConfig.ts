/**
 * Landlord Add Property wizard presentation config.
 * Maps the simplified UI (mockup) onto existing catalogue subtype / amenity IDs.
 * Does not replace the shared property catalogue — only drives wizard UX.
 */

export type WizardKind = 'house' | 'bungalow' | 'flat' | 'studio' | 'room';
export type FeatureVis = 'd' | 'm' | '-'; // default | show more | hidden
export type FeatureSection = 'features' | 'amenities';

export interface WizardSubtypeChip {
  label: string;
  /** Catalogue subtype id */
  subtypeId: string;
  hint?: string;
  /** Amenity-visibility kind override (for Other → closest type) */
  amenityKind?: WizardKind;
}

export interface WizardTypeCard {
  id: string;
  label: string;
  description: string;
  icon: 'home' | 'building' | 'bungalow' | 'studio' | 'users' | 'help';
  question?: string;
  /** Catalogue type-group id when selecting this card */
  typeGroupId: string;
  subtypes: WizardSubtypeChip[];
  /** Studio has no chips — auto-select this subtype */
  autoSubtypeId?: string;
}

/** Fixed order: House, Flat, Bungalow, Studio, Room, Other */
export const WIZARD_TYPE_CARDS: WizardTypeCard[] = [
  {
    id: 'house',
    label: 'House',
    description: 'Detached, semi-detached or terraced',
    icon: 'home',
    question: 'What type of house?',
    typeGroupId: 'house',
    subtypes: [
      { label: 'Detached', subtypeId: 'detached-house' },
      { label: 'Semi-detached', subtypeId: 'semi-detached-house' },
      { label: 'Terraced', subtypeId: 'terraced-house' },
      { label: 'End of terrace', subtypeId: 'end-terrace-house' },
      {
        label: 'Mews',
        subtypeId: 'mews-house',
        hint: 'A house on a mews: a small lane or courtyard, often converted from former stables.',
      },
    ],
  },
  {
    id: 'flat',
    label: 'Flat / Apartment',
    description: 'Self-contained home within a larger building',
    icon: 'building',
    question: 'What type of flat?',
    typeGroupId: 'flat',
    subtypes: [
      { label: 'Regular flat', subtypeId: 'apartment' },
      {
        label: 'Maisonette',
        subtypeId: 'maisonette',
        hint: 'A maisonette has its own private front door to the outside, not a shared entrance or corridor.',
      },
      {
        label: 'Penthouse',
        subtypeId: 'penthouse-apartment',
        hint: 'A flat on the top floor of the building.',
      },
      {
        label: 'Duplex',
        subtypeId: 'duplex-apartment',
        hint: 'A flat arranged over two floors, entered from a shared entrance.',
      },
    ],
  },
  {
    id: 'bungalow',
    label: 'Bungalow',
    description: 'Single-storey home',
    icon: 'bungalow',
    question: 'What type of bungalow?',
    typeGroupId: 'bungalow',
    subtypes: [
      { label: 'Detached', subtypeId: 'detached-bungalow' },
      { label: 'Semi-detached', subtypeId: 'semi-detached-bungalow' },
      { label: 'Terraced', subtypeId: 'terraced-bungalow' },
    ],
  },
  {
    id: 'studio',
    label: 'Studio',
    description: 'One room for living and sleeping, with its own kitchen and bathroom',
    icon: 'studio',
    typeGroupId: 'studio',
    subtypes: [],
    autoSubtypeId: 'standard-studio',
  },
  {
    id: 'room',
    label: 'Room in a shared home',
    description: 'Private bedroom, shared kitchen and living space',
    icon: 'users',
    question: 'What kind of share?',
    typeGroupId: 'shared',
    subtypes: [
      { label: 'House share', subtypeId: 'room-in-shared-house' },
      { label: 'Flat share', subtypeId: 'room-in-shared-flat' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Annexe, coach house, park home or houseboat',
    icon: 'help',
    question: 'Which best describes it?',
    typeGroupId: 'converted',
    subtypes: [
      {
        label: 'Annexe',
        subtypeId: 'annexe',
        amenityKind: 'bungalow',
        hint: 'Uses the same features and amenities as a bungalow.',
      },
      {
        label: 'Coach house',
        subtypeId: 'coach-house',
        amenityKind: 'flat',
        hint: 'Uses the same features and amenities as a flat.',
      },
      {
        label: 'Park home',
        subtypeId: 'park-home',
        amenityKind: 'bungalow',
        hint: 'Uses the same features and amenities as a bungalow.',
      },
      {
        label: 'Houseboat',
        subtypeId: 'houseboat',
        amenityKind: 'studio',
        hint: 'Uses the same features and amenities as a studio, without building facilities.',
      },
    ],
  },
];

export interface FeatureOption {
  label: string;
  /** Extra amenity id(s) to store when this option is chosen, or notes-only */
  amenityIds?: string[];
  notes?: string;
}

export interface WizardFeatureItem {
  id: string;
  groupId: string;
  label: string;
  /** Catalogue amenity id stored when selected */
  amenityId: string;
  /** Visibility by kind: House, Bungalow, Flat, Studio, Room */
  visibility: Record<WizardKind, FeatureVis>;
  options?: FeatureOption[];
}

export interface WizardFeatureGroup {
  id: string;
  section: FeatureSection;
  label: string;
  roomLabel?: string;
  icon: 'trees' | 'sofa' | 'access' | 'box' | 'building';
}

export const FEATURE_GROUPS: WizardFeatureGroup[] = [
  { id: 'outdoor', section: 'features', label: 'Outdoor & parking', icon: 'trees' },
  { id: 'inside', section: 'features', label: 'Inside the home', icon: 'sofa' },
  { id: 'access', section: 'features', label: 'Accessibility', icon: 'access' },
  { id: 'provided', section: 'amenities', label: 'Provided in the home', icon: 'box' },
  {
    id: 'building',
    section: 'amenities',
    label: 'Building & shared spaces',
    roomLabel: 'Shared spaces & building',
    icon: 'building',
  },
];

/** Visibility strings: House Bungalow Flat Studio Room */
function v(
  house: FeatureVis,
  bungalow: FeatureVis,
  flat: FeatureVis,
  studio: FeatureVis,
  room: FeatureVis,
): Record<WizardKind, FeatureVis> {
  return { house, bungalow, flat, studio, room };
}

export const WIZARD_FEATURE_ITEMS: WizardFeatureItem[] = [
  // Outdoor & parking
  {
    id: 'privgarden',
    groupId: 'outdoor',
    label: 'Private garden',
    amenityId: 'private_garden',
    visibility: v('d', 'd', 'm', 'm', '-'),
    options: [
      { label: 'Front', amenityIds: ['front_garden'], notes: 'Front' },
      { label: 'Rear', amenityIds: ['rear_garden'], notes: 'Rear' },
      { label: 'Front & rear', amenityIds: ['front_garden', 'rear_garden'], notes: 'Front & rear' },
    ],
  },
  {
    id: 'commgarden',
    groupId: 'outdoor',
    label: 'Communal garden',
    amenityId: 'communal_garden',
    visibility: v('m', 'm', 'd', 'd', 'm'),
  },
  {
    id: 'balcony',
    groupId: 'outdoor',
    label: 'Balcony / roof terrace',
    amenityId: 'balcony',
    visibility: v('m', '-', 'd', 'd', 'm'),
  },
  {
    id: 'driveway',
    groupId: 'outdoor',
    label: 'Driveway / off-street parking',
    amenityId: 'driveway',
    visibility: v('d', 'd', '-', '-', 'm'),
    options: [
      { label: '1 car', notes: '1 car' },
      { label: '2 cars', notes: '2 cars' },
      { label: '3+ cars', notes: '3+ cars' },
    ],
  },
  {
    id: 'garage',
    groupId: 'outdoor',
    label: 'Garage',
    amenityId: 'garage',
    visibility: v('d', 'd', 'm', 'm', '-'),
    options: [
      { label: 'Single', notes: 'Single' },
      { label: 'Double', amenityIds: ['double_garage'], notes: 'Double' },
    ],
  },
  {
    id: 'allocated',
    groupId: 'outdoor',
    label: 'Allocated parking space',
    amenityId: 'allocated_parking',
    visibility: v('m', 'm', 'd', 'd', 'm'),
  },
  {
    id: 'permit',
    groupId: 'outdoor',
    label: 'Permit / on-street parking',
    amenityId: 'permit_parking',
    visibility: v('m', 'm', 'm', 'm', 'm'),
  },
  {
    id: 'ev',
    groupId: 'outdoor',
    label: 'EV charging point',
    amenityId: 'ev_charging',
    visibility: v('m', 'm', 'm', 'm', '-'),
  },
  {
    id: 'shed',
    groupId: 'outdoor',
    label: 'Shed / outbuilding',
    amenityId: 'shed',
    visibility: v('m', 'm', '-', '-', '-'),
  },

  // Inside the home
  {
    id: 'heating',
    groupId: 'inside',
    label: 'Central heating',
    amenityId: 'gas_central_heating',
    visibility: v('d', 'd', 'd', 'd', 'm'),
    options: [
      { label: 'Gas', amenityIds: ['gas_central_heating'], notes: 'Gas' },
      { label: 'Electric', amenityIds: ['electric_heating'], notes: 'Electric' },
      { label: 'Heat pump', amenityIds: ['air_source_heat_pump'], notes: 'Heat pump' },
      { label: 'Communal', amenityIds: ['district_heating'], notes: 'Communal' },
    ],
  },
  {
    id: 'glazing',
    groupId: 'inside',
    label: 'Double glazing',
    amenityId: 'double_glazing',
    visibility: v('d', 'd', 'd', 'd', 'm'),
  },
  {
    id: 'ensuite',
    groupId: 'inside',
    label: 'En suite',
    amenityId: 'en_suite',
    visibility: v('d', 'd', 'd', '-', 'd'),
  },
  {
    id: 'downwc',
    groupId: 'inside',
    label: 'Downstairs WC',
    amenityId: 'cloakroom',
    visibility: v('d', '-', '-', '-', '-'),
  },
  {
    id: 'utility',
    groupId: 'inside',
    label: 'Utility room',
    amenityId: 'utility_room',
    visibility: v('m', 'm', '-', '-', '-'),
  },
  {
    id: 'conserv',
    groupId: 'inside',
    label: 'Conservatory',
    amenityId: 'conservatory',
    visibility: v('m', 'm', '-', '-', '-'),
  },
  {
    id: 'loft',
    groupId: 'inside',
    label: 'Loft / cellar storage',
    amenityId: 'loft_storage',
    visibility: v('m', 'm', '-', '-', '-'),
  },
  {
    id: 'fireplace',
    groupId: 'inside',
    label: 'Fireplace / log burner',
    amenityId: 'wood_burner',
    visibility: v('m', 'm', 'm', '-', '-'),
  },
  {
    id: 'office',
    groupId: 'inside',
    label: 'Home office / study',
    amenityId: 'study_office',
    visibility: v('m', 'm', 'm', '-', '-'),
  },
  {
    id: 'wardrobes',
    groupId: 'inside',
    label: 'Built-in wardrobes',
    amenityId: 'fitted_wardrobes',
    visibility: v('m', 'm', 'd', 'd', 'd'),
  },
  {
    id: 'lock',
    groupId: 'inside',
    label: 'Lock on bedroom door',
    amenityId: 'lockable_door',
    visibility: v('-', '-', '-', '-', 'd'),
  },

  // Accessibility
  {
    id: 'stepfree',
    groupId: 'access',
    label: 'Step-free access',
    amenityId: 'step_free_access',
    visibility: v('m', 'd', 'm', 'm', 'm'),
  },
  {
    id: 'level',
    groupId: 'access',
    label: 'Level access throughout',
    amenityId: 'ground_floor_living',
    visibility: v('m', 'd', 'm', 'm', '-'),
  },
  {
    id: 'wetroom',
    groupId: 'access',
    label: 'Wet room / level-access shower',
    amenityId: 'level_access_shower',
    visibility: v('m', 'm', 'm', 'm', 'm'),
  },
  {
    id: 'lift',
    groupId: 'access',
    label: 'Lift access',
    amenityId: 'lift_access',
    visibility: v('-', '-', 'd', 'd', 'm'),
  },
  {
    id: 'wcpark',
    groupId: 'access',
    label: 'Wheelchair-accessible parking',
    amenityId: 'accessible_parking',
    visibility: v('m', 'm', 'm', 'm', 'm'),
  },

  // Provided in the home
  {
    id: 'washer',
    groupId: 'provided',
    label: 'Washing machine',
    amenityId: 'washing_machine',
    visibility: v('d', 'd', 'd', 'd', 'd'),
  },
  {
    id: 'fridge',
    groupId: 'provided',
    label: 'Fridge freezer',
    amenityId: 'fridge_freezer',
    visibility: v('d', 'd', 'd', 'd', 'd'),
  },
  {
    id: 'dishwasher',
    groupId: 'provided',
    label: 'Dishwasher',
    amenityId: 'dishwasher',
    visibility: v('d', 'd', 'd', 'm', 'm'),
  },
  {
    id: 'dryer',
    groupId: 'provided',
    label: 'Tumble dryer / washer-dryer',
    amenityId: 'tumble_dryer',
    visibility: v('m', 'm', 'm', 'm', 'm'),
  },
  {
    id: 'broadband',
    groupId: 'provided',
    label: 'Broadband',
    amenityId: 'fibre_broadband',
    visibility: v('d', 'd', 'd', 'd', 'd'),
    options: [
      { label: 'Included in rent', amenityIds: ['wifi_included'], notes: 'Included in rent' },
      { label: 'Fibre available', amenityIds: ['fibre_broadband'], notes: 'Fibre available' },
    ],
  },
  {
    id: 'alarm',
    groupId: 'provided',
    label: 'Alarm system',
    amenityId: 'alarm_system',
    visibility: v('m', 'm', 'm', '-', '-'),
  },
  {
    id: 'videoentry',
    groupId: 'provided',
    label: 'Video entry phone',
    amenityId: 'video_entry',
    visibility: v('-', '-', 'd', 'd', 'm'),
  },

  // Building & shared spaces
  {
    id: 'sharedliving',
    groupId: 'building',
    label: 'Shared living room',
    amenityId: 'shared_living_room',
    visibility: v('-', '-', '-', '-', 'd'),
  },
  {
    id: 'bikes',
    groupId: 'building',
    label: 'Bike storage',
    amenityId: 'bike_storage',
    visibility: v('-', '-', 'd', 'd', 'm'),
  },
  {
    id: 'concierge',
    groupId: 'building',
    label: 'Concierge / on-site management',
    amenityId: 'concierge',
    visibility: v('-', '-', 'm', 'm', '-'),
  },
  {
    id: 'gym',
    groupId: 'building',
    label: "Residents' gym",
    amenityId: 'gym_on_site',
    visibility: v('-', '-', 'm', 'm', '-'),
  },
  {
    id: 'pool',
    groupId: 'building',
    label: 'Swimming pool',
    amenityId: 'swimming_pool_building',
    visibility: v('-', '-', 'm', 'm', '-'),
  },
  {
    id: 'lounge',
    groupId: 'building',
    label: 'Communal lounge / roof terrace',
    amenityId: 'communal_lounge',
    visibility: v('-', '-', 'm', 'm', '-'),
  },
  {
    id: 'parcel',
    groupId: 'building',
    label: 'Parcel room',
    amenityId: 'parcel_room',
    visibility: v('-', '-', 'm', 'm', '-'),
  },
  {
    id: 'gated',
    groupId: 'building',
    label: 'Gated development',
    amenityId: 'gated_development',
    visibility: v('m', 'm', 'm', 'm', '-'),
  },
  {
    id: 'cleaner',
    groupId: 'building',
    label: 'Cleaner for shared areas',
    amenityId: 'professional_cleaning',
    visibility: v('-', '-', '-', '-', 'm'),
  },
];

export const FEATURE_ITEM_BY_ID = Object.fromEntries(
  WIZARD_FEATURE_ITEMS.map((i) => [i.id, i]),
) as Record<string, WizardFeatureItem>;

export const FEATURE_ITEM_BY_AMENITY = Object.fromEntries(
  WIZARD_FEATURE_ITEMS.map((i) => [i.amenityId, i]),
) as Record<string, WizardFeatureItem>;

/** Resolve wizard card + chip from a catalogue subtype id */
export function resolveWizardTypeFromSubtype(subtypeId: string | null | undefined): {
  cardId: string | null;
  chipLabel: string | null;
} {
  if (!subtypeId) return { cardId: null, chipLabel: null };
  for (const card of WIZARD_TYPE_CARDS) {
    if (card.autoSubtypeId === subtypeId) {
      return { cardId: card.id, chipLabel: null };
    }
    const chip = card.subtypes.find((s) => s.subtypeId === subtypeId);
    if (chip) return { cardId: card.id, chipLabel: chip.label };
  }

  // Fallback so edit flows with catalogue subtypes outside the chip list still resolve a card
  if (subtypeId.includes('studio')) return { cardId: 'studio', chipLabel: null };
  if (subtypeId.startsWith('room-') || subtypeId.includes('shared') || subtypeId === 'hmo-room') {
    return { cardId: 'room', chipLabel: subtypeId.includes('flat') ? 'Flat share' : 'House share' };
  }
  if (subtypeId.includes('bungalow')) {
    if (subtypeId.includes('semi')) return { cardId: 'bungalow', chipLabel: 'Semi-detached' };
    if (subtypeId.includes('terrace')) return { cardId: 'bungalow', chipLabel: 'Terraced' };
    return { cardId: 'bungalow', chipLabel: 'Detached' };
  }
  if (
    subtypeId.includes('flat') ||
    subtypeId.includes('apartment') ||
    subtypeId === 'maisonette' ||
    subtypeId.includes('duplex') ||
    subtypeId.includes('penthouse')
  ) {
    if (subtypeId.includes('maisonette')) return { cardId: 'flat', chipLabel: 'Maisonette' };
    if (subtypeId.includes('penthouse')) return { cardId: 'flat', chipLabel: 'Penthouse' };
    if (subtypeId.includes('duplex')) return { cardId: 'flat', chipLabel: 'Duplex' };
    return { cardId: 'flat', chipLabel: 'Regular flat' };
  }
  if (subtypeId === 'annexe' || subtypeId === 'park-home' || subtypeId === 'houseboat' || subtypeId === 'coach-house') {
    const card = WIZARD_TYPE_CARDS.find((c) => c.id === 'other');
    const chip = card?.subtypes.find((s) => s.subtypeId === subtypeId);
    return { cardId: 'other', chipLabel: chip?.label ?? null };
  }
  if (subtypeId.includes('house') || subtypeId.includes('cottage') || subtypeId.includes('mews') || subtypeId.includes('terrace')) {
    if (subtypeId.includes('semi')) return { cardId: 'house', chipLabel: 'Semi-detached' };
    if (subtypeId.includes('end-terrace') || subtypeId.includes('end-of-terrace')) {
      return { cardId: 'house', chipLabel: 'End of terrace' };
    }
    if (subtypeId.includes('terrace') || subtypeId.includes('terraced')) {
      return { cardId: 'house', chipLabel: 'Terraced' };
    }
    if (subtypeId.includes('mews')) return { cardId: 'house', chipLabel: 'Mews' };
    return { cardId: 'house', chipLabel: 'Detached' };
  }

  return { cardId: null, chipLabel: null };
}

export function getWizardKind(
  cardId: string | null,
  chipLabel: string | null,
): WizardKind | null {
  if (!cardId) return null;
  if (cardId === 'other') {
    const card = WIZARD_TYPE_CARDS.find((c) => c.id === 'other');
    const chip = card?.subtypes.find((s) => s.label === chipLabel);
    return chip?.amenityKind ?? null;
  }
  if (cardId === 'house' || cardId === 'bungalow' || cardId === 'flat' || cardId === 'studio' || cardId === 'room') {
    return cardId;
  }
  return null;
}

export function featureVisibility(
  item: WizardFeatureItem,
  kind: WizardKind | null,
  opts?: { floorNumber?: string; cardId?: string | null; chipLabel?: string | null },
): FeatureVis {
  if (!kind) return '-';
  let vis = item.visibility[kind];
  // Houseboat: no building facilities / lift
  if (opts?.cardId === 'other' && opts?.chipLabel === 'Houseboat') {
    if (item.groupId === 'building' || item.id === 'lift') return '-';
  }
  // Ground-floor flat: private garden default, lift under show-more
  if (kind === 'flat' && isGroundFloor(opts?.floorNumber)) {
    if (item.id === 'privgarden') vis = 'd';
    if (item.id === 'lift') vis = 'm';
  }
  return vis;
}

function isGroundFloor(floor?: string): boolean {
  if (!floor) return false;
  const f = floor.trim().toLowerCase();
  return f === 'ground' || f === 'ground floor' || f === '0' || f === 'g';
}

export const FURNISHING_OPTIONS = ['Furnished', 'Part-furnished', 'Unfurnished'] as const;
export const BILLS_OPTIONS = ['All included', 'Some included', 'Not included'] as const;
export const PETS_OPTIONS = ['Pets welcome', 'Considered on request', 'Restricted by lease'] as const;
export const LISTING_TAG_OPTIONS = ['New build', 'Student let', 'Retirement (55+)'] as const;
export const FLOOR_OPTIONS = [
  'Basement',
  'Ground floor',
  '1st floor',
  '2nd floor',
  '3rd floor',
  '4th floor or above',
] as const;

/** Map letting-term selections onto catalogue amenity ids (additive sync). */
export function lettingTermsToAmenityIds(terms: {
  furnishing?: string | null;
  bills?: string | null;
  pets?: string | null;
  tags?: string[];
}): string[] {
  const ids: string[] = [];
  if (terms.furnishing === 'Furnished') ids.push('furnished');
  if (terms.furnishing === 'Part-furnished') ids.push('part_furnished');
  if (terms.furnishing === 'Unfurnished') ids.push('unfurnished');
  if (terms.bills === 'All included') ids.push('bills_included');
  if (terms.pets === 'Pets welcome') ids.push('pet_friendly');
  if (terms.pets === 'Considered on request') ids.push('pets_considered');
  if (terms.tags?.includes('Student let')) ids.push('students_welcome');
  if (terms.tags?.includes('Licensed HMO')) ids.push('hmo_licensed');
  return ids;
}

export const LETTING_TERM_AMENITY_IDS = new Set([
  'furnished',
  'part_furnished',
  'unfurnished',
  'bills_included',
  'pet_friendly',
  'pets_considered',
  'students_welcome',
  'hmo_licensed',
  'no_pets',
]);

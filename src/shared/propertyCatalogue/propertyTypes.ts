import type {
  PropertyCategoryDef,
  PropertyClassification,
  PropertySubtypeDef,
  PropertyTypeGroupDef,
} from './types';

/** Shared amenity category sets used across subtypes */
const HOUSE_AMENITIES = [
  'outdoor_space',
  'parking',
  'interior',
  'kitchen',
  'bathroom',
  'heating_energy',
  'security_safety',
  'internet_connectivity',
  'energy_sustainability',
  'accessibility',
  'furnishing',
  'rental_preferences',
] as const;

const FLAT_CORE = [
  'private_spaces',
  'building_facilities',
  'parking',
  'kitchen',
  'bathroom',
  'heating_energy',
  'security_safety',
  'internet_connectivity',
  'accessibility',
  'furnishing',
  'rental_preferences',
] as const;

const FLAT_PREMIUM = [
  ...FLAT_CORE,
  'outdoor_space',
] as const;

const STUDIO_AMENITIES = [
  'studio_living',
  'kitchen',
  'bathroom',
  'building_facilities',
  'heating_energy',
  'internet_connectivity',
  'furnishing',
  'security_safety',
  'rental_preferences',
  'parking',
] as const;

const BUNGALOW_AMENITIES = [
  'outdoor_space',
  'parking',
  'interior',
  'kitchen',
  'bathroom',
  'heating_energy',
  'accessibility',
  'security_safety',
  'internet_connectivity',
  'energy_sustainability',
  'furnishing',
  'rental_preferences',
] as const;

const SHARED_AMENITIES = [
  'private_room',
  'shared_facilities',
  'utilities_services',
  'building_safety',
  'rental_preferences',
  'furnishing',
  'internet_connectivity',
  'parking',
] as const;

const RETIREMENT_AMENITIES = [
  'retirement_care',
  'building_facilities',
  'accessibility',
  'kitchen',
  'bathroom',
  'heating_energy',
  'security_safety',
  'internet_connectivity',
  'furnishing',
  'parking',
  'private_spaces',
] as const;

const CONVERSION_BASE = [
  'conversion_features',
  'outdoor_space',
  'parking',
  'interior',
  'kitchen',
  'bathroom',
  'heating_energy',
  'security_safety',
  'internet_connectivity',
  'energy_sustainability',
  'furnishing',
  'rental_preferences',
] as const;

const OFFICE_AMENITIES = [
  'workspace',
  'office_building',
  'parking',
  'security_safety',
  'internet_connectivity',
  'energy_sustainability',
  'accessibility',
] as const;

const OFFICE_SHARED_AMENITIES = [
  'office_shared',
  'workspace',
  'office_building',
  'security_safety',
  'internet_connectivity',
  'parking',
] as const;

const RETAIL_AMENITIES = [
  'retail_facilities',
  'security_safety',
  'parking',
  'internet_connectivity',
  'energy_sustainability',
] as const;

const INDUSTRIAL_AMENITIES = [
  'industrial_access',
  'industrial_building',
  'industrial_external',
  'security_safety',
  'parking',
  'energy_sustainability',
] as const;

const HOSPITALITY_AMENITIES = [
  'hospitality',
  'parking',
  'security_safety',
  'internet_connectivity',
  'accessibility',
  'energy_sustainability',
] as const;

const LEISURE_AMENITIES = [
  'leisure',
  'parking',
  'security_safety',
  'accessibility',
  'internet_connectivity',
] as const;

const HEALTHCARE_AMENITIES = [
  'healthcare',
  'parking',
  'security_safety',
  'accessibility',
  'internet_connectivity',
] as const;

const LAND_AMENITIES = ['land_characteristics', 'security_safety'] as const;

function st(
  id: string,
  label: string,
  typeGroupId: string,
  amenityCategoryIds: readonly string[],
  opts: Partial<Omit<PropertySubtypeDef, 'id' | 'label' | 'typeGroupId' | 'amenityCategoryIds'>> & {
    detailsForm: PropertySubtypeDef['detailsForm'];
  },
): PropertySubtypeDef {
  return {
    id,
    label,
    typeGroupId,
    amenityCategoryIds: [...amenityCategoryIds],
    ...opts,
  };
}

export const PROPERTY_CATEGORIES: PropertyCategoryDef[] = [
  {
    id: 'residential',
    label: 'Residential',
    description: 'Homes, flats, shared rooms and specialist residential stock',
    icon: 'Home',
  },
  {
    id: 'commercial',
    label: 'Commercial',
    description: 'Offices, retail, industrial, hospitality, leisure and healthcare',
    icon: 'Briefcase',
  },
  {
    id: 'land',
    label: 'Land',
    description: 'Development, agricultural and amenity land',
    icon: 'Map',
  },
];

export const PROPERTY_TYPE_GROUPS: PropertyTypeGroupDef[] = [
  // ─── Residential: House (13) ───────────────────────────────────────────
  {
    id: 'house',
    categoryId: 'residential',
    label: 'House',
    description: 'Houses of all styles and tenures',
    icon: 'Home',
    subtypes: [
      st('detached-house', 'Detached house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
        description: 'Standalone house with space on all sides',
      }),
      st('semi-detached-house', 'Semi-detached house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('terraced-house', 'Terraced house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('end-terrace-house', 'End-of-terrace house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('mid-terrace-house', 'Mid-terrace house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('townhouse', 'Townhouse', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('mews-house', 'Mews house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('cottage', 'Cottage', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('farmhouse', 'Farmhouse', 'house', [...HOUSE_AMENITIES, 'land_characteristics'], {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('link-detached-house', 'Link-detached house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('coach-house', 'Coach house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('country-house', 'Country house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('period-house', 'Period / character house', 'house', HOUSE_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'house',
        description: 'Character or period property with heritage features',
      }),
    ],
  },

  // ─── Residential: Flat (14) ────────────────────────────────────────────
  {
    id: 'flat',
    categoryId: 'residential',
    label: 'Flat / Apartment',
    description: 'Self-contained flats and apartments',
    icon: 'Building2',
    subtypes: [
      st('purpose-built-flat', 'Purpose-built flat', 'flat', FLAT_CORE, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('converted-flat', 'Converted flat', 'flat', [...FLAT_CORE, 'conversion_features'], {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('ground-floor-flat', 'Ground-floor flat', 'flat', FLAT_CORE, {
        detailsForm: 'residential',
        searchCategory: 'flat',
        description: 'Ground-floor unit with step-free living potential',
      }),
      st('upper-floor-flat', 'Upper-floor flat', 'flat', FLAT_CORE, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('basement-flat', 'Basement / lower-ground flat', 'flat', FLAT_CORE, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('maisonette', 'Maisonette', 'flat', FLAT_PREMIUM, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('duplex-apartment', 'Duplex apartment', 'flat', FLAT_PREMIUM, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('penthouse-apartment', 'Penthouse apartment', 'flat', [
        'private_spaces',
        'building_facilities',
        'parking',
        'kitchen',
        'bathroom',
        'heating_energy',
        'security_safety',
        'outdoor_space',
        'internet_connectivity',
        'furnishing',
        'rental_preferences',
      ], {
        detailsForm: 'residential',
        searchCategory: 'flat',
        description: 'Top-floor premium apartment, often with private outdoor space',
      }),
      st('loft-apartment', 'Loft apartment', 'flat', [...FLAT_CORE, 'conversion_features'], {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('garden-flat', 'Garden flat', 'flat', FLAT_PREMIUM, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('apartment', 'Apartment', 'flat', FLAT_CORE, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('new-build-apartment', 'New-build apartment', 'flat', [...FLAT_CORE, 'energy_sustainability'], {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('serviced-apartment', 'Serviced apartment', 'flat', [...FLAT_CORE, 'utilities_services'], {
        detailsForm: 'residential',
        searchCategory: 'flat',
        applicableListingKinds: ['rent'],
      }),
      st('luxury-apartment', 'Luxury apartment', 'flat', FLAT_PREMIUM, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
    ],
  },

  // ─── Residential: Studio (6) ───────────────────────────────────────────
  {
    id: 'studio',
    categoryId: 'residential',
    label: 'Studio',
    description: 'Single-room living with kitchen and bathroom',
    icon: 'Layout',
    subtypes: [
      st('standard-studio', 'Standard studio', 'studio', STUDIO_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'studio',
      }),
      st('studio-flat', 'Studio flat', 'studio', STUDIO_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'studio',
      }),
      st('en-suite-studio', 'En-suite studio', 'studio', STUDIO_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'studio',
      }),
      st('luxury-studio', 'Luxury studio', 'studio', [...STUDIO_AMENITIES, 'private_spaces'], {
        detailsForm: 'residential',
        searchCategory: 'studio',
      }),
      st('loft-studio', 'Loft studio', 'studio', [...STUDIO_AMENITIES, 'conversion_features'], {
        detailsForm: 'residential',
        searchCategory: 'studio',
      }),
      st('garden-studio', 'Garden studio', 'studio', [...STUDIO_AMENITIES, 'outdoor_space', 'private_spaces'], {
        detailsForm: 'residential',
        searchCategory: 'studio',
      }),
    ],
  },

  // ─── Residential: Bungalow (5) ─────────────────────────────────────────
  {
    id: 'bungalow',
    categoryId: 'residential',
    label: 'Bungalow',
    description: 'Single-storey and chalet bungalows',
    icon: 'Home',
    subtypes: [
      st('detached-bungalow', 'Detached bungalow', 'bungalow', BUNGALOW_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'bungalow',
      }),
      st('semi-detached-bungalow', 'Semi-detached bungalow', 'bungalow', BUNGALOW_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'bungalow',
      }),
      st('terraced-bungalow', 'Terraced bungalow', 'bungalow', BUNGALOW_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'bungalow',
      }),
      st('chalet-bungalow', 'Chalet bungalow', 'bungalow', BUNGALOW_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'bungalow',
      }),
      st('dormer-bungalow', 'Dormer bungalow', 'bungalow', BUNGALOW_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'bungalow',
      }),
    ],
  },

  // ─── Residential: Shared (8) ───────────────────────────────────────────
  {
    id: 'shared',
    categoryId: 'residential',
    label: 'Shared accommodation',
    description: 'Rooms in shared houses, HMOs and student stock',
    icon: 'Users',
    subtypes: [
      st('room-in-shared-house', 'Room in shared house', 'shared', SHARED_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'shared',
        applicableListingKinds: ['rent'],
      }),
      st('room-in-shared-flat', 'Room in shared flat', 'shared', SHARED_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'shared',
        applicableListingKinds: ['rent'],
      }),
      st('hmo-room', 'HMO room', 'shared', SHARED_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'shared',
        applicableListingKinds: ['rent'],
      }),
      st('student-house-room', 'Student house room', 'shared', SHARED_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'shared',
        applicableListingKinds: ['rent'],
      }),
      st('en-suite-room', 'En-suite room', 'shared', SHARED_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'shared',
        applicableListingKinds: ['rent'],
      }),
      st('twin-room', 'Twin room', 'shared', SHARED_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'shared',
        applicableListingKinds: ['rent'],
      }),
      st('double-room-shared', 'Double room (shared house)', 'shared', SHARED_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'shared',
        applicableListingKinds: ['rent'],
      }),
      st('bedsitting-room', 'Bedsitting room', 'shared', [...SHARED_AMENITIES, 'studio_living'], {
        detailsForm: 'residential',
        searchCategory: 'shared',
        applicableListingKinds: ['rent'],
      }),
    ],
  },

  // ─── Residential: Retirement (6) ───────────────────────────────────────
  {
    id: 'retirement',
    categoryId: 'residential',
    label: 'Retirement & care',
    description: 'Age-restricted and care-supported residential',
    icon: 'HeartHandshake',
    subtypes: [
      st('retirement-apartment', 'Retirement apartment', 'retirement', RETIREMENT_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('retirement-bungalow', 'Retirement bungalow', 'retirement', [...RETIREMENT_AMENITIES, 'outdoor_space'], {
        detailsForm: 'residential',
        searchCategory: 'bungalow',
      }),
      st('sheltered-housing', 'Sheltered housing', 'retirement', RETIREMENT_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('assisted-living', 'Assisted living', 'retirement', RETIREMENT_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('care-home-suite', 'Care home suite', 'retirement', RETIREMENT_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('retirement-village', 'Retirement village', 'retirement', [...RETIREMENT_AMENITIES, 'leisure', 'outdoor_space'], {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
    ],
  },

  // ─── Residential: Converted / specialist (13) ──────────────────────────
  {
    id: 'converted',
    categoryId: 'residential',
    label: 'Converted & specialist',
    description: 'Conversions, park homes, lodges and houseboats',
    icon: 'Landmark',
    subtypes: [
      st('barn-conversion', 'Barn conversion', 'converted', CONVERSION_BASE, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('church-conversion', 'Church / chapel conversion', 'converted', CONVERSION_BASE, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('school-conversion', 'School conversion', 'converted', CONVERSION_BASE, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('mill-conversion', 'Mill conversion', 'converted', CONVERSION_BASE, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('warehouse-loft-conversion', 'Warehouse loft conversion', 'converted', [
        ...CONVERSION_BASE.filter((c) => c !== 'outdoor_space'),
        'private_spaces',
        'building_facilities',
      ], {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('factory-conversion', 'Factory conversion', 'converted', CONVERSION_BASE, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('pub-conversion', 'Pub conversion', 'converted', CONVERSION_BASE, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('stables-conversion', 'Stables conversion', 'converted', CONVERSION_BASE, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('windmill-conversion', 'Windmill conversion', 'converted', CONVERSION_BASE, {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('office-to-residential', 'Office-to-residential conversion', 'converted', [
        ...CONVERSION_BASE.filter((c) => c !== 'outdoor_space'),
        'building_facilities',
        'private_spaces',
      ], {
        detailsForm: 'residential',
        searchCategory: 'flat',
      }),
      st('annexe', 'Annexe', 'converted', BUNGALOW_AMENITIES, {
        detailsForm: 'residential',
        searchCategory: 'bungalow',
        description: 'Self-contained annexe, typically single-storey',
      }),
      st('park-home', 'Park home', 'converted', [
        'park_home',
        'parking',
        'kitchen',
        'bathroom',
        'heating_energy',
        'outdoor_space',
        'security_safety',
        'internet_connectivity',
        'furnishing',
        'rental_preferences',
        'accessibility',
      ], {
        detailsForm: 'residential',
        searchCategory: 'bungalow',
      }),
      st('holiday-lodge', 'Holiday lodge / cabin', 'converted', [
        'lodge_cabin',
        'outdoor_space',
        'parking',
        'kitchen',
        'bathroom',
        'heating_energy',
        'internet_connectivity',
        'furnishing',
        'security_safety',
      ], {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
      st('houseboat', 'Houseboat', 'converted', [
        'houseboat',
        'kitchen',
        'bathroom',
        'heating_energy',
        'internet_connectivity',
        'furnishing',
        'security_safety',
        'energy_sustainability',
      ], {
        detailsForm: 'residential',
        searchCategory: 'house',
      }),
    ],
  },

  // ─── Commercial: Office (9) ────────────────────────────────────────────
  {
    id: 'office',
    categoryId: 'commercial',
    label: 'Office',
    description: 'Offices, suites and coworking',
    icon: 'Briefcase',
    subtypes: [
      st('serviced-office', 'Serviced office', 'office', OFFICE_SHARED_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('private-office', 'Private office', 'office', OFFICE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('open-plan-office', 'Open-plan office', 'office', OFFICE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('office-suite', 'Office suite', 'office', OFFICE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('coworking-space', 'Coworking space', 'office', OFFICE_SHARED_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('business-centre-unit', 'Business centre unit', 'office', OFFICE_SHARED_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('managed-office', 'Managed office', 'office', OFFICE_SHARED_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('executive-suite', 'Executive suite', 'office', OFFICE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('hybrid-office', 'Hybrid / flexible office', 'office', OFFICE_SHARED_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
    ],
  },

  // ─── Commercial: Retail (9) ────────────────────────────────────────────
  {
    id: 'retail',
    categoryId: 'commercial',
    label: 'Retail',
    description: 'Shops, showrooms and retail units',
    icon: 'Store',
    subtypes: [
      st('high-street-shop', 'High street shop', 'retail', RETAIL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('shopping-centre-unit', 'Shopping centre unit', 'retail', RETAIL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('retail-warehouse', 'Retail warehouse', 'retail', [...RETAIL_AMENITIES, 'industrial_access'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('showroom', 'Showroom', 'retail', RETAIL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('convenience-store', 'Convenience store', 'retail', RETAIL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('restaurant-premises', 'Restaurant premises', 'retail', RETAIL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('cafe-premises', 'Café premises', 'retail', RETAIL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('kiosk', 'Kiosk', 'retail', ['retail_facilities', 'security_safety'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('pop-up-retail', 'Pop-up retail', 'retail', RETAIL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
        applicableListingKinds: ['rent'],
      }),
    ],
  },

  // ─── Commercial: Industrial (10) ───────────────────────────────────────
  {
    id: 'industrial',
    categoryId: 'commercial',
    label: 'Industrial',
    description: 'Warehouses, workshops and industrial units',
    icon: 'Factory',
    subtypes: [
      st('warehouse', 'Warehouse', 'industrial', INDUSTRIAL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('light-industrial-unit', 'Light industrial unit', 'industrial', INDUSTRIAL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('heavy-industrial', 'Heavy industrial', 'industrial', INDUSTRIAL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('factory', 'Factory', 'industrial', INDUSTRIAL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('distribution-centre', 'Distribution centre', 'industrial', INDUSTRIAL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('workshop', 'Workshop', 'industrial', INDUSTRIAL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('storage-unit', 'Storage unit', 'industrial', INDUSTRIAL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('trade-counter-unit', 'Trade counter unit', 'industrial', [...INDUSTRIAL_AMENITIES, 'retail_facilities'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('yard-depot', 'Yard / depot', 'industrial', ['industrial_external', 'industrial_access', 'security_safety', 'parking'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('cold-storage', 'Cold storage', 'industrial', INDUSTRIAL_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
    ],
  },

  // ─── Commercial: Hospitality (9) ───────────────────────────────────────
  {
    id: 'hospitality',
    categoryId: 'commercial',
    label: 'Hospitality',
    description: 'Hotels, guest houses and licensed premises',
    icon: 'Hotel',
    subtypes: [
      st('hotel', 'Hotel', 'hospitality', HOSPITALITY_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('guest-house', 'Guest house', 'hospitality', HOSPITALITY_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('bnb', 'Bed & breakfast', 'hospitality', HOSPITALITY_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('hostel', 'Hostel', 'hospitality', HOSPITALITY_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('aparthotel', 'Aparthotel', 'hospitality', HOSPITALITY_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('boutique-hotel', 'Boutique hotel', 'hospitality', HOSPITALITY_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('motel', 'Motel', 'hospitality', HOSPITALITY_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('pub-with-rooms', 'Pub with rooms', 'hospitality', [...HOSPITALITY_AMENITIES, 'retail_facilities'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('holiday-let-commercial', 'Holiday let (commercial)', 'hospitality', HOSPITALITY_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
    ],
  },

  // ─── Commercial: Leisure (9) ───────────────────────────────────────────
  {
    id: 'leisure',
    categoryId: 'commercial',
    label: 'Leisure',
    description: 'Gyms, sports and entertainment venues',
    icon: 'Dumbbell',
    subtypes: [
      st('gym-leisure', 'Gym / fitness centre', 'leisure', LEISURE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('sports-centre', 'Sports centre', 'leisure', LEISURE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('cinema', 'Cinema', 'leisure', LEISURE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('bowling-alley', 'Bowling alley', 'leisure', LEISURE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('nightclub', 'Nightclub', 'leisure', [...LEISURE_AMENITIES, 'hospitality'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('leisure-complex', 'Leisure complex', 'leisure', LEISURE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('swimming-pool-facility', 'Swimming pool facility', 'leisure', LEISURE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('golf-club', 'Golf club', 'leisure', [...LEISURE_AMENITIES, 'hospitality', 'land_characteristics'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('entertainment-venue', 'Entertainment venue', 'leisure', LEISURE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
    ],
  },

  // ─── Commercial: Healthcare (8) ────────────────────────────────────────
  {
    id: 'healthcare',
    categoryId: 'commercial',
    label: 'Healthcare',
    description: 'Medical, dental and care premises',
    icon: 'Stethoscope',
    subtypes: [
      st('gp-surgery', 'GP surgery', 'healthcare', HEALTHCARE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('dental-practice', 'Dental practice', 'healthcare', HEALTHCARE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('clinic', 'Clinic', 'healthcare', HEALTHCARE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('veterinary-practice', 'Veterinary practice', 'healthcare', HEALTHCARE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('care-facility', 'Care facility', 'healthcare', [...HEALTHCARE_AMENITIES, 'retirement_care'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('hospital-wing', 'Hospital wing / unit', 'healthcare', HEALTHCARE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('medical-centre', 'Medical centre', 'healthcare', HEALTHCARE_AMENITIES, {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
      st('pharmacy-premises', 'Pharmacy premises', 'healthcare', [...HEALTHCARE_AMENITIES, 'retail_facilities'], {
        detailsForm: 'commercial',
        searchCategory: 'commercial',
      }),
    ],
  },

  // ─── Land (9) ──────────────────────────────────────────────────────────
  {
    id: 'land',
    categoryId: 'land',
    label: 'Land',
    description: 'Development, agricultural and amenity land',
    icon: 'Map',
    subtypes: [
      st('residential-development-land', 'Residential development land', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
      st('agricultural-land', 'Agricultural land', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
      st('paddock', 'Paddock', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
      st('woodland', 'Woodland', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
      st('commercial-development-land', 'Commercial development land', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
      st('allotment', 'Allotment', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
      st('equestrian-land', 'Equestrian land', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
      st('brownfield-site', 'Brownfield site', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
      st('greenfield-site', 'Greenfield site', 'land', LAND_AMENITIES, {
        detailsForm: 'land',
        searchCategory: 'land',
      }),
    ],
  },
];

/**
 * Legacy coarse property-type strings from the original wizard / API.
 * Partial classifications are completed by resolveClassificationFromStoredType.
 */
export const LEGACY_TYPE_MAP: Record<string, Partial<PropertyClassification> & { subtypeId?: string }> = {
  house: { categoryId: 'residential', typeGroupId: 'house' },
  flat: { categoryId: 'residential', typeGroupId: 'flat' },
  studio: { categoryId: 'residential', typeGroupId: 'studio', subtypeId: 'standard-studio' },
  shared: { categoryId: 'residential', typeGroupId: 'shared', subtypeId: 'room-in-shared-house' },
  commercial: { categoryId: 'commercial', typeGroupId: 'office' },
  other: { categoryId: 'residential', typeGroupId: 'house' },
};

/** Flat lookup of all subtypes by id */
export const SUBTYPE_BY_ID: Record<string, PropertySubtypeDef> = Object.fromEntries(
  PROPERTY_TYPE_GROUPS.flatMap((g) => g.subtypes.map((s) => [s.id, s])),
);

export const TYPE_GROUP_BY_ID: Record<string, PropertyTypeGroupDef> = Object.fromEntries(
  PROPERTY_TYPE_GROUPS.map((g) => [g.id, g]),
);

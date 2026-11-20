import {
  AMENITIES,
  AMENITY_BY_ID,
  AMENITY_CATEGORIES,
  LEGACY_AMENITY_CANONICAL,
  getAmenityCategoryById,
} from './amenities';
import {
  LEGACY_TYPE_MAP,
  PROPERTY_CATEGORIES,
  PROPERTY_TYPE_GROUPS,
  SUBTYPE_BY_ID,
  TYPE_GROUP_BY_ID,
} from './propertyTypes';
import type {
  AmenityCategory,
  AmenityDef,
  ListingKind,
  PropertyCategoryDef,
  PropertyCategoryId,
  PropertyClassification,
  PropertySubtypeDef,
  PropertyTypeGroupDef,
} from './types';

export type {
  AmenityAccessType,
  AmenityCategory,
  AmenityDef,
  AmenityInputType,
  ListingKind,
  PropertyCategoryDef,
  PropertyCategoryId,
  PropertyClassification,
  PropertySubtypeDef,
  PropertyTypeGroupDef,
  SelectedAmenity,
} from './types';

export {
  AMENITIES,
  AMENITY_BY_ID,
  AMENITY_CATEGORIES,
  LEGACY_AMENITY_CANONICAL,
} from './amenities';

export {
  LEGACY_TYPE_MAP,
  PROPERTY_CATEGORIES,
  PROPERTY_TYPE_GROUPS,
  SUBTYPE_BY_ID,
  TYPE_GROUP_BY_ID,
} from './propertyTypes';

export interface AmenityQueryOpts {
  listingKind?: ListingKind;
  /** Free-text filter against label, id, and searchAliases */
  search?: string;
  /** When true, also include legacy_general amenities */
  includeLegacy?: boolean;
}

function matchesListingKind(
  amenity: AmenityDef,
  listingKind?: ListingKind,
): boolean {
  if (!listingKind || listingKind === 'any') return true;
  const kinds = amenity.applicableListingKinds;
  if (!kinds || kinds.length === 0) return true;
  return kinds.includes(listingKind) || kinds.includes('any');
}

function matchesSearch(amenity: AmenityDef, search?: string): boolean {
  if (!search || !search.trim()) return true;
  const q = search.trim().toLowerCase();
  if (amenity.id.toLowerCase().includes(q)) return true;
  if (amenity.label.toLowerCase().includes(q)) return true;
  return (amenity.searchAliases ?? []).some((a) => a.toLowerCase().includes(q));
}

function amenityAppliesToSubtype(amenity: AmenityDef, subtypeId: string): boolean {
  const list = amenity.applicableSubtypes;
  if (!list || list.length === 0) return true;
  return list.includes(subtypeId);
}

export function getAllCategories(): PropertyCategoryDef[] {
  return [...PROPERTY_CATEGORIES];
}

export function getTypeGroupsForCategory(
  categoryId: PropertyCategoryId,
): PropertyTypeGroupDef[] {
  return PROPERTY_TYPE_GROUPS.filter((g) => g.categoryId === categoryId);
}

export function getSubtypeById(subtypeId: string): PropertySubtypeDef | undefined {
  return SUBTYPE_BY_ID[subtypeId];
}

export function getTypeGroupById(typeGroupId: string): PropertyTypeGroupDef | undefined {
  return TYPE_GROUP_BY_ID[typeGroupId];
}

/**
 * Resolve a stored property type string (subtype id or legacy coarse type)
 * into a full classification. Returns null if unknown.
 */
export function resolveClassificationFromStoredType(
  storedType: string,
): PropertyClassification | null {
  if (!storedType) return null;
  const key = storedType.trim();

  const subtype = SUBTYPE_BY_ID[key];
  if (subtype) {
    const group = TYPE_GROUP_BY_ID[subtype.typeGroupId];
    if (!group) return null;
    return {
      categoryId: group.categoryId,
      typeGroupId: group.id,
      subtypeId: subtype.id,
    };
  }

  const legacy = LEGACY_TYPE_MAP[key.toLowerCase()];
  if (!legacy?.categoryId || !legacy.typeGroupId) return null;

  const group = TYPE_GROUP_BY_ID[legacy.typeGroupId];
  if (!group) return null;

  const subtypeId =
    legacy.subtypeId ??
    group.subtypes[0]?.id;

  if (!subtypeId) return null;

  return {
    categoryId: legacy.categoryId,
    typeGroupId: legacy.typeGroupId,
    subtypeId,
  };
}

export function getAmenityCategoriesForSubtype(subtypeId: string): AmenityCategory[] {
  const subtype = SUBTYPE_BY_ID[subtypeId];
  if (!subtype) return [];

  const cats = subtype.amenityCategoryIds
    .map((id) => getAmenityCategoryById(id))
    .filter((c): c is AmenityCategory => Boolean(c));

  return cats.sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getAmenitiesForSubtype(
  subtypeId: string,
  opts?: AmenityQueryOpts,
): AmenityDef[] {
  const subtype = SUBTYPE_BY_ID[subtypeId];
  if (!subtype) return [];

  const categorySet = new Set(subtype.amenityCategoryIds);
  if (opts?.includeLegacy) categorySet.add('legacy_general');

  return AMENITIES.filter((a) => {
    if (!categorySet.has(a.categoryId)) return false;
    if (!amenityAppliesToSubtype(a, subtypeId)) return false;
    if (!matchesListingKind(a, opts?.listingKind)) return false;
    if (!matchesSearch(a, opts?.search)) return false;
    return true;
  });
}

export function getAmenitiesGroupedForSubtype(
  subtypeId: string,
  opts?: AmenityQueryOpts,
): { category: AmenityCategory; amenities: AmenityDef[] }[] {
  const categories = getAmenityCategoriesForSubtype(subtypeId);
  const amenities = getAmenitiesForSubtype(subtypeId, opts);
  const byCategory = new Map<string, AmenityDef[]>();

  for (const a of amenities) {
    const list = byCategory.get(a.categoryId) ?? [];
    list.push(a);
    byCategory.set(a.categoryId, list);
  }

  const grouped = categories
    .map((category) => ({
      category,
      amenities: byCategory.get(category.id) ?? [],
    }))
    .filter((g) => g.amenities.length > 0);

  if (opts?.includeLegacy) {
    const legacyCat = getAmenityCategoryById('legacy_general');
    const legacyAmenities = byCategory.get('legacy_general') ?? [];
    if (legacyCat && legacyAmenities.length > 0) {
      grouped.push({ category: legacyCat, amenities: legacyAmenities });
    }
  }

  return grouped;
}

/**
 * Look up an amenity by id, also resolving via legacyIds on modern definitions
 * and exact legacy catalogue entries.
 */
export function getAmenityById(id: string): AmenityDef | undefined {
  if (!id) return undefined;
  const direct = AMENITY_BY_ID[id];
  if (direct) return direct;

  const viaLegacyField = AMENITIES.find((a) => a.legacyIds?.includes(id));
  if (viaLegacyField) return viaLegacyField;

  const canonical = LEGACY_AMENITY_CANONICAL[id];
  if (canonical) return AMENITY_BY_ID[canonical];

  return undefined;
}

export function getAmenityLabel(id: string): string {
  return getAmenityById(id)?.label ?? id;
}

/**
 * Validate amenity ids. Optionally restrict to amenities available for a subtype.
 * Unknown ids are returned in `invalid`. Known ids (including legacy catalogue
 * entries) are returned in `valid`.
 */
export function validateAmenityIds(
  ids: string[],
  subtypeId?: string,
): { valid: string[]; invalid: string[] } {
  const allowed = subtypeId
    ? new Set(
        getAmenitiesForSubtype(subtypeId, { includeLegacy: true }).map((a) => a.id),
      )
    : null;

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of ids) {
    const def = getAmenityById(id);
    if (!def) {
      invalid.push(id);
      continue;
    }
    // Accept either the requested id (if it is a catalogue id) or the resolved def id
    const catalogueId = AMENITY_BY_ID[id] ? id : def.id;
    if (allowed && !allowed.has(catalogueId) && !allowed.has(def.id) && !AMENITY_BY_ID[id]) {
      // Legacy id that resolves to a modern amenity: allow if modern id is allowed
      const canonical = LEGACY_AMENITY_CANONICAL[id];
      if (canonical && allowed.has(canonical)) {
        valid.push(id);
        continue;
      }
      invalid.push(id);
      continue;
    }
    if (allowed && AMENITY_BY_ID[id] && !allowed.has(id)) {
      invalid.push(id);
      continue;
    }
    valid.push(id);
  }

  return { valid, invalid };
}

/**
 * Map legacy amenity ids to canonical modern ids where known.
 * Unknown ids are kept as-is.
 */
export function normalizeLegacyAmenities(ids: string[]): string[] {
  return ids.map((id) => LEGACY_AMENITY_CANONICAL[id] ?? id);
}

export function getSearchCategoryForSubtype(
  subtypeId: string,
): PropertySubtypeDef['searchCategory'] | undefined {
  return SUBTYPE_BY_ID[subtypeId]?.searchCategory;
}

/**
 * Human label for a subtype id or legacy coarse type.
 */
export function subtypeLabel(subtypeIdOrLegacy: string): string {
  const subtype = SUBTYPE_BY_ID[subtypeIdOrLegacy];
  if (subtype) return subtype.label;

  const resolved = resolveClassificationFromStoredType(subtypeIdOrLegacy);
  if (resolved) {
    const s = SUBTYPE_BY_ID[resolved.subtypeId];
    if (s) return s.label;
    const group = TYPE_GROUP_BY_ID[resolved.typeGroupId];
    if (group) return group.label;
  }

  const group = TYPE_GROUP_BY_ID[subtypeIdOrLegacy];
  if (group) return group.label;

  return subtypeIdOrLegacy;
}

/** Catalogue stats helpers (useful for docs / diagnostics) */
export function getCatalogueStats(): {
  categories: number;
  amenities: number;
  typeGroups: number;
  subtypes: number;
  amenityCategories: number;
} {
  return {
    categories: PROPERTY_CATEGORIES.length,
    amenities: AMENITIES.length,
    typeGroups: PROPERTY_TYPE_GROUPS.length,
    subtypes: Object.keys(SUBTYPE_BY_ID).length,
    amenityCategories: AMENITY_CATEGORIES.length,
  };
}

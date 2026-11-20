export type PropertyCategoryId = 'residential' | 'commercial' | 'land';
export type ListingKind = 'rent' | 'sale' | 'any';
export type AmenityAccessType = 'private' | 'shared' | 'communal';
export type AmenityInputType = 'boolean' | 'select';

export interface AmenityCategory {
  id: string;
  label: string;
  description?: string;
  icon?: string; // lucide icon name string
  displayOrder: number;
}

export interface AmenityDef {
  id: string; // stable snake_case
  categoryId: string;
  label: string;
  description?: string;
  /** If empty/undefined = available for all subtypes that include this category */
  applicableSubtypes?: string[];
  applicableListingKinds?: ListingKind[];
  inputType?: AmenityInputType;
  supportsAccessType?: boolean;
  supportsAdditionalCost?: boolean;
  /** Legacy wizard IDs that map to this amenity */
  legacyIds?: string[];
  /** Keywords used by search filters */
  searchAliases?: string[];
}

export interface PropertySubtypeDef {
  id: string; // stable kebab-case e.g. 'detached-house'
  label: string;
  description?: string;
  typeGroupId: string;
  amenityCategoryIds: string[];
  /** Which details form to show */
  detailsForm: 'residential' | 'commercial' | 'land';
  searchCategory?: 'flat' | 'house' | 'studio' | 'bungalow' | 'commercial' | 'land' | 'shared';
  applicableListingKinds?: ListingKind[];
}

export interface PropertyTypeGroupDef {
  id: string;
  categoryId: PropertyCategoryId;
  label: string;
  description?: string;
  icon?: string;
  subtypes: PropertySubtypeDef[];
}

export interface PropertyCategoryDef {
  id: PropertyCategoryId;
  label: string;
  description?: string;
  icon?: string;
}

export interface PropertyClassification {
  categoryId: PropertyCategoryId;
  typeGroupId: string;
  subtypeId: string;
}

export interface SelectedAmenity {
  amenityId: string;
  accessType?: AmenityAccessType;
  additionalCost?: boolean;
  notes?: string;
}

# Property catalogue

Single source of truth for UK property classification and amenities in Proptii.

**Do not hardcode amenity lists or property subtypes in UI components.** Import helpers from this module (or the mirrored backend copy) instead.

## Layout

| File | Role |
|------|------|
| `types.ts` | Shared TypeScript types |
| `amenities.ts` | Amenity categories + amenity definitions |
| `propertyTypes.ts` | Categories, type groups, subtypes, legacy type map |
| `index.ts` | Query / resolve / validate helpers |
| `propertyCatalogue.test.ts` | Vitest coverage for mappings and legacy behaviour |

Backend mirror (identical content):

`v2-backend/src/config/propertyCatalogue/`

## Concepts

- **Category** — `residential` | `commercial` | `land`
- **Type group** — e.g. `house`, `flat`, `warehouse` group `industrial`
- **Subtype** — stable kebab-case id, e.g. `detached-house`, `room-in-shared-house`
- **Amenity category** — groups amenities shown for a subtype (`outdoor_space`, `industrial_access`, …)
- **Amenity** — stable snake_case id (legacy wizard ids keep their original hyphenated form)

Each subtype declares `amenityCategoryIds`. Amenities whose `categoryId` is in that list are offered, unless `applicableSubtypes` further restricts them.

## Adding a property subtype

1. Open `propertyTypes.ts` and locate the correct type group (or add a new group under `PROPERTY_TYPE_GROUPS`).
2. Add a subtype with `st(...)`:
   - `id` — kebab-case, unique across the catalogue
   - `amenityCategoryIds` — only categories that make sense for this stock (do not copy another subtype blindly)
   - `detailsForm` — `residential` | `commercial` | `land`
   - `searchCategory` — coarse search facet when needed
3. If migrating an old coarse type string, extend `LEGACY_TYPE_MAP`.
4. Mirror the same change under `v2-backend/src/config/propertyCatalogue/`.
5. Run tests: `npx vitest run src/shared/propertyCatalogue/propertyCatalogue.test.ts`

## Adding an amenity

1. Open `amenities.ts`.
2. Confirm the amenity category exists in `AMENITY_CATEGORIES` (add one if needed, with a `displayOrder`).
3. Add the amenity via `am(id, label, categoryId, extra?)`:
   - `id` — snake_case (legacy exceptions use exact old wizard ids)
   - `applicableSubtypes` — set only when the amenity is subtype-specific
   - `applicableListingKinds` — e.g. `['rent']` for bills-included
   - `supportsAccessType` — when private / shared / communal matters
   - `supportsAdditionalCost` — care services, cleaning, etc.
   - `searchAliases` — keywords for search filters
   - `legacyIds` — old ids that should resolve to this amenity
4. If replacing a legacy wizard amenity, also update `LEGACY_AMENITY_CANONICAL`.
5. Ensure relevant subtypes include the amenity’s `categoryId` in `amenityCategoryIds`.
6. Mirror to the backend folder and run the catalogue tests.

## Helper cheatsheet

```ts
import {
  getTypeGroupsForCategory,
  getAmenitiesGroupedForSubtype,
  resolveClassificationFromStoredType,
  validateAmenityIds,
  normalizeLegacyAmenities,
  subtypeLabel,
} from '@/shared/propertyCatalogue'; // or relative / backend path

getAmenitiesGroupedForSubtype('detached-house', { listingKind: 'rent', search: 'garden' });
resolveClassificationFromStoredType('shared'); // → room-in-shared-house
normalizeLegacyAmenities(['wifi', 'pet-friendly']);
validateAmenityIds(['private_garden', 'nope'], 'detached-house');
```

## Counts

Use `getCatalogueStats()` from `index.ts` for live counts of categories, amenities, type groups and subtypes.

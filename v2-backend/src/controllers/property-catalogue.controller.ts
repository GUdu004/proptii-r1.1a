import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  getAllCategories,
  getTypeGroupsForCategory,
  getSubtypeById,
  getTypeGroupById,
  getAmenitiesGroupedForSubtype,
  getAmenitiesForSubtype,
  getAmenityById,
  getAmenityCategoriesForSubtype,
  AMENITIES,
  AMENITY_CATEGORIES,
  PROPERTY_TYPE_GROUPS,
  PROPERTY_CATEGORIES,
  type PropertyCategoryId,
  type ListingKind,
} from '../config/propertyCatalogue';

@ApiTags('Property Catalogue')
@Controller()
export class PropertyCatalogueController {
  @Get('property-types')
  @ApiOperation({ summary: 'List UK property categories, type groups, and subtypes' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter type groups by category id' })
  @ApiResponse({ status: 200, description: 'Property type catalogue' })
  listPropertyTypes(@Query('category') category?: string) {
    const categories = getAllCategories();
    const groups = category
      ? getTypeGroupsForCategory(category as PropertyCategoryId)
      : PROPERTY_TYPE_GROUPS;

    return {
      categories,
      typeGroups: groups.map((g) => ({
        id: g.id,
        categoryId: g.categoryId,
        label: g.label,
        description: g.description,
        icon: g.icon,
        subtypes: g.subtypes.map((s) => ({
          id: s.id,
          label: s.label,
          description: s.description,
          typeGroupId: s.typeGroupId,
          detailsForm: s.detailsForm,
          searchCategory: s.searchCategory,
          amenityCategoryIds: s.amenityCategoryIds,
        })),
      })),
    };
  }

  @Get('property-types/:typeId')
  @ApiOperation({ summary: 'Get a property subtype or type group by id' })
  @ApiParam({ name: 'typeId', description: 'Subtype id or type-group id' })
  getPropertyType(@Param('typeId') typeId: string) {
    const subtype = getSubtypeById(typeId);
    if (subtype) {
      const group = getTypeGroupById(subtype.typeGroupId);
      return {
        kind: 'subtype',
        subtype,
        typeGroup: group
          ? { id: group.id, categoryId: group.categoryId, label: group.label }
          : null,
        amenityCategories: getAmenityCategoriesForSubtype(typeId),
      };
    }

    const group = getTypeGroupById(typeId);
    if (group) {
      return {
        kind: 'typeGroup',
        typeGroup: {
          id: group.id,
          categoryId: group.categoryId,
          label: group.label,
          description: group.description,
          icon: group.icon,
          subtypes: group.subtypes,
        },
      };
    }

    const category = PROPERTY_CATEGORIES.find((c) => c.id === typeId);
    if (category) {
      return {
        kind: 'category',
        category,
        typeGroups: getTypeGroupsForCategory(category.id),
      };
    }

    throw new NotFoundException(`Unknown property type id: ${typeId}`);
  }

  @Get('property-types/:typeId/amenities')
  @ApiOperation({ summary: 'List amenity categories and features for a property subtype' })
  @ApiParam({ name: 'typeId', description: 'Property subtype id' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'listingKind', required: false, enum: ['rent', 'sale', 'any'] })
  @ApiQuery({ name: 'includeLegacy', required: false })
  getAmenitiesForType(
    @Param('typeId') typeId: string,
    @Query('search') search?: string,
    @Query('listingKind') listingKind?: ListingKind,
    @Query('includeLegacy') includeLegacy?: string,
  ) {
    const subtype = getSubtypeById(typeId);
    if (!subtype) {
      throw new NotFoundException(`Unknown property subtype: ${typeId}`);
    }

    const opts = {
      search,
      listingKind,
      includeLegacy: includeLegacy === '1' || includeLegacy === 'true',
    };

    return {
      subtypeId: typeId,
      subtypeLabel: subtype.label,
      groups: getAmenitiesGroupedForSubtype(typeId, opts),
      amenities: getAmenitiesForSubtype(typeId, opts),
    };
  }

  @Get('amenities')
  @ApiOperation({ summary: 'List the full amenity catalogue (or a single amenity by id)' })
  @ApiQuery({ name: 'id', required: false, description: 'Lookup a single amenity id' })
  @ApiQuery({ name: 'categoryId', required: false })
  listAmenities(
    @Query('id') id?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    if (id) {
      const amenity = getAmenityById(id);
      if (!amenity) throw new NotFoundException(`Unknown amenity: ${id}`);
      return amenity;
    }

    const amenities = categoryId
      ? AMENITIES.filter((a) => a.categoryId === categoryId)
      : AMENITIES;

    return { total: amenities.length, amenities };
  }

  @Get('amenities/categories')
  @ApiOperation({ summary: 'List amenity categories' })
  listAmenityCategories() {
    return {
      categories: [...AMENITY_CATEGORIES].sort((a, b) => a.displayOrder - b.displayOrder),
    };
  }
}

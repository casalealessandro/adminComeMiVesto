export interface AffiliateCatalogAuditSubcategory {
  subcategory: string;
  totalProducts: number;
  activeProducts: number;
  withImages: number;
  withGender: number;
  withColor: number;
}

export interface AffiliateCatalogAuditCategory {
  category: string;
  totalProducts: number;
  activeProducts: number;
  withImages: number;
  withGender: number;
  withColor: number;
  subcategories: AffiliateCatalogAuditSubcategory[];
}

export interface ComeMiVestoAuditCategory {
  id: string;
  categoryName: string | null;
  parentCategory: string | null;
  parentCategoryName: string | null;
  gender: unknown[] | null;
  status: boolean | string | null;
  order: number | null;
}

export interface AffiliateCatalogAudit {
  generatedAt: number;
  catalog: {
    summary: {
      total: number;
      active: number;
      inactive: number;
      withoutCategory: number;
    };
    dataQuality: {
      withImages: number;
      withoutImages: number;
      withGenderTargets: number;
      withoutGenderTargets: number;
      withNormalizedColor: number;
      withoutNormalizedColor: number;
    };
    categories: AffiliateCatalogAuditCategory[];
  };
  comeMiVestoCategories: ComeMiVestoAuditCategory[];
}

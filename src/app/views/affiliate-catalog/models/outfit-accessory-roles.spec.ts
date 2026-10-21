import { ACCESSORY_SUBCATEGORIES, accessoryRoleFromTaxonomy, isAllowedAccessoryProduct } from './outfit-accessory-roles';

describe('Fashion accessory taxonomy for outfit roles', () => {
  it('maps only the canonical A_Accessori subdivisions', () => {
    expect(accessoryRoleFromTaxonomy('A_Accessori','cinture')).toBe('ACCESSORY');
    expect(accessoryRoleFromTaxonomy('A_Accessori','Borse_a_mano')).toBe('BAG');
    expect(accessoryRoleFromTaxonomy('A_Accessori','occhiali')).toBe('HEADWEAR');
    expect(accessoryRoleFromTaxonomy('scarpe','cinture')).toBeNull();
    expect(accessoryRoleFromTaxonomy('A_Accessori','unknown')).toBeNull();
    expect(ACCESSORY_SUBCATEGORIES['BAG']).not.toContain('cinture');
  });

  it('refuses incompatible category and role without classifying products in the browser', () => {
    expect(isAllowedAccessoryProduct('ACCESSORY','A_Accessori','cinture')).toBeTrue();
    expect(isAllowedAccessoryProduct('BAG','A_Accessori','cinture')).toBeFalse();
    expect(isAllowedAccessoryProduct('HEADWEAR','A_Accessori','Borse_tracolla')).toBeFalse();
    expect(isAllowedAccessoryProduct('BAG','scarpe','Borse_tracolla')).toBeFalse();
  });
});

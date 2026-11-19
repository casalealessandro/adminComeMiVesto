import { ACCESSORY_SUBCATEGORIES, accessoryRoleFromTaxonomy, isAllowedAccessoryProduct, isAllowedOutfitRoleProduct } from './outfit-accessory-roles';

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

describe('Replacement category compatibility with the original outfit role', () => {
  it('allows skirts and jeans as alternatives for the BOTTOM slot', () => {
    expect(isAllowedOutfitRoleProduct('BOTTOM', 'conna', 'gonne_midi')).toBeTrue();
    expect(isAllowedOutfitRoleProduct('BOTTOM', 'P_Pantaloni', 'jeans')).toBeTrue();
    expect(isAllowedOutfitRoleProduct('BOTTOM', 'scarpe', 'stivali')).toBeFalse();
  });

  it('uses subcategory to distinguish mixed clothing and accessory roles', () => {
    expect(isAllowedOutfitRoleProduct('TOP', 'ABC_Completi', 'body')).toBeTrue();
    expect(isAllowedOutfitRoleProduct('TOP', 'ABC_Completi', 'vestito_midi')).toBeFalse();
    expect(isAllowedOutfitRoleProduct('OUTERWEAR', 'ABC_Completi', 'blazer')).toBeTrue();
    expect(isAllowedOutfitRoleProduct('BAG', 'A_Accessori', 'cinture')).toBeFalse();
  });
});

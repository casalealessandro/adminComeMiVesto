/** UI companion to the canonical backend OutfitRoleCategory mapping.
 * No client-side product matching, price resolution, or AI classification.
 */
export const ACCESSORY_CATEGORY = 'A_Accessori';
export const ACCESSORY_SUBCATEGORIES: Readonly<Record<string, readonly string[]>> = {
  BAG: ['Borse_a_mano','Borse_a_spalla','Borse_tracolla','marsupi','zaini','pochette'],
  ACCESSORY: ['cinture','collane','bracciali','ANL','orecchini','cravatte','papillon','calze'],
  HEADWEAR: ['cappelli','occhiali'],
};
export const ACCESSORY_ROLES = ['BAG','ACCESSORY','HEADWEAR'] as const;
export const isAllowedAccessoryProduct = (role: string, category: string, subcategory: string): boolean =>
  !ACCESSORY_ROLES.some(entry => entry === role) ||
    (category === ACCESSORY_CATEGORY &&
      (ACCESSORY_SUBCATEGORIES[role] ?? []).includes(subcategory));
/** UI eligibility hint; backend OutfitRoleCategory is authoritative on save.
 * Keep this mapping aligned with the backend when taxonomy rules change.
 */
export const isAllowedOutfitRoleProduct = (role: string, category: string, subcategory: string): boolean => {
  if (ACCESSORY_ROLES.some(entry => entry === role)) {
    return isAllowedAccessoryProduct(role, category, subcategory);
  }
  if (role === 'SHOES') return category === 'scarpe';
  if (role === 'BOTTOM') return category === 'P_Pantaloni' || category === 'conna';
  if (role === 'TOP') return category === 'camicie' ||
    (category === 'M_Maglieria' && ['tshirt', 'top', 'polo', 'pullover', 'dolcevita', 'felpe'].includes(subcategory)) ||
    (category === 'ABC_Completi' && subcategory === 'body');
  if (role === 'DRESS') return (category === 'ABC_Completi' &&
      ['vestito_corto', 'vestito_midi', 'vestito_helter', 'tutine'].includes(subcategory)) ||
    (category === 'tute' && subcategory === 'tute_intere');
  if (role === 'OUTERWEAR') return category === 'cappotti' ||
    (category === 'ABC_Completi' && subcategory === 'blazer') ||
    (category === 'M_Maglieria' && subcategory === 'cardigan');
  return false;
};

export const accessoryRoleFromTaxonomy = (category: string, subcategory: string): string | null =>
  category === ACCESSORY_CATEGORY
    ? (ACCESSORY_ROLES.find(role => ACCESSORY_SUBCATEGORIES[role].includes(subcategory)) ?? null)
    : null;

export const OUTFIT_ROLE_LABELS: Readonly<Record<string,string>> = {
  TOP: 'Parte superiore',
  BOTTOM: 'Pantaloni e gonne',
  DRESS: 'Abito o tuta intera',
  SHOES: 'Scarpe',
  OUTERWEAR: 'Giacche e capispalla',
  BAG: 'Borse',
  ACCESSORY: 'Cinture e accessori',
  HEADWEAR: 'Cappelli e occhiali',
};
export const outfitRoleLabel = (role: string): string => OUTFIT_ROLE_LABELS[role] ?? role;

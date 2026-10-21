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
export const accessoryRoleFromTaxonomy = (category: string, subcategory: string): string | null =>
  category === ACCESSORY_CATEGORY
    ? (ACCESSORY_ROLES.find(role => ACCESSORY_SUBCATEGORIES[role].includes(subcategory)) ?? null)
    : null;

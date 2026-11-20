/** The canonical outfitsCategories documents expose a stable id and a display name.
 * Keep ids in requests and select values; never replace them with translated labels.
 */
export interface OutfitTaxonomyOption {
  id: string;
  categoryName: string;
}

/** Used only when the taxonomy description is missing or its lookup fails. */
export const readableTaxonomyName = (id: string, categoryName?: string): string => {
  if (typeof categoryName === 'string' && categoryName.trim()) return categoryName.trim();
  const knownRoots: Readonly<Record<string, string>> = {
    P_Pantaloni: 'Pantaloni e jeans',
    conna: 'Gonne',
    ABC_Completi: 'Completi e abiti',
    M_Maglieria: 'Maglieria',
    A_Accessori: 'Accessori',
  };
  if (knownRoots[id]) return knownRoots[id];
  const words = id.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Categoria senza descrizione';
};

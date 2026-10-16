import { buildMappingRuleFields } from './affiliate-mapping-rule-form.repository';
import { AffiliateMappingRulesComponent, buildMappingRuleColumns, mappingRuleFormData, mappingRuleFromForm } from './affiliate-mapping-rules.component';
import { comeMiVestoPopupComponents } from '../../../../app-popup-components';
import { AffiliateMappingRule } from '../../services/affiliate-catalog.service';

describe('Dizionari affiliati con DynamicForm e DataGrid', () => {
  const season: AffiliateMappingRule = {
    id: 'season-test', type: 'SEASON', label: 'Abbigliamento estivo', aliases: ['lino'],
    enabled: true, data: {
      category: 'Abbigliamento', seasons: ['SUMMER'], priority: 120,
      requireAll: [['abito', 'lino']], exclude: ['invernale'],
    },
  };

  it('non usa un getter che ricrea le righe DataGrid ad ogni change detection', () => {
    const descriptor = Object.getOwnPropertyDescriptor(AffiliateMappingRulesComponent.prototype, 'filtered');
    expect(descriptor?.get).toBeUndefined();
    expect(typeof AffiliateMappingRulesComponent.prototype.applyFilter).toBe('function');
  });

  it('registra il DynamicForm nel popup core', () => {
    expect(comeMiVestoPopupComponents.some(x => x.name === 'AffiliateMappingRuleFormHostComponent')).toBeTrue();
  });

  it('espone colonne DataGrid con modifica e disattivazione solo per admin', () => {
    expect(buildMappingRuleColumns(true)[0].data.some(col => col.button?.name === 'edit')).toBeTrue();
    expect(buildMappingRuleColumns(false)[0].data.some(col => col.button?.name === 'edit')).toBeFalse();
  });

  it('usa DynamicForm senza chiedere un nuovo ID in modifica', () => {
    expect(buildMappingRuleFields('SEASON', true).some(field => field.name === 'id')).toBeFalse();
    expect(buildMappingRuleFields('SEASON', false).some(field => field.name === 'id')).toBeTrue();
    expect(buildMappingRuleFields('SEASON', true).some(field => field.name === 'requireAll')).toBeTrue();
  });

  it('permette di editare 100 termini di 120 caratteri ciascuno', () => {
    const aliasesField = buildMappingRuleFields('SEASON', true).find(field => field.name === 'aliases');
    expect(aliasesField?.maxLength).toBeGreaterThanOrEqual(100 * 120 + 99);
    const aliases = Array.from({ length: 100 }, (_, index) => ('term-' + index).padEnd(120, 'x'));
    const form = { ...mappingRuleFormData(season), aliases: aliases.join('\n') };
    const mapped = mappingRuleFromForm(season, form, true);
    expect(mapped.aliases).toEqual(aliases);
  });

  it('usa la tassonomia reale per categoria e sottocategoria in cascata in creazione e modifica', () => {
    for (const editing of [false, true]) {
      const fields = buildMappingRuleFields('CATEGORY', editing);
      const category = fields.find(field => field.name === 'category');
      const subcategory = fields.find(field => field.name === 'subcategory');
      expect(category?.type).toBe('selectBox');
      expect(category?.required).toBeTrue();
      expect(category?.selectOptions).toEqual(jasmine.objectContaining({
        remote: true, api: 'outfitCategories', parent: null,
        valueExp: 'id', displayExp: 'categoryName',
      }));
      expect(subcategory?.type).toBe('selectBox');
      expect(subcategory?.selectOptions).toEqual(jasmine.objectContaining({
        remote: true, api: 'outfitCategories', parent: 'category',
        valueExp: 'id', displayExp: 'categoryName',
      }));
    }
    expect(buildMappingRuleFields('SEASON', true).some(field => field.name === 'subcategory')).toBeFalse();
  });

  it('mantiene gli ID di categoria e sottocategoria in modifica', () => {
    const current: AffiliateMappingRule = {
      id: 'category-123', type: 'CATEGORY', label: 'T-shirt', aliases: ['maglietta'],
      enabled: true, data: { category: 'M_Maglieria', subcategory: 'tshirt', genders: [] },
    };
    const form = mappingRuleFormData(current);
    expect(form['category']).toBe('M_Maglieria');
    expect(form['subcategory']).toBe('tshirt');
    const updated = mappingRuleFromForm(current, form, true);
    expect(updated.data['category']).toBe('M_Maglieria');
    expect(updated.data['subcategory']).toBe('tshirt');
  });

  it('preserva le condizioni stagionali e le esclusioni durante la modifica', () => {
    const form = mappingRuleFormData(season);
    const mapped = mappingRuleFromForm(season, { ...form, aliases: 'lino\nlinen' }, true);
    expect(mapped.id).toBe('season-test');
    expect(mapped.aliases).toEqual(['lino', 'linen']);
    expect(mapped.data['requireAll']).toEqual([['abito', 'lino']]);
    expect(mapped.data['exclude']).toEqual(['invernale']);
  });

  it('rifiuta JSON non valido per requireAll', () => {
    expect(() => mappingRuleFromForm(season,
      { ...mappingRuleFormData(season), requireAll: '{errore' }, true)).toThrow();
  });
});

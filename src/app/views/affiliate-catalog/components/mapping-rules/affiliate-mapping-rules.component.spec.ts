import { buildMappingRuleFields } from './affiliate-mapping-rule-form.repository';
import { buildMappingRuleColumns, mappingRuleFormData, mappingRuleFromForm } from './affiliate-mapping-rules.component';
import { AffiliateMappingRule } from '../../services/affiliate-catalog.service';

describe('Dizionari affiliati con DynamicForm e DataGrid', () => {
  const season: AffiliateMappingRule = {
    id: 'season-test', type: 'SEASON', label: 'Abbigliamento estivo', aliases: ['lino'],
    enabled: true, data: {
      category: 'Abbigliamento', seasons: ['SUMMER'], priority: 120,
      requireAll: [['abito', 'lino']], exclude: ['invernale'],
    },
  };

  it('espone colonne DataGrid con modifica e disattivazione solo per admin', () => {
    expect(buildMappingRuleColumns(true)[0].data.some(col => col.button?.name === 'edit')).toBeTrue();
    expect(buildMappingRuleColumns(false)[0].data.some(col => col.button?.name === 'edit')).toBeFalse();
  });

  it('usa DynamicForm senza chiedere un nuovo ID in modifica', () => {
    expect(buildMappingRuleFields('SEASON', true).some(field => field.name === 'id')).toBeFalse();
    expect(buildMappingRuleFields('SEASON', false).some(field => field.name === 'id')).toBeTrue();
    expect(buildMappingRuleFields('SEASON', true).some(field => field.name === 'requireAll')).toBeTrue();
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

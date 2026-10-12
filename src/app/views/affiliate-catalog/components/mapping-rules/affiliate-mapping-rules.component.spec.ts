import { AffiliateMappingRulesComponent, buildMappingRuleColumns, mappingRuleFormData, mappingRuleFromForm } from './affiliate-mapping-rules.component';
import { AffiliateMappingRuleFormHostComponent } from './affiliate-mapping-rule-form-host.component';
import { comeMiVestoPopupComponents } from '../../../../app-popup-components';
import { AffiliateMappingRule } from '../../services/affiliate-catalog.service';

describe('Dizionari affiliati: un solo form persistito in Firestore', () => {
  const season: AffiliateMappingRule = {
    id: 'season-summer', type: 'SEASON', label: 'Estate', aliases: ['lino'],
    enabled: true, data: {
      category: 'Stagioni compatibili', seasons: ['SUMMER'], priority: 120,
      requireAll: [['abito', 'lino']], exclude: ['invernale'],
    },
  };

  it('mantiene il DataGrid e il popup esistenti', () => {
    const descriptor = Object.getOwnPropertyDescriptor(AffiliateMappingRulesComponent.prototype, 'filtered');
    expect(descriptor?.get).toBeUndefined();
    expect(comeMiVestoPopupComponents.some(x => x.name === 'AffiliateMappingRuleFormHostComponent')).toBeTrue();
    expect(buildMappingRuleColumns(true)[0].data.some(col => col.button?.name === 'edit')).toBeTrue();
    expect(buildMappingRuleColumns(false)[0].data.some(col => col.button?.name === 'edit')).toBeFalse();
  });

  it('carica lo stesso documento Firestore in creazione e modifica', () => {
    const host = Object.create(AffiliateMappingRuleFormHostComponent.prototype) as AffiliateMappingRuleFormHostComponent;
    host.itemData = { mode: 'edit', rule: season };
    expect(host.formId).toBe('affiliate-mapping-rule');
    host.itemData = { mode: 'create', rule: season };
    expect(host.formId).toBe('affiliate-mapping-rule');
  });

  it('mantiene intatti campi tecnici non esposti nel nuovo form', () => {
    const data = mappingRuleFormData(season);
    expect(data['type']).toBe('SEASON');
    expect(data['value']).toBe('SUMMER');
    const result = mappingRuleFromForm(season, { ...data, aliases: 'lino\nlinen' }, true);
    expect(result.id).toBe('season-summer');
    expect(result.aliases).toEqual(['lino', 'linen']);
    expect(result.data['priority']).toBe(120);
    expect(result.data['requireAll']).toEqual([['abito', 'lino']]);
    expect(result.data['exclude']).toEqual(['invernale']);
  });

  it('non consente cambio tipo o cambio stagione canonica', () => {
    const input = mappingRuleFormData(season);
    expect(() => mappingRuleFromForm(season, { ...input, type: 'COLOR' }, true)).toThrow();
    expect(() => mappingRuleFromForm(season, { ...input, value: 'WINTER' }, true)).toThrow();
  });

  it('traduce un unico campo valore per categoria, colore e genere', () => {
    const category: AffiliateMappingRule = {
      id: 'category-1', type: 'CATEGORY', label: 'Abbigliamento', aliases: ['camicia'],
      enabled: true, data: { category: 'abbigliamento', subcategory: 'camicie', genders: ['D'] },
    };
    const color: AffiliateMappingRule = {
      id: 'color-N', type: 'COLOR', label: 'Nero', aliases: ['black'],
      enabled: true, data: { colorId: 'N' },
    };
    const gender: AffiliateMappingRule = {
      id: 'gender-unisex', type: 'GENDER', label: 'Unisex', aliases: ['unisex'],
      enabled: true, data: { genderTargets: ['U', 'D'] },
    };
    expect(mappingRuleFormData(category)['value']).toBe('abbigliamento / camicie');
    expect(mappingRuleFromForm(category, mappingRuleFormData(category), true).data).toEqual(category.data);
    expect(mappingRuleFormData(color)['value']).toBe('N');
    expect(mappingRuleFromForm(color, mappingRuleFormData(color), true).data).toEqual(color.data);
    expect(mappingRuleFormData(gender)['value']).toBe('U,D');
    expect(mappingRuleFromForm(gender, mappingRuleFormData(gender), true).data).toEqual(gender.data);
  });

  it('genera un ID per una nuova regola senza richiederlo nel form', () => {
    const value: AffiliateMappingRule = {
      id: '', type: 'COLOR', label: '', aliases: [], enabled: true,
      data: { colorId: '' },
    };
    const result = mappingRuleFromForm(value, {
      type: 'COLOR', label: 'Petrolio', value: 'PET', aliases: 'petrolio',
      enabled: true, note: '',
    }, false);
    expect(result.id).toMatch(/^color-pet-/);
    expect(result.data['colorId']).toBe('PET');
  });
});

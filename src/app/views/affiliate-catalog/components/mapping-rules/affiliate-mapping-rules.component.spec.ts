import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataGridComponent } from '../../../../core/data-grid/data-grid.component';
import { AuthService } from '../../../../services/auth.service';
import { PopUpService } from '../../../../core/popup/popup.service';
import { buildMappingRuleFields } from './affiliate-mapping-rule-form.repository';
import { AffiliateMappingRulesComponent, buildMappingRuleColumns, mappingRuleFormData, mappingRuleFromForm, mappingRuleSelectTypes } from './affiliate-mapping-rules.component';
import { comeMiVestoPopupComponents } from '../../../../app-popup-components';
import { AffiliateCatalogService, AffiliateMappingRule } from '../../services/affiliate-catalog.service';

describe('Dizionari affiliati con DynamicForm e DataGrid', () => {
  const season: AffiliateMappingRule = {
    id: 'season-test', type: 'SEASON', label: 'Abbigliamento estivo', aliases: ['lino'],
    enabled: true, data: {
      category: 'Abbigliamento', seasons: ['SUMMER'], priority: 120,
      requireAll: [['abito', 'lino']], exclude: ['invernale'],
    },
  };

  it('include STYLE dalla risposta API senza esporre altri tipi privi di editor', () => {
    const style: AffiliateMappingRule = {
      id: 'style-sporty', type: 'STYLE', label: 'Sportivo',
      aliases: ['scarpe running'], enabled: false, data: { value: 'SPORTY' },
    };
    const unsupported: AffiliateMappingRule = {
      id: 'fit-wide', type: 'FIT', label: 'Wide',
      aliases: ['baggy'], enabled: true, data: { value: 'WIDE' },
    };
    expect(mappingRuleSelectTypes([season, style, unsupported])).toEqual([
      'CATEGORY', 'COLOR', 'GENDER', 'SEASON', 'STYLE',
    ]);
    expect(mappingRuleSelectTypes([season])).toEqual(['CATEGORY', 'COLOR', 'GENDER', 'SEASON']);
  });

  it('renderizza la quinta option STYLE dopo il caricamento delle regole e filtra correttamente', async () => {
    const style: AffiliateMappingRule = {
      id: 'style-sporty', type: 'STYLE', label: 'Sportivo',
      aliases: ['scarpe running'], enabled: false, data: { value: 'SPORTY' },
    };
    const api = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', ['getMappingRules']);
    api.getMappingRules.and.returnValue(of([season, style]));

    await TestBed.configureTestingModule({
      imports: [AffiliateMappingRulesComponent],
      providers: [
        { provide: AffiliateCatalogService, useValue: api },
        { provide: AuthService, useValue: { isAdmin: () => false } },
        { provide: PopUpService, useValue: {} },
      ],
    }).overrideComponent(AffiliateMappingRulesComponent, {
      remove: { imports: [DataGridComponent] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    }).compileComponents();

    const fixture = TestBed.createComponent(AffiliateMappingRulesComponent);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#rule-type');
    expect(Array.from(select.options).map(option => option.textContent?.trim())).toEqual([
      'CATEGORY', 'COLOR', 'GENDER', 'SEASON', 'STYLE',
    ]);
    expect(select.getAttribute('data-dictionary-options')).toBe('api-aware-v2');
    select.value = 'STYLE';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.type).toBe('STYLE');
    expect(fixture.componentInstance.filtered.map(rule => rule.id)).toEqual(['style-sporty']);
  });

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

  it('supporta il dizionario STYLE con selezione dello stile canonico', () => {
    const fields = buildMappingRuleFields('STYLE', true);
    const target = fields.find(field => field.name === 'styleValue');
    expect(target?.type).toBe('selectBox');
    expect(target?.selectOptions?.options?.length).toBe(10);
    expect(buildMappingRuleFields('STYLE', true).some(field => field.name === 'requireAll')).toBeFalse();
    const style: AffiliateMappingRule = {
      id: 'style-sporty', type: 'STYLE', label: 'Sportivo', aliases: ['scarpe running'],
      enabled: false, data: { value: 'SPORTY' },
    };
    const form = mappingRuleFormData(style);
    expect(form['styleValue']).toBe('SPORTY');
    const updated = mappingRuleFromForm(style, { ...form, styleValue: 'ELEGANT', aliases: 'abito da sera' }, true);
    expect(updated.id).toBe('style-sporty');
    expect(updated.data['value']).toBe('ELEGANT');
    expect(updated.aliases).toEqual(['abito da sera']);
    expect(updated.enabled).toBeFalse();
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

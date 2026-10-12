import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { DataGridComponent } from '../../../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../../../core/data-grid/models/data-grid.models';
import { confirm } from '../../../../core/dialogs/ui-dialogs';
import { AuthService } from '../../../../services/auth.service';
import { AffiliateCatalogService, AffiliateMappingRule, AffiliateMappingRuleType } from '../../services/affiliate-catalog.service';
import { PopUpService } from '../../../../core/popup/popup.service';
import type { AffiliateMappingRuleFormContext, AffiliateMappingRuleFormResult } from './affiliate-mapping-rule-form-host.component';

const TYPES: AffiliateMappingRuleType[] = ['CATEGORY', 'COLOR', 'GENDER', 'SEASON'];
const values = (input: unknown): string[] => Array.isArray(input) ?
  input.filter((v): v is string => typeof v === 'string') : [];
const lines = (input: unknown): string[] =>
  [...new Set(String(input ?? '').split(/\r?\n|,/g).map(v => v.trim()).filter(Boolean))];

export interface MappingRuleGridRow extends AffiliateMappingRule {
  aliasesLabel: string;
  enabledLabel: string;
}

const gridColumn = (dataField: string, colCaption: string, colWidth: number, type: ColData['type'] = 'campo'): ColData =>
  ({ dataField, colCaption, colWidth, type, colVisible: true, allowEditing: false, edit: false, groupDataField: undefined });

export function buildMappingRuleColumns(isAdmin: boolean): Colonne[] {
  const cols: ColData[] = [
    gridColumn('label', 'Valore', 210),
    gridColumn('aliasesLabel', 'Termini riconosciuti', 400),
    gridColumn('enabledLabel', 'Attiva', 80),
  ];
  if (isAdmin) cols.push(
    { ...gridColumn('', 'Modifica', 90, 'campoButton'),
      button: { text: '', name: 'edit', event: 'edit', icon: 'mdi mdi-pencil-outline', hint: 'Modifica regola' } },
    { ...gridColumn('', 'Disattiva', 95, 'campoButton'),
      button: { text: '', name: 'disable', event: 'disable', icon: 'mdi mdi-cancel', hint: 'Disattiva regola' } },
  );
  return [{ itemType: 'group', groupDataField: '', data: cols }];
}

const targetValue = (rule: AffiliateMappingRule): string => {
  if (rule.type === 'CATEGORY') {
    const category = String(rule.data['category'] ?? '');
    const subcategory = String(rule.data['subcategory'] ?? '');
    return subcategory ? category + ' / ' + subcategory : category;
  }
  if (rule.type === 'COLOR') return String(rule.data['colorId'] ?? '');
  if (rule.type === 'GENDER') return values(rule.data['genderTargets']).join(',');
  if (rule.type === 'SEASON') return values(rule.data['seasons']).join(',');
  return '';
};

export function mappingRuleFormData(rule: AffiliateMappingRule): Record<string, unknown> {
  return {
    type: rule.type,
    label: rule.label,
    value: targetValue(rule),
    aliases: rule.aliases.join('\n'),
    note: rule.note ?? '',
    enabled: rule.enabled,
  };
}

/** Translate one persisted form shape into the existing per-dictionary API contract. */
export function mappingRuleFromForm(
  base: AffiliateMappingRule,
  form: Record<string, unknown>,
  isEditing: boolean,
): AffiliateMappingRule {
  const type = String(form['type'] ?? '').trim();
  if (type !== base.type) throw new Error('Il dizionario della regola non può essere cambiato.');
  const value = String(form['value'] ?? '').trim();
  const label = String(form['label'] ?? '').trim();
  const aliases = lines(form['aliases']);
  const enabled = form['enabled'] === true;
  if (!value || !label) throw new Error('Descrizione e valore sono obbligatori.');
  if (enabled && aliases.length === 0) throw new Error('Inserisci almeno un termine riconosciuto.');
  const data: Record<string, unknown> = { ...base.data };
  if (base.type === 'CATEGORY') {
    const [category, ...rest] = value.split(/\s+\/\s+/);
    data['category'] = category.trim();
    data['subcategory'] = rest.join(' / ').trim();
    data['genders'] = values(base.data['genders']);
  } else if (base.type === 'COLOR') {
    data['colorId'] = value;
  } else if (base.type === 'GENDER') {
    const targets = lines(value);
    if (!targets.length || targets.some(target => target !== 'U' && target !== 'D')) {
      throw new Error('Genere valido: U, D oppure U,D.');
    }
    data['genderTargets'] = targets;
  } else if (base.type === 'SEASON') {
    const seasons = lines(value).map(v => v.toUpperCase());
    if (seasons.length !== 1 || !['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].includes(seasons[0])) {
      throw new Error('Seleziona una delle quattro stagioni.');
    }
    // Built-in season documents have canonical, non-changing season identifiers.
    if (isEditing && /^season-(spring|summer|autumn|winter)$/.test(base.id)
        && base.id !== 'season-' + seasons[0].toLowerCase()) {
      throw new Error('Non puoi cambiare la stagione associata alla regola canonica.');
    }
    data['category'] = String(base.data['category'] ?? 'Stagioni compatibili');
    data['seasons'] = seasons;
    data['priority'] = Number(base.data['priority'] ?? 100);
    data['requireAll'] = base.data['requireAll'] ?? [];
    data['exclude'] = base.data['exclude'] ?? [];
  }
  // Auto-generated on creation, never change the document ID during editing.
  const id = isEditing ? base.id :
    type.toLowerCase() + '-' + value.toLocaleLowerCase('it')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
    + '-' + Date.now().toString(36);
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('ID della regola non valido.');
  return { ...base, id, label, aliases, enabled, data, note: String(form['note'] ?? '').trim() };
}

@Component({
  selector: 'app-affiliate-mapping-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './affiliate-mapping-rules.component.html',
})
export class AffiliateMappingRulesComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AffiliateCatalogService);
  private readonly popupService = inject(PopUpService);
  readonly types = TYPES;
  all: AffiliateMappingRule[] = [];
  type: AffiliateMappingRuleType = 'CATEGORY';
  query = '';
  loading = false;
  saving = false;
  error = '';
  notice = '';
  columns: Colonne[] = [];

  ngOnInit(): void {
    this.columns = buildMappingRuleColumns(this.auth.isAdmin());
    this.refresh();
  }
  /** Stable reference for the DataGrid signal input: never allocate on each change-detection cycle. */
  filtered: MappingRuleGridRow[] = [];

  applyFilter(): void {
    const q = this.query.trim().toLocaleLowerCase('it');
    this.filtered = this.all.filter(r => r.type === this.type &&
      (!q || [r.id, r.label, ...r.aliases].some(v => v.toLocaleLowerCase('it').includes(q))))
      .map(rule => ({ ...rule, aliasesLabel: rule.aliases.join(', '), enabledLabel: rule.enabled ? 'Sì' : 'No' }));
  }
  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.api.getMappingRules().pipe(timeout({ first: 20000 }), finalize(() => this.loading = false)).subscribe({
      next: rules => { this.all = rules; this.applyFilter(); },
      error: () => { this.error = 'Caricamento dizionari non riuscito o scaduto. Riprova con Aggiorna e controlla la risposta HTTP di mapping-rules.'; },
    });
  }
  onTypeChange(): void { this.applyFilter(); }

  edit(rule: AffiliateMappingRule): void {
    if (!this.auth.isAdmin()) return;
    this.openRulePopup({ mode: 'edit', rule: structuredClone(rule) });
  }

  add(): void {
    if (!this.auth.isAdmin()) return;
    // The four seasons are canonical records: edit their terms instead of creating a fifth rule.
    if (this.type === 'SEASON') { this.error = 'Modifica una delle quattro stagioni esistenti.'; return; }
    const data: Record<string, unknown> = this.type === 'CATEGORY'
      ? { category: '', subcategory: '', genders: [] }
      : this.type === 'COLOR' ? { colorId: '' }
      : this.type === 'GENDER' ? { genderTargets: ['U'] }
      : { category: 'Stagioni compatibili', seasons: ['SUMMER'], priority: 100, requireAll: [], exclude: [] };
    this.openRulePopup({
      mode: 'create',
      rule: { id: '', type: this.type, label: '', aliases: [], enabled: true, data, origin: 'CUSTOM' },
    });
  }

  private openRulePopup(context: AffiliateMappingRuleFormContext): void {
    this.error = '';
    const guid = `affiliate-mapping-rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = context.mode === 'edit' ? 'Modifica regola' : 'Nuova regola';
    this.popupService.setNewPopUp(
      guid, 'AffiliateMappingRuleFormHostComponent', context, 760,
      undefined, undefined, false, true, title, 'center', false,
    );
    void this.popupService.getOutputComponent(guid).then((result: AffiliateMappingRuleFormResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      if (result?.name === 'saved') {
        this.notice = context.mode === 'edit' ? 'Regola aggiornata.' : 'Regola creata.';
        this.refresh();
      }
    });
  }

  gridAction(event: { name?: string; rowData?: MappingRuleGridRow }): void {
    if (!this.auth.isAdmin() || !event.rowData) return;
    if (event.name === 'edit') this.edit(event.rowData);
    if (event.name === 'disable' && event.rowData.enabled) this.disable(event.rowData);
  }
  disable(rule: AffiliateMappingRule): void {
    if (!this.auth.isAdmin() || this.saving) return;
    confirm('Disattivare la regola? Potrai riattivarla modificandola.', 'Disattiva regola', accepted => {
      if (!accepted) return;
      this.saving = true;
      this.error = '';
      this.api.disableMappingRule(rule.id).pipe(finalize(() => this.saving = false)).subscribe({
        next: () => { this.notice = 'Regola disattivata.'; this.refresh(); },
        error: () => { this.error = 'Impossibile disattivare la regola.'; },
      });
    });
  }
}

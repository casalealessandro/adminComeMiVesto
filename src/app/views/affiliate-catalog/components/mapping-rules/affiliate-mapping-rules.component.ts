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

export function mappingRuleFormData(rule: AffiliateMappingRule): Record<string, unknown> {
  return {
    id: rule.id, label: rule.label, aliases: rule.aliases.join('\n'),
    category: rule.data['category'] ?? '', subcategory: rule.data['subcategory'] ?? '',
    colorId: rule.data['colorId'] ?? '',
    genders: values(rule.data['genders']).join(','),
    genderTargets: values(rule.data['genderTargets']).join(','),
    seasons: values(rule.data['seasons']).join(', '),
    priority: rule.data['priority'] ?? 100,
    requireAll: JSON.stringify(rule.data['requireAll'] ?? []),
    exclude: values(rule.data['exclude']).join('\n'),
    note: rule.note ?? '', enabled: rule.enabled,
  };
}

export function mappingRuleFromForm(
  base: AffiliateMappingRule,
  form: Record<string, unknown>,
  isEditing: boolean,
): AffiliateMappingRule {
  const id = isEditing ? base.id : String(form['id'] ?? '').trim();
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('ID non valido (lettere, numeri, - o _).');
  const aliases = lines(form['aliases']);
  const enabled = form['enabled'] === true;
  const data: Record<string, unknown> = { ...base.data };
  if (base.type === 'CATEGORY') {
    data['category'] = String(form['category'] ?? '').trim();
    data['subcategory'] = String(form['subcategory'] ?? '').trim();
    data['genders'] = lines(form['genders']);
  } else if (base.type === 'COLOR') {
    data['colorId'] = String(form['colorId'] ?? '').trim();
  } else if (base.type === 'GENDER') {
    data['genderTargets'] = lines(form['genderTargets']);
  } else if (base.type === 'SEASON') {
    data['category'] = String(form['category'] ?? '').trim();
    data['seasons'] = lines(form['seasons']).map(s => s.toUpperCase());
    data['priority'] = Number(form['priority']);
    const parsed = JSON.parse(String(form['requireAll'] || '[]')) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(row => Array.isArray(row) && row.every(term => typeof term === 'string'))) {
      throw new Error('Le condizioni requireAll devono essere un array JSON di liste di termini.');
    }
    data['requireAll'] = parsed;
    data['exclude'] = lines(form['exclude']);
  }
  return {
    ...base, id, label: String(form['label'] ?? '').trim(), aliases, enabled, data,
    note: String(form['note'] ?? '').trim(),
  };
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
    const data: Record<string, unknown> = this.type === 'CATEGORY'
      ? { category: '', subcategory: '', genders: [] }
      : this.type === 'COLOR' ? { colorId: '' }
      : this.type === 'GENDER' ? { genderTargets: ['U'] }
      : { category: 'Stagioni dichiarate', seasons: ['SUMMER'], priority: 100, requireAll: [], exclude: [] };
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

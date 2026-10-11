import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { AffiliateCatalogService, AffiliateMappingRule, AffiliateMappingRuleType } from '../../services/affiliate-catalog.service';

const RULE_TYPES: AffiliateMappingRuleType[] =
  ['CATEGORY', 'COLOR', 'GENDER', 'SEASON'];
const FASHION_SEASONS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
const splitAliases = (value: string): string[] =>
  [...new Set(value.split(/\r?\n|,/g).map(x => x.trim()).filter(Boolean))];

@Component({
  selector: 'app-affiliate-mapping-rules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './affiliate-mapping-rules.component.html',
})
export class AffiliateMappingRulesComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AffiliateCatalogService);
  readonly types = RULE_TYPES;
  readonly seasons = FASHION_SEASONS;
  all: AffiliateMappingRule[] = [];
  type: AffiliateMappingRuleType = 'CATEGORY';
  query = '';
  loading = false;
  saving = false;
  error = '';
  notice = '';
  editing: AffiliateMappingRule | null = null;
  editingExisting = false;
  aliasesText = '';
  seasonsText = '';

  get filtered(): AffiliateMappingRule[] {
    const q = this.query.trim().toLocaleLowerCase('it');
    return this.all.filter(r => r.type === this.type &&
      (!q || [r.id, r.label, ...r.aliases].some(v => v.toLocaleLowerCase('it').includes(q))))
      .slice(0, 150);
  }
  get totalMatches(): number {
    const q = this.query.trim().toLocaleLowerCase('it');
    return this.all.filter(r => r.type === this.type &&
      (!q || [r.id, r.label, ...r.aliases].some(v => v.toLocaleLowerCase('it').includes(q)))).length;
  }
  ngOnInit(): void { this.refresh(); }
  refresh(): void {
    this.loading = true;
    this.error = '';
    this.api.getMappingRules().pipe(finalize(() => this.loading = false)).subscribe({
      next: rules => this.all = rules,
      error: () => this.error = 'Impossibile caricare i dizionari.',
    });
  }
  edit(rule: AffiliateMappingRule): void {
    this.error = '';
    this.notice = '';
    this.editingExisting = true;
    this.editing = structuredClone(rule);
    this.aliasesText = rule.aliases.join('\n');
    this.seasonsText = Array.isArray(rule.data['seasons']) ? (rule.data['seasons'] as string[]).join(', ') : '';
  }
  add(): void {
    if (!this.auth.isAdmin()) return;
    const data: Record<string, unknown> = this.type === 'CATEGORY'
      ? { category: '', subcategory: '', genders: [] }
      : this.type === 'COLOR' ? { colorId: '' }
      : this.type === 'GENDER' ? { genderTargets: ['U'] }
      : this.type === 'SEASON' ? { category: 'Stagioni dichiarate', seasons: ['SUMMER'], priority: 100, requireAll: [], exclude: [] }
      : { value: '' };
    this.edit({
      id: '', type: this.type, label: '', aliases: [], enabled: true, data, origin: 'CUSTOM',
    });
    this.editingExisting = false;
  }
  importExistingRules(): void {
    if (!this.auth.isAdmin() || this.saving ||
      !confirm('Importare in Firestore le regole attuali? Quelle già presenti non saranno sovrascritte.')) return;
    this.saving = true;
    this.error = '';
    this.api.seedMappingRules().pipe(finalize(() => this.saving = false)).subscribe({
      next: result => {
        this.notice = `Importazione completata: ${result.created} regole create, ${result.existing} già presenti.`;
        this.refresh();
      },
      error: () => this.error = 'Importazione dei dizionari non riuscita.',
    });
  }
  cancel(): void { this.editing = null; }
  save(): void {
    if (!this.auth.isAdmin() || !this.editing || this.saving) return;
    const rule = { ...this.editing };
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(rule.id)) {
      this.error = 'Inserisci un ID valido (lettere, numeri, trattino o underscore).'; return;
    }
    rule.aliases = splitAliases(this.aliasesText);
    if (rule.type === 'SEASON') {
      rule.data = { ...rule.data, seasons: splitAliases(this.seasonsText.toUpperCase()) };
    }
    this.error = '';
    this.saving = true;
    this.api.saveMappingRule(rule).pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.notice = 'Regola salvata.'; this.editing = null; this.refresh(); },
      error: () => this.error = 'Salvataggio non riuscito: verifica le associazioni e riprova.',
    });
  }
  disable(rule: AffiliateMappingRule): void {
    if (!this.auth.isAdmin() || this.saving || !confirm('Disattivare questa regola?')) return;
    this.saving = true;
    this.api.disableMappingRule(rule.id).pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.notice = 'Regola disattivata.'; this.refresh(); },
      error: () => this.error = 'Impossibile disattivare la regola.',
    });
  }
  genderTargetsValue(): string {
    const values = this.editing?.data['genderTargets'];
    return Array.isArray(values) ? values.filter((x): x is string => typeof x === 'string').join(',') : 'U';
  }
  setGenderTargets(value: string): void {
    if (this.editing) this.editing.data = { ...this.editing.data, genderTargets: value.split(',') };
  }
  field(field: string): string {
    const value = this.editing?.data[field];
    return typeof value === 'string' ? value : '';
  }
  updateField(field: string, value: string): void {
    if (this.editing) this.editing.data = { ...this.editing.data, [field]: value };
  }
}

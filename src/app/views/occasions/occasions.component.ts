import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { DataGridComponent } from '../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../core/data-grid/models/data-grid.models';
import { DynamicFormComponent } from '../../core/forms/dynamic-form/dynamic-form.component';
import { FORM_DEFINITION_REPOSITORY } from '../../core/forms/contracts/form-definition-repository';
import { AnagraficaWrapperComponent } from '../../core/layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { OutfitOccasion, TaxonomyService } from '../../services/taxonomy.service';
import { confirm } from '../../widgets/ui-dialogs';
import { OCCASION_CREATE_FORM, OCCASION_EDIT_FORM, OccasionFormDefinitionRepository } from './occasion-form-definition.repository';

const col = (dataField: string, colCaption: string, colWidth: number, type: ColData['type'] = 'campo'): ColData =>
  ({ type, dataField, colCaption, colWidth, colVisible: true, allowEditing: false, edit: false, groupDataField: undefined });
const columns: Colonne[] = [{ itemType: 'group', groupDataField: '', data: [
  col('id', 'Codice', 130), col('value', 'Nome', 180), col('order', 'Ordine', 90, 'campoNumber'), col('activeLabel', 'Stato', 110),
  { ...col('', 'Modifica', 80, 'campoButton'), button: { text: '', name: 'edit', event: 'edit', icon: 'mdi mdi-pencil-outline', hint: 'Modifica' } },
  { ...col('', 'Elimina', 80, 'campoButton'), button: { text: '', name: 'delete', event: 'delete', icon: 'mdi mdi-delete-outline', hint: 'Elimina' } },
] }];
type OccasionRow = OutfitOccasion & { activeLabel: string };

@Component({
  standalone: true, selector: 'app-occasions',
  imports: [CommonModule, DataGridComponent, DynamicFormComponent, AnagraficaWrapperComponent],
  providers: [{ provide: FORM_DEFINITION_REPOSITORY, useClass: OccasionFormDefinitionRepository }],
  templateUrl: './occasions.component.html',
})
export class OccasionsComponent {
  private readonly api = inject(TaxonomyService);
  readonly columns = columns;
  readonly codes = ['EVERYDAY', 'OFFICE', 'APERITIVO', 'CEREMONY', 'EVENING', 'SPORT', 'TRAVEL'];
  rows: OccasionRow[] = [];
  error = '';
  loading = false;
  editorOpen = false;
  formVisible = false;
  editingOriginalId: string | null = null;
  editing: OutfitOccasion = { id: '', value: '', order: 0, active: true };
  get formId(): string { return this.editingOriginalId ? OCCASION_EDIT_FORM : OCCASION_CREATE_FORM; }
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.api.getOccasions().pipe(finalize(() => this.loading = false)).subscribe({
      next: items => this.rows = items.map(item => ({ ...item, activeLabel: item.active ? 'Attiva' : 'Disattiva' })),
      error: () => this.error = 'Impossibile caricare le occasioni.',
    });
  }
  toolbarAction(e: { name?: string; id?: string }): void {
    if ((e?.name || e?.id) === 'addButton') this.edit();
  }
  gridAction(e: { name?: string; rowData?: OccasionRow }): void {
    if (e.rowData && e.name === 'edit') this.edit(e.rowData);
    if (e.rowData && e.name === 'delete') this.remove(e.rowData);
  }
  edit(item?: OutfitOccasion): void {
    this.editingOriginalId = item?.id ?? null;
    this.editing = item ? { ...item } : { id: '', value: '', order: 0, active: true };
    this.error = '';
    this.editorOpen = true;
    this.formVisible = false;
    setTimeout(() => this.formVisible = true);
  }
  close(): void {
    if (this.loading) return;
    this.editorOpen = false;
    this.formVisible = false;
  }
  handleForm(e: { name: string; formData: Record<string, unknown> }): void {
    if (e.name === 'cancelForm') { this.close(); return; }
    if (e.name !== 'submitForm' || this.loading) return;
    const id = this.editingOriginalId ?? String(e.formData['id'] ?? '').trim().toUpperCase();
    const value = String(e.formData['value'] ?? '').trim();
    const order = Number(e.formData['order']);
    const active = e.formData['active'];
    if (!this.codes.includes(id) || !value || !Number.isInteger(order) || order < 0 || typeof active !== 'boolean') {
      this.error = 'Verifica codice, nome, ordine e stato.'; return;
    }
    const payload = { value, order, active };
    const request = this.editingOriginalId ? this.api.updateOccasion(id, payload) : this.api.createOccasion({ id, ...payload });
    this.loading = true;
    request.pipe(finalize(() => this.loading = false)).subscribe({
      next: () => { this.editorOpen = false; this.formVisible = false; this.load(); },
      error: (err) => this.error = err.status === 409 ? 'Occasione già presente.' : 'Salvataggio non riuscito.',
    });
  }
  seed(): void {
    this.loading = true;
    this.api.seedOccasions().pipe(finalize(() => this.loading = false)).subscribe({
      next: () => this.load(),
      error: () => this.error = 'Inizializzazione non riuscita.',
    });
  }
  remove(item: OutfitOccasion): void {
    confirm('Eliminare ' + item.value + '?', 'Conferma', yes => {
      if (!yes) return;
      this.api.deleteOccasion(item.id).subscribe({
        next: () => this.load(),
        error: (e) => this.error = e.status === 409 ? 'Occasione in uso: disattivala.' : 'Eliminazione non riuscita.',
      });
    });
  }
}

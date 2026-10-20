import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { DataGridComponent } from '../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../core/data-grid/models/data-grid.models';
import { DynamicFormComponent } from '../../core/forms/dynamic-form/dynamic-form.component';
import { FORM_DEFINITION_REPOSITORY } from '../../core/forms/contracts/form-definition-repository';
import { AnagraficaWrapperComponent } from '../../core/layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { OutfitOccasion, OutfitOccasionUpdate, OutfitStyleImage, TaxonomyService } from '../../services/taxonomy.service';
import { confirm } from '../../widgets/ui-dialogs';
import { OCCASION_CREATE_FORM, OCCASION_EDIT_FORM, OccasionFormDefinitionRepository } from './occasion-form-definition.repository';

export const MAX_OCCASION_IMAGE_BASE64_LENGTH = 350000;
export function occasionImageDataUrl(image?: OutfitStyleImage | null): string {
  return image ? `data:${image.imageMimeType};base64,${image.imageBase64}` : '';
}
export function buildOccasionUpdate(
  base: Pick<OutfitOccasion, 'value' | 'order' | 'active'>,
  changed: boolean,
  image?: OutfitStyleImage | null
): OutfitOccasionUpdate {
  return { ...base, ...(changed ? { image: image ?? null } : {}) };
}

const col = (dataField: string, colCaption: string, colWidth: number, type: ColData['type'] = 'campo'): ColData =>
  ({ type, dataField, colCaption, colWidth, colVisible: true, allowEditing: false, edit: false, groupDataField: undefined });
const columns: Colonne[] = [{ itemType: 'group', groupDataField: '', data: [
  col('imagePreview', 'Icona', 85, 'campoImg'), col('id', 'Codice', 130), col('value', 'Nome', 180), col('order', 'Ordine', 90, 'campoNumber'), col('activeLabel', 'Stato', 110),
  { ...col('', 'Modifica', 80, 'campoButton'), button: { text: '', name: 'edit', event: 'edit', icon: 'mdi mdi-pencil-outline', hint: 'Modifica' } },
  { ...col('', 'Elimina', 80, 'campoButton'), button: { text: '', name: 'delete', event: 'delete', icon: 'mdi mdi-delete-outline', hint: 'Elimina' } },
] }];
type OccasionRow = OutfitOccasion & { activeLabel: string; imagePreview: string };

@Component({
  standalone: true, selector: 'app-occasions',
  imports: [CommonModule, DataGridComponent, DynamicFormComponent, AnagraficaWrapperComponent],
  providers: [{ provide: FORM_DEFINITION_REPOSITORY, useClass: OccasionFormDefinitionRepository }],
  templateUrl: './occasions.component.html',
  styleUrl: './occasions.component.scss',
})
export class OccasionsComponent {
  private readonly api = inject(TaxonomyService);
  readonly columns = columns;
  rows: OccasionRow[] = [];
  error = '';
  loading = false;
  editorOpen = false;
  formVisible = false;
  editingOriginalId: string | null = null;
  editing: OutfitOccasion = { id: '', value: '', order: 0, active: true };
  imageChanged = false;
  processingImage = false;
  get formId(): string { return this.editingOriginalId ? OCCASION_EDIT_FORM : OCCASION_CREATE_FORM; }
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.api.getOccasions().pipe(finalize(() => this.loading = false)).subscribe({
      next: items => this.rows = items.map(item => ({ ...item, imagePreview: occasionImageDataUrl(item.image), activeLabel: item.active ? 'Attiva' : 'Disattiva' })),
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
    this.imageChanged = false;
    this.editorOpen = true;
    this.formVisible = false;
    setTimeout(() => this.formVisible = true);
  }
  close(): void {
    if (this.loading || this.processingImage) return;
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
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || !value || !Number.isInteger(order) || order < 0 || typeof active !== 'boolean') {
      this.error = 'Verifica codice, nome, ordine e stato.'; return;
    }
    const payload = buildOccasionUpdate({ value, order, active }, this.imageChanged, this.editing.image);
    const request = this.editingOriginalId ? this.api.updateOccasion(id, payload) : this.api.createOccasion({ id, ...payload });
    this.loading = true;
    request.pipe(finalize(() => this.loading = false)).subscribe({
      next: () => { this.editorOpen = false; this.formVisible = false; this.imageChanged = false; this.load(); },
      error: (err) => this.error = err.status === 409 ? 'Occasione già presente.' : 'Salvataggio non riuscito.',
    });
  }
  imageUrl(image?: OutfitStyleImage | null): string { return occasionImageDataUrl(image); }

  async selectImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.processingImage = true;
    this.error = '';
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
        this.error = 'Seleziona una foto JPG, PNG o WebP da massimo 4 MB.';
        return;
      }
      const image = await this.prepareImage(file);
      if (image.imageBase64.length > MAX_OCCASION_IMAGE_BASE64_LENGTH) {
        this.error = 'Immagine troppo grande. Seleziona un file più leggero.';
        return;
      }
      this.editing.image = image;
      this.imageChanged = true;
    } catch {
      this.error = "Impossibile elaborare l'immagine.";
    } finally {
      this.processingImage = false;
      input.value = '';
    }
  }

  removeImage(): void {
    this.editing.image = null;
    this.imageChanged = true;
  }

  private prepareImage(file: File): Promise<OutfitStyleImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const scale = Math.min(512 / image.width, 512 / image.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext('2d');
          if (!context) { reject(new Error('Canvas non disponibile')); return; }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve({
            imageBase64: canvas.toDataURL('image/jpeg', 0.82).split(',')[1],
            imageMimeType: 'image/jpeg',
            imageFileName: `${this.editing.id || 'occasione'}.jpg`,
          });
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
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

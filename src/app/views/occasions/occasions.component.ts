import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { finalize, firstValueFrom } from 'rxjs';
import { DataGridComponent } from '../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../core/data-grid/models/data-grid.models';
import { DynamicFormComponent } from '../../core/forms/dynamic-form/dynamic-form.component';
import { AnagraficaWrapperComponent } from '../../core/layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { OutfitOccasion, OutfitOccasionUpdate, OutfitStyleImage, TaxonomyService } from '../../services/taxonomy.service';
import { FormService, StoredForm } from '../../services/form.service';
import { confirm } from '../../widgets/ui-dialogs';
import { OCCASION_CREATE_FORM, OCCASION_EDIT_FORM, hasOccasionImageFileBox, isOccasionFormReady, missingOccasionFormFields, occasionFormDefinitions } from './occasion-form-definitions';

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
  templateUrl: './occasions.component.html',
  styleUrl: './occasions.component.scss',
})
export class OccasionsComponent {
  @ViewChild(DynamicFormComponent) dynamicForm?: DynamicFormComponent;
  private readonly api = inject(TaxonomyService);
  private readonly forms = inject(FormService);
  readonly columns = columns;
  rows: OccasionRow[] = [];
  error = '';
  loading = false;
  editorOpen = false;
  formVisible = false;
  editingOriginalId: string | null = null;
  editing: OutfitOccasion = { id: '', value: '', order: 0, active: true };
  formEditData: Record<string, unknown> = {};
  imageRemoved = false;
  processingImage = false;
  formsReady = false;
  formsLoading = false;
  formsError = '';
  get formId(): string { return this.editingOriginalId ? OCCASION_EDIT_FORM : OCCASION_CREATE_FORM; }
  ngOnInit(): void { this.load(); void this.checkForms(); }

  async checkForms(): Promise<void> {
    this.formsLoading = true;
    this.formsError = '';
    try {
      this.formsReady = isOccasionFormReady(await firstValueFrom(this.forms.getForms()));
    } catch {
      this.formsReady = false;
      this.formsError = 'Non riesco a leggere la collection forms. Verifica accesso al backoffice.';
    } finally {
      this.formsLoading = false;
    }
  }

  initializeForms(): void {
    if (this.formsLoading) return;
    confirm('Creare i form mancanti e aggiungere il campo immagine ai form esistenti? Gli altri campi non saranno sovrascritti.',
      'Configura form Occasioni', yes => { if (yes) void this.ensureForms(); });
  }

  async ensureForms(): Promise<void> {
    this.formsLoading = true;
    this.formsError = '';
    try {
      const stored = await firstValueFrom(this.forms.getForms());
      for (const template of occasionFormDefinitions) {
        const current = stored.find(form => form.id === template.id);
        if (current && current.json.some(field => field.name === 'image') && !hasOccasionImageFileBox(current)) {
          throw new Error(`Il campo image del form ${template.id} ha un tipo incompatibile. Correggilo nel Form Builder.`);
        }
        if (!current) {
          await this.forms.saveForm('new', { ...template, json: [...template.json] });
        } else {
          const additions = missingOccasionFormFields(current, template);
          if (additions.length) {
            await this.forms.saveForm(current.id, {
              id: current.id, nameForm: current.nameForm, json: [...current.json, ...additions],
            });
          }
        }
      }
      this.formsReady = true;
    } catch (error) {
      this.formsReady = false;
      this.formsError = error instanceof Error ? error.message : 'Impossibile configurare i form Occasioni.';
    } finally {
      this.formsLoading = false;
    }
  }
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
    if (!this.formsReady) {
      this.formsError = 'Configura prima i form nella collection forms.';
      return;
    }
    this.editingOriginalId = item?.id ?? null;
    this.editing = item ? { ...item } : { id: '', value: '', order: 0, active: true };
    this.formEditData = { ...this.editing, image: occasionImageDataUrl(this.editing.image) };
    this.error = '';
    this.imageRemoved = false;
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
    if (e.name !== 'submitForm' || this.loading || this.processingImage) return;
    void this.saveFromForm(e.formData);
  }

  private async saveFromForm(formData: Record<string, unknown>): Promise<void> {
    const id = this.editingOriginalId ?? String(formData['id'] ?? '').trim().toUpperCase();
    const value = String(formData['value'] ?? '').trim();
    const order = Number(formData['order']);
    const active = formData['active'];
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || !value || !Number.isInteger(order) || order < 0 ||
        typeof active !== 'boolean') {
      this.error = 'Verifica codice, nome, ordine e stato.';
      return;
    }

    this.processingImage = true;
    this.error = '';
    try {
      const dataUrl = formData['image'];
      const previousUrl = occasionImageDataUrl(this.editing.image);
      let changed = false;
      let image: OutfitStyleImage | null | undefined;

      if (typeof dataUrl === 'string' && dataUrl && dataUrl !== previousUrl) {
        image = await this.prepareImageDataUrl(dataUrl, id);
        changed = true;
      } else if (this.imageRemoved) {
        image = null;
        changed = true;
      } else if (dataUrl !== undefined && dataUrl !== null && typeof dataUrl !== 'string') {
        throw new Error('Valore immagine non valido.');
      }
      if (image && image.imageBase64.length > MAX_OCCASION_IMAGE_BASE64_LENGTH) {
        throw new Error('Immagine troppo grande. Prova una JPG più leggera.');
      }

      const payload = buildOccasionUpdate({ value, order, active }, changed, image);
      this.loading = true;
      try {
        const request = this.editingOriginalId
          ? this.api.updateOccasion(id, payload)
          : this.api.createOccasion({ id, ...payload });
        await firstValueFrom(request);
        this.editorOpen = false;
        this.formVisible = false;
        this.imageRemoved = false;
        this.load();
      } catch (error: any) {
        this.error = error.status === 409 ? 'Occasione già presente.' : 'Salvataggio non riuscito.';
      } finally {
        this.loading = false;
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Impossibile elaborare l'immagine.";
    } finally {
      this.processingImage = false;
    }
  }

  imageUrl(image?: OutfitStyleImage | null): string { return occasionImageDataUrl(image); }

  removeImage(): void {
    this.imageRemoved = true;
    this.dynamicForm?.form.get('image')?.setValue('');
    if (this.dynamicForm) this.dynamicForm.formValues['image'] = '';
    this.formEditData['image'] = '';
  }

  hasImageSelected(): boolean {
    return !!this.dynamicForm?.form.get('image')?.value;
  }

  /** The standard FileBox emits a data URL; the taxonomy API stores a validated JPEG object. */
  private prepareImageDataUrl(dataUrl: string, id: string): Promise<OutfitStyleImage> {
    if (!/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(dataUrl)) {
      return Promise.reject(new Error('Formato immagine non valido.'));
    }
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error('File immagine non leggibile.'));
      image.onload = () => {
        const scale = Math.min(512 / image.width, 512 / image.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) { reject(new Error('Canvas non disponibile.')); return; }
        context.fillStyle = '#f6f5f3';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({
          imageBase64: canvas.toDataURL('image/jpeg', 0.78).split(',')[1],
          imageMimeType: 'image/jpeg',
          imageFileName: `${id}.jpg`,
        });
      };
      image.src = dataUrl;
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

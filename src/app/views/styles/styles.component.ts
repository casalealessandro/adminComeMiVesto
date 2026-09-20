import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { DataGridComponent } from '../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../core/data-grid/models/data-grid.models';
import { DynamicFormComponent } from '../../core/forms/dynamic-form/dynamic-form.component';
import { AnagraficaWrapperComponent } from '../../core/layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { OutfitStyle, OutfitStyleImage, OutfitStyleImages, OutfitStyleUpdate, TaxonomyService } from '../../services/taxonomy.service';
import { alert, confirm } from '../../widgets/ui-dialogs';

export type StyleGender = 'U' | 'D';
export const MAX_IMAGE_BASE64_LENGTH = 350000;
export const OUTFIT_STYLE_FORM = 'outfit-style-form';
export function isStyleIdReadonly(editingOriginalId: string | null): boolean { return editingOriginalId !== null; }
export function styleImageDataUrl(image?: OutfitStyleImage | null): string | null { return image ? `data:${image.imageMimeType};base64,${image.imageBase64}` : null; }
export function isStyleValid(style: OutfitStyle): boolean { return !!style.id.trim() && !!style.value.trim() && style.gender.length > 0; }
export function buildStyleUpdate(style: OutfitStyle, changed: Record<StyleGender, boolean>): OutfitStyleUpdate {
  const payload: OutfitStyleUpdate = { value: style.value, parent: null, order: style.order, gender: [...style.gender] };
  const images: OutfitStyleImages = {};
  if (changed.U) images.U = style.images?.U ?? null;
  if (changed.D) images.D = style.images?.D ?? null;
  if (changed.U || changed.D) payload.images = images;
  return payload;
}

const column = (dataField: string, colCaption: string, colWidth: number | string, type: ColData['type'] = 'campo'): ColData => ({
  type, dataField, colCaption, colWidth, colVisible: true, allowEditing: false, edit: false, groupDataField: undefined,
});

export function buildStyleColumns(): Colonne[] {
  return [{ itemType: 'group', groupDataField: '', data: [
    column('imageU', 'Uomo', 74, 'campoImg'), column('imageD', 'Donna', 74, 'campoImg'),
    column('value', 'Nome', 180), column('id', 'Codice', 90), column('order', 'Ordine', 80, 'campoNumber'), column('genderLabel', 'Gender', 120),
    { ...column('', 'Modifica', 70, 'campoButton'), button: { text: '', name: 'edit', event: 'edit', icon: 'mdi mdi-pencil-outline', hint: 'Modifica stile' } },
    { ...column('', 'Elimina', 70, 'campoButton'), button: { text: '', name: 'delete', event: 'delete', icon: 'mdi mdi-delete-outline', hint: 'Elimina stile' } },
  ] }];
}

export interface StyleGridRow extends OutfitStyle { imageU: string; imageD: string; genderLabel: string; }

@Component({
  standalone: true,
  selector: 'app-styles',
  imports: [CommonModule, DynamicFormComponent, DataGridComponent, AnagraficaWrapperComponent],
  templateUrl: './styles.component.html',
  styleUrl: './styles.component.scss',
})
export class StylesComponent {
  @ViewChild(DynamicFormComponent) dynamicForm?: DynamicFormComponent;

  private readonly api = inject(TaxonomyService);

  readonly formId = OUTFIT_STYLE_FORM;
  readonly genders: StyleGender[] = ['U', 'D'];
  readonly columns = buildStyleColumns();

  styles: OutfitStyle[] = [];
  gridRows: StyleGridRow[] = [];
  editing: OutfitStyle = this.emptyStyle();
  editingOriginalId: string | null = null;
  imageChanged: Record<StyleGender, boolean> = { U: false, D: false };
  editorOpen = false;
  formVisible = false;
  loading = false;
  processingImage: StyleGender | null = null;
  error = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getStyles().pipe(finalize(() => this.loading = false)).subscribe({
      next: styles => {
        this.styles = [...styles].sort((a, b) => a.order - b.order);
        this.updateGrid();
      },
      error: () => { this.error = 'Impossibile caricare gli stili.'; },
    });
  }

  toolbarAction(event: { name?: string; id?: string }): void {
    const name = event?.name || event?.id;
    if (name === 'addButton') this.edit();
  }

  edit(style?: OutfitStyle): void {
    this.editingOriginalId = style?.id ?? null;
    this.editing = style
      ? { ...style, gender: [...style.gender], images: { ...style.images } }
      : this.emptyStyle();
    this.imageChanged = { U: false, D: false };
    this.error = '';
    this.editorOpen = true;
    this.recreateForm();
  }

  closeEditor(): void {
    if (this.loading || this.processingImage !== null) return;
    this.editorOpen = false;
    this.formVisible = false;
    this.editingOriginalId = null;
    this.editing = this.emptyStyle();
    this.imageChanged = { U: false, D: false };
  }

  handleForm(event: { name: string; formData: Record<string, unknown> }): void {
    if (event.name === 'cancelForm') {
      this.closeEditor();
      return;
    }
    if (event.name !== 'submitForm') return;

    const gender = Array.isArray(event.formData['gender'])
      ? event.formData['gender'].filter(value => value === 'U' || value === 'D') as StyleGender[]
      : [];

    this.editing = {
      ...this.editing,
      id: this.editingOriginalId ?? String(event.formData['id'] ?? '').trim(),
      value: String(event.formData['value'] ?? '').trim(),
      order: Number(event.formData['order']),
      gender,
      parent: null,
    };
    this.save();
  }

  gridAction(event: { name?: string; rowData?: StyleGridRow }): void {
    if (!event?.rowData) return;
    if (event.name === 'edit') this.edit(event.rowData);
    if (event.name === 'delete') this.remove(event.rowData);
  }

  imageUrl(image?: OutfitStyleImage | null): string | null { return styleImageDataUrl(image); }

  async selectImage(event: Event, gender: StyleGender): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.processingImage = gender;
    this.error = '';
    try {
      const image = await this.prepareImage(file, gender);
      if (image.imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
        this.error = "L'immagine è ancora troppo grande. Seleziona un'immagine più leggera.";
        return;
      }
      this.editing.images = { ...this.editing.images, [gender]: image };
      this.imageChanged[gender] = true;
    } catch {
      this.error = 'Impossibile elaborare l’immagine selezionata.';
    } finally {
      this.processingImage = null;
      input.value = '';
    }
  }

  removeImage(gender: StyleGender): void {
    this.editing.images = { ...this.editing.images, [gender]: null };
    this.imageChanged[gender] = true;
  }

  remove(style: OutfitStyle): void {
    confirm(`Eliminare lo stile ${style.value}?`, 'Conferma', yes => yes && this.api.deleteStyle(style.id).subscribe({
      next: () => {
        this.styles = this.styles.filter(item => item.id !== style.id);
        this.updateGrid();
      },
      error: error => {
        this.error = error.status === 409
          ? 'Lo stile è utilizzato e non può essere eliminato.'
          : 'Eliminazione non riuscita.';
      },
    }));
  }

  private save(): void {
    if (!isStyleValid(this.editing)) {
      this.error = 'Compila codice e nome e seleziona almeno un gender.';
      return;
    }
    if (this.genders.some(gender => (this.editing.images?.[gender]?.imageBase64.length ?? 0) > MAX_IMAGE_BASE64_LENGTH)) {
      this.error = "L'immagine è ancora troppo grande. Seleziona un'immagine più leggera.";
      return;
    }

    this.loading = true;
    this.error = '';

    const request = this.editingOriginalId
      ? this.api.updateStyle(this.editingOriginalId, buildStyleUpdate(this.editing, this.imageChanged))
      : this.api.createStyle(this.createPayload());

    request.pipe(finalize(() => this.loading = false)).subscribe({
      next: () => {
        alert('Stile salvato.', 'Operazione completata');
        this.editorOpen = false;
        this.formVisible = false;
        this.editingOriginalId = null;
        this.editing = this.emptyStyle();
        this.imageChanged = { U: false, D: false };
        this.load();
      },
      error: error => {
        this.error = error.status === 400
          ? 'Dati non validi.'
          : error.status === 409
            ? 'Lo stile è utilizzato o è in conflitto.'
            : 'Salvataggio non riuscito.';
      },
    });
  }

  private recreateForm(): void {
    this.formVisible = false;
    setTimeout(() => {
      this.formVisible = true;
      if (isStyleIdReadonly(this.editingOriginalId)) this.disableEditingId();
    });
  }

  private disableEditingId(attempt = 0): void {
    const idControl = this.dynamicForm?.form.get('id');
    if (idControl) {
      idControl.disable();
      return;
    }
    if (attempt < 20) setTimeout(() => this.disableEditingId(attempt + 1), 50);
  }

  private updateGrid(): void {
    this.gridRows = this.styles.map(style => ({
      ...style,
      imageU: this.imageUrl(style.images?.U) ?? '',
      imageD: this.imageUrl(style.images?.D) ?? '',
      genderLabel: style.gender.map(item => item === 'U' ? 'Uomo' : 'Donna').join(', '),
    }));
  }

  private emptyStyle(): OutfitStyle {
    return { id: '', value: '', parent: null, order: 0, gender: [] };
  }

  private createPayload(): OutfitStyle {
    const images: OutfitStyleImages = {};
    if (this.editing.images?.U) images.U = this.editing.images.U;
    if (this.editing.images?.D) images.D = this.editing.images.D;
    return { ...this.editing, ...(Object.keys(images).length ? { images } : { images: undefined }) };
  }

  private prepareImage(file: File, gender: StyleGender): Promise<OutfitStyleImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const source = new Image();
        source.onerror = reject;
        source.onload = () => {
          const scale = Math.min(600 / source.width, 750 / source.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(source.width * scale));
          canvas.height = Math.max(1, Math.round(source.height * scale));
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Canvas non disponibile'));
            return;
          }
          context.drawImage(source, 0, 0, canvas.width, canvas.height);
          resolve({
            imageBase64: canvas.toDataURL('image/jpeg', .8).split(',')[1],
            imageMimeType: 'image/jpeg',
            imageFileName: `${this.editing.id.trim() || 'style'}-${gender}.jpg`,
          });
        };
        source.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
}

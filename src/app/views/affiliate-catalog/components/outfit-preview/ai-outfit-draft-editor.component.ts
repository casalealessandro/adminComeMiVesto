import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PopUpService } from '../../../../core/popup/popup.service';
import { OutfitReplacementPickerResult } from './outfit-replacement-picker.component';
import {
  AiOutfitDraft,
  AiOutfitDraftEditRequest,
  AiOutfitPreviewOccasion,
  AiOutfitPreviewOutfit,
} from '../../models/affiliate-catalog-api.models';
import { CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

@Component({
  selector: 'app-ai-outfit-draft-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-outfit-draft-editor.component.html',
  styleUrls: ['./ai-outfit-draft-editor.component.scss'],
})
export class AiOutfitDraftEditorComponent {
  private readonly catalogService = inject(AffiliateCatalogService);
  private readonly popupService = inject(PopUpService);

  @Input({ required: true }) outfit!: AiOutfitPreviewOutfit;
  @Input() draft?: AiOutfitDraft;
  @Input() occasion: AiOutfitPreviewOccasion = 'EVERYDAY';
  @Input() styleOptions: Array<{ value: string; label: string }> = [];
  @Input() occasionOptions: Array<{ value: AiOutfitPreviewOccasion; label: string }> = [];
  @Output() draftUpdated = new EventEmitter<AiOutfitDraft>();
  @Output() editingChange = new EventEmitter<boolean>();

  readonly seasons: Array<{ value: 'P' | 'E' | 'A' | 'I'; label: string }> = [
    { value: 'P', label: 'Primavera' }, { value: 'E', label: 'Estate' },
    { value: 'A', label: 'Autunno' }, { value: 'I', label: 'Inverno' },
  ];

  editing = false;
  saving = false;
  regenerating = false;
  error = '';
  regenerationError = '';
  form: AiOutfitDraftEditRequest | null = null;
  replacementIndex: number | null = null;
  readonly selectedReplacements = new Map<number, CatalogProduct>();
  additionalCategory: 'cappotti' | 'ABC_Completi' | 'B_Blazer' = 'cappotti';
  pendingOuterwear?: CatalogProduct;
  addingOuterwear = false;

  get canAddOuterwear(): boolean {
    return !!this.form && this.form.products.length < 8 &&
      !this.form.products.some(item => item.role === 'OUTERWEAR');
  }

  /** One additional jacket at a time; existing picker retains paging and filters. */
  addOuterwear(): void {
    if (!this.canAddOuterwear || this.saving || this.addingOuterwear || this.replacementIndex !== null) return;
    const edit = this.form!;
    const guid = `outfit-add-outerwear-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.addingOuterwear = true;
    this.popupService.setNewPopUp(
      guid, 'OutfitReplacementPickerComponent', {
        category: this.additionalCategory, gender: edit.gender,
        productIdsInOutfit: edit.products.map(p => p.catalogProductId),
      }, 1180, undefined, undefined, false, true, 'Aggiungi capospalla', 'center', true,
    );
    void this.popupService.getOutputComponent(guid).then((result: OutfitReplacementPickerResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      const product = result?.name === 'selected' ? result.product : undefined;
      if (!product || !this.canAddOuterwear || product.category !== this.additionalCategory ||
          !product.genderTargets.includes(edit.gender)) return;
      const valid = product.category === 'cappotti' ||
        (product.category === 'ABC_Completi' && product.subcategory === 'blazer') ||
        (product.category === 'B_Blazer' && ['Gilet','CompletiEleganti'].includes(product.subcategory ?? ''));
      if (!valid) { this.error = 'Seleziona una giacca o un capospalla valido.'; return; }
      edit.products.push({ catalogProductId: product.id, role: 'OUTERWEAR', x: .48, y: .3 });
      this.pendingOuterwear = product;
      this.error = '';
    }).finally(() => { this.addingOuterwear = false; });
  }


  startEditing(): void {
    if (!this.outfit.draftId || this.saving || this.regenerating) return;
    this.form = {
      expectedRevision: this.draft?.revision ?? 0,
      title: this.outfit.title,
      description: this.outfit.description,
      gender: this.outfit.gender,
      season: this.outfit.season,
      style: this.outfit.style,
      occasion: this.draft?.request.occasion ?? this.occasion,
      products: this.outfit.products.map((product) => ({
        catalogProductId: product.catalogProductId,
        role: product.role,
        ...(Number.isFinite(product.x) && Number.isFinite(product.y)
          ? { x: product.x, y: product.y } : {}),
      })),
    };
    this.error = '';
    this.replacementIndex = null;
    this.selectedReplacements.clear();
    this.pendingOuterwear = undefined;
    this.editing = true;
    this.editingChange.emit(true);
  }

  cancel(): void {
    if (this.saving) return;
    this.editing = false;
    this.form = null;
    this.replacementIndex = null;
    this.selectedReplacements.clear();
    this.pendingOuterwear = undefined;
    this.editingChange.emit(false);
  }

  showReplacements(index: number): void {
    if (!this.form || this.saving || this.replacementIndex !== null) return;
    const original = this.outfit.products[index];
    if (!original?.category) {
      this.error = 'Il capo da sostituire non ha una categoria valida.';
      return;
    }
    this.replacementIndex = index;
    this.error = '';
    const guid = `outfit-product-picker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.popupService.setNewPopUp(
      guid, 'OutfitReplacementPickerComponent', {
        category: original.category,
        gender: this.form.gender,
        productIdsInOutfit: this.form.products.map(product => product.catalogProductId),
      },
      1180, undefined, undefined, false, true, 'Sostituisci prodotto', 'center', true,
    );
    void this.popupService.getOutputComponent(guid).then((result: OutfitReplacementPickerResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      if (result?.name === 'selected' && result.product && this.form) {
        this.chooseReplacement(result.product);
      } else {
        this.replacementIndex = null;
      }
    });
  }

  chooseReplacement(product: CatalogProduct): void {
    if (!this.form || this.replacementIndex === null) return;
    this.form.products[this.replacementIndex] = {
      ...this.form.products[this.replacementIndex],
      catalogProductId: product.id,
    };
    this.selectedReplacements.set(this.replacementIndex, product);
    this.replacementIndex = null;
    this.error = '';
  }

  replacementLabel(index: number): string {
    if (!this.form) return '';
    if (index >= this.outfit.products.length && this.pendingOuterwear) {
      return `${this.pendingOuterwear.brand} · ${this.pendingOuterwear.name}`;
    }
    const newId = this.form.products[index]?.catalogProductId;
    const replacement = this.selectedReplacements.get(index);
    return newId === replacement?.id
      ? `${replacement.brand} · ${replacement.name}`
      : newId === this.outfit.products[index]?.catalogProductId
        ? this.outfit.products[index].name
        : `Nuovo prodotto selezionato (${newId})`;
  }

  save(): void {
    const draftId = this.outfit.draftId;
    if (!draftId || !this.form || this.saving) return;
    if (!this.form.title.trim()) {
      this.error = 'Il titolo è obbligatorio.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.catalogService.updateOutfitDraft(draftId, this.form)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (updated) => {
          this.saving = false;
          this.draftUpdated.emit(updated);
          this.cancel();
        },
        error: (error) => {
          this.error = error?.status === 409
            ? 'La bozza o il catalogo sono cambiati. Aggiorna le bozze e riprova.'
            : (error?.error?.message || 'Impossibile salvare la modifica.');
        },
      });
  }

  regenerateImage(): void {
    const id = this.outfit.draftId;
    if (!id || this.editing || this.regenerating || this.draft?.imageRegenerating) return;
    if (typeof window !== 'undefined' && !window.confirm(
      'Rigenerare solo l’immagine di questo look? L’operazione usa il modello AI e può avere un costo.',
    )) return;
    this.regenerating = true;
    this.regenerationError = '';
    this.catalogService.regenerateOutfitDraftImage(id, this.draft?.revision ?? 0)
      .pipe(finalize(() => this.regenerating = false))
      .subscribe({
        next: (updated) => this.draftUpdated.emit(updated),
        error: (error) => {
          this.regenerationError = error?.status === 409
            ? 'La bozza è cambiata. Ricarica i dati prima di rigenerare.'
            : (error?.error?.message || 'Rigenerazione immagine non riuscita.');
        },
      });
  }
}

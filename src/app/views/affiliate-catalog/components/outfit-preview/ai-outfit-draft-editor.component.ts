import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
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

  @Input({ required: true }) outfit!: AiOutfitPreviewOutfit;
  @Input() draft?: AiOutfitDraft;
  @Input() occasion: AiOutfitPreviewOccasion = 'EVERYDAY';
  @Input() styleOptions: Array<{ value: string; label: string }> = [];
  @Output() draftUpdated = new EventEmitter<AiOutfitDraft>();
  @Output() editingChange = new EventEmitter<boolean>();

  readonly seasons: Array<{ value: 'P' | 'E' | 'A' | 'I'; label: string }> = [
    { value: 'P', label: 'Primavera' }, { value: 'E', label: 'Estate' },
    { value: 'A', label: 'Autunno' }, { value: 'I', label: 'Inverno' },
  ];
  readonly occasions: Array<{ value: AiOutfitPreviewOccasion; label: string }> = [
    { value: 'EVERYDAY', label: 'Quotidiano' }, { value: 'OFFICE', label: 'Ufficio' },
    { value: 'APERITIVO', label: 'Aperitivo' }, { value: 'CEREMONY', label: 'Cerimonia' },
    { value: 'EVENING', label: 'Sera' }, { value: 'SPORT', label: 'Sport' },
    { value: 'TRAVEL', label: 'Viaggio' },
  ];
  editing = false;
  saving = false;
  regenerating = false;
  error = '';
  regenerationError = '';
  form: AiOutfitDraftEditRequest | null = null;
  replacementIndex: number | null = null;
  replacementQuery = '';
  replacements: CatalogProduct[] = [];
  selectedReplacement: CatalogProduct | null = null;
  searching = false;

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
    this.replacements = [];
    this.selectedReplacement = null;
    this.editing = true;
    this.editingChange.emit(true);
  }

  cancel(): void {
    if (this.saving) return;
    this.editing = false;
    this.form = null;
    this.replacementIndex = null;
    this.replacements = [];
    this.editingChange.emit(false);
  }

  showReplacements(index: number): void {
    this.replacementIndex = index;
    this.replacementQuery = '';
    this.replacements = [];
    this.selectedReplacement = null;
    this.error = '';
  }

  findReplacements(): void {
    const query = this.replacementQuery.trim();
    if (!query || this.replacementIndex === null || !this.form || this.searching) return;
    this.searching = true;
    this.replacements = [];
    const original = this.outfit.products[this.replacementIndex];
    this.catalogService.getProducts({ q: query, limit: 30, visibleInApp: true })
      .pipe(finalize(() => this.searching = false))
      .subscribe({
        next: (page) => {
          this.replacements = page.data.filter((product) =>
            product.active === true
            && product.enabledForApp !== false
            && product.category === original.category
            && product.genderTargets.includes(this.form!.gender)
            && !this.form!.products.some((used) => used.catalogProductId === product.id));
          this.error = this.replacements.length ? '' : 'Nessun prodotto compatibile nei primi risultati. Prova una ricerca più specifica.';
        },
        error: () => this.error = 'Impossibile cercare i prodotti nel catalogo.',
      });
  }

  chooseReplacement(product: CatalogProduct): void {
    if (!this.form || this.replacementIndex === null) return;
    this.form.products[this.replacementIndex] = {
      ...this.form.products[this.replacementIndex],
      catalogProductId: product.id,
    };
    this.selectedReplacement = product;
    this.replacementIndex = null;
    this.replacements = [];
    this.error = '';
  }

  replacementLabel(index: number): string {
    if (!this.form) return '';
    const newId = this.form.products[index]?.catalogProductId;
    return newId === this.selectedReplacement?.id
      ? `${this.selectedReplacement.brand} · ${this.selectedReplacement.name}`
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

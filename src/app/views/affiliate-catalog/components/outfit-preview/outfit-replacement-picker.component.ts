import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ColData, Colonne, DataGridComponent, GridDataProvider, GridLoadRequest } from '../../../../core/public-api';
import { CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

/** Data passed through the existing Core PopUpService registry. */
export interface OutfitReplacementPickerContext {
  category: string;
  gender: 'U' | 'D';
  productIdsInOutfit: string[];
}

export interface OutfitReplacementPickerResult {
  name: 'selected' | 'cancelled';
  product?: CatalogProduct;
}

export interface OutfitReplacementRow extends CatalogProduct {
  genderLabel: string;
  styleLabel: string;
  colorLabel: string;
}

export const PICKER_STYLE_OPTIONS = [
  { value: 'CASUAL', label: 'Casual' }, { value: 'BUSINESS', label: 'Business' },
  { value: 'SPORTY', label: 'Sportivo' }, { value: 'SMART_CASUAL', label: 'Smart Casual' },
  { value: 'ELEGANT', label: 'Elegante' }, { value: 'ALTERNATIVE', label: 'Alternativo' },
  { value: 'FESTIVAL', label: 'Festival' }, { value: 'CLASSIC', label: 'Classico' },
  { value: 'TRENDY', label: 'Trendy' }, { value: 'STREETWEAR', label: 'Streetwear' },
] as const;

const column = (dataField: string, caption: string, width: number): ColData => ({
  type: 'campo', colVisible: true, allowEditing: false, allowFiltering: false,
  dataField, colWidth: width, colCaption: caption, edit: false, groupDataField: undefined,
});

export const replacementPickerColumns: Colonne[] = [{
  itemType: 'group', groupDataField: '', data: [
    column('name', 'Nome', 300),
    column('genderLabel', 'Genere', 90),
    column('styleLabel', 'Stile', 180),
    column('category', 'Categoria', 150),
    column('subcategory', 'Sottocategoria', 160),
    column('colorLabel', 'Colore', 125),
  ],
}];

@Component({
  selector: 'app-outfit-replacement-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  template: `
    <section class="outfit-product-picker" aria-label="Seleziona un prodotto sostitutivo">
      <p class="small text-muted">Categoria: <strong>{{ itemData.category }}</strong> ·
        Genere: <strong>{{ itemData.gender === 'D' ? 'Donna' : 'Uomo' }}</strong>.
        I prodotti devono essere attivi e visibili nell'app.</p>
      <div class="picker-filters">
        <label>Sottocategoria
          <select [(ngModel)]="subcategory" (ngModelChange)="refresh()" [disabled]="loading">
            <option value="">Tutte</option>
            <option *ngFor="let value of subcategories" [value]="value">{{ value }}</option>
          </select>
        </label>
        <label>Stile
          <select [(ngModel)]="style" (ngModelChange)="refresh()" [disabled]="loading">
            <option value="">Tutti</option>
            <option *ngFor="let option of styles" [value]="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>Colore
          <select [(ngModel)]="color" (ngModelChange)="refresh()" [disabled]="loading">
            <option value="">Tutti</option>
            <option *ngFor="let option of colors" [value]="option.id">{{ option.value }}</option>
          </select>
        </label>
      </div>
      <p *ngIf="loading" role="status">Caricamento filtri…</p>
      <p *ngIf="error" class="text-danger" role="alert">{{ error }}</p>
      <app-data-grid *ngIf="!loading && provider"
        #grid
        [idTable]="'outfit-replacement-picker-grid'"
        [colonne]="columns"
        [dataProvider]="provider"
        [remoteOperation]="true"
        [selectionRowMode]="'single'"
        [isEditable]="false"
        [isEditableNewRow]="false"
        [isEditableEditRow]="false"
        [isEditableDeleteRow]="false"
        [showToolbarTop]="true"
        [showToolbarBottom]="false"
        [showFilter]="false"
        [isSearchable]="true"
        [tableHeight]="480"
        (emittendSelectionRow)="selectRow($event)">
      </app-data-grid>
      <p class="small text-muted">Cerca nel catalogo tramite la barra della griglia, applica i filtri e clicca una riga per scegliere il nuovo prodotto. La sostituzione viene salvata soltanto quando confermi la bozza.</p>
      <button type="button" class="btn btn-outline-secondary" (click)="result.emit({ name: 'cancelled' })">Annulla</button>
    </section>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .outfit-product-picker { display: grid; gap: .75rem; padding: .6rem; min-width: 0; }
    .outfit-product-picker p { margin: 0; }
    .picker-filters { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .7rem; }
    .picker-filters label { display: grid; gap: .2rem; font-size: .85rem; font-weight: 600; }
    .picker-filters select { width: 100%; padding: .5rem; border: 1px solid var(--bs-border-color,#ced4da); border-radius: .4rem; background: var(--bs-body-bg,#fff); color: var(--bs-body-color,#212529); }
    .outfit-product-picker > button { justify-self: start; }
    @media(max-width: 660px) { .picker-filters { grid-template-columns: 1fr; } }
  `],
})
export class OutfitReplacementPickerComponent implements OnInit {
  private readonly catalog = inject(AffiliateCatalogService);
  itemData: OutfitReplacementPickerContext = { category: '', gender: 'D', productIdsInOutfit: [] };
  @Output() result = new EventEmitter<OutfitReplacementPickerResult>();
  grid?: DataGridComponent<OutfitReplacementRow>;
  @ViewChild(DataGridComponent)
  set pickerGrid(grid: DataGridComponent<OutfitReplacementRow> | undefined) {
    this.grid = grid;
    if (grid && this.provider) {
      grid.pageSize = 30;
      queueMicrotask(() => void grid.renderGrid());
    }
  }

  readonly columns = replacementPickerColumns;
  readonly styles = PICKER_STYLE_OPTIONS;
  subcategory = '';
  style = '';
  color = '';
  subcategories: string[] = [];
  colors: Array<{ id: string; value: string }> = [];
  provider?: GridDataProvider<OutfitReplacementRow>;
  loading = true;
  error = '';
  private colorLabels = new Map<string, string>();

  ngOnInit(): void {
    if (!this.itemData.category || !['D', 'U'].includes(this.itemData.gender)) {
      this.error = 'Categoria o genere del capo originale non validi.';
      this.loading = false;
      return;
    }
    forkJoin({
      subcategories: this.catalog.getProductSubcategories(),
      colors: this.catalog.getOutfitColors(),
    }).subscribe({
      next: ({ subcategories, colors }) => {
        this.subcategories = subcategories.filter(Boolean).sort((a, b) => a.localeCompare(b));
        this.colors = colors.filter(item => item.id && item.value).sort((a, b) => a.value.localeCompare(b.value));
        this.colorLabels = new Map(this.colors.map(item => [item.id, item.value]));
        this.provider = { load: (request) => this.loadPage(request) };
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = 'Impossibile caricare i filtri del catalogo.'; },
    });
  }

  refresh(): void {
    if (this.provider && this.grid) void this.grid.refresh();
  }

  async loadPage(request: GridLoadRequest): Promise<{ items: OutfitReplacementRow[]; continuation?: string; hasMore: boolean }> {
    const query = request.search?.value?.trim();
    const page = await firstValueFrom(this.catalog.getProducts({
      limit: request.pageSize,
      ...(typeof request.continuation === 'string' ? { cursor: request.continuation } : {}),
      ...(query ? { q: query } : {}),
      category: this.itemData.category,
      gender: this.itemData.gender,
      visibleInApp: true,
      activeOnly: true,
      ...(this.subcategory ? { subcategory: this.subcategory } : {}),
      ...(this.style ? { style: this.style } : {}),
      ...(this.color ? { color: this.color } : {}),
    }));
    const used = new Set(this.itemData.productIdsInOutfit);
    const items = page.data
      .filter(product => !used.has(product.id))
      .map(product => ({
        ...product,
        genderLabel: product.genderTargets.map(code => code === 'D' ? 'Donna' : code === 'U' ? 'Uomo' : code).join(', '),
        styleLabel: product.fashionProfile?.styleAffinities?.map(code =>
          this.styles.find(option => option.value === code)?.label ?? code).join(', ') || '—',
        colorLabel: this.colorLabels.get(product.normalizedColor) ?? product.normalizedColor ?? '—',
      }));
    return { items, hasMore: page.pagination.hasMore, continuation: page.pagination.nextCursor ?? undefined };
  }

  selectRow(event: { name?: string; data?: OutfitReplacementRow }): void {
    if (event.name !== 'onRowSelectionChange' || !event.data) return;
    const product = event.data;
    const valid = product.active === true && product.enabledForApp !== false &&
      product.category === this.itemData.category &&
      product.genderTargets.includes(this.itemData.gender) &&
      !this.itemData.productIdsInOutfit.includes(product.id);
    if (!valid) {
      this.error = 'Questo prodotto non è disponibile o non è compatibile con il capo da sostituire.';
      return;
    }
    this.result.emit({ name: 'selected', product });
  }
}

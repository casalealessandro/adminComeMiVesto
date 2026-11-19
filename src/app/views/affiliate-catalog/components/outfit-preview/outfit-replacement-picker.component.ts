import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild, inject } from '@angular/core';
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
  imagePreview: string;
}

export const PICKER_STYLE_OPTIONS = [
  { value: 'CASUAL', label: 'Casual' }, { value: 'BUSINESS', label: 'Business' },
  { value: 'SPORTY', label: 'Sportivo' }, { value: 'SMART_CASUAL', label: 'Smart Casual' },
  { value: 'ELEGANT', label: 'Elegante' }, { value: 'ALTERNATIVE', label: 'Alternativo' },
  { value: 'FESTIVAL', label: 'Festival' }, { value: 'CLASSIC', label: 'Classico' },
  { value: 'TRENDY', label: 'Trendy' }, { value: 'STREETWEAR', label: 'Streetwear' },
] as const;

const column = (dataField: string, caption: string, width: number, type: ColData['type'] = 'campo'): ColData => ({
  type, colVisible: true, allowEditing: false, allowFiltering: false,
  dataField, colWidth: width, colCaption: caption, edit: false, groupDataField: undefined,
});

const listOptions = (options: Array<{ value: string; label: string }>): NonNullable<ColData['lista']> => ({
  options, valueExp: 'value', displayExp: 'label', multiple: false, remote: false, parent: null,
});

/** All filtering controls belong to DataGrid Core. The provider translates their
 * normalized filter fields to the existing paged products API.
 */
export const buildReplacementPickerColumns = (
  subcategories: readonly string[],
  colors: ReadonlyArray<{ id: string; value: string }>,
): Colonne[] => [{
  itemType: 'group', groupDataField: '', data: [
    { ...column('imagePreview', 'Immagine', 84, 'campoImg'), search: false },
    { ...column('name', 'Nome', 270), allowFiltering: true },
    {
      ...column('styleLabel', 'Stile', 170, 'campoLista'),
      allowFiltering: true,
      lista: listOptions(PICKER_STYLE_OPTIONS.map(option => ({ ...option }))),
    },
    {
      ...column('subcategory', 'Sottocategoria', 175, 'campoLista'),
      allowFiltering: true,
      lista: listOptions(subcategories.map(value => ({ value, label: value }))),
    },
    {
      ...column('normalizedColor', 'Colore', 135, 'campoLista'),
      allowFiltering: true,
      lista: listOptions(colors.map(color => ({ value: color.id, label: color.value }))),
    },
  ],
}];

@Component({
  selector: 'app-outfit-replacement-picker',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="outfit-product-picker" aria-label="Seleziona un prodotto sostitutivo">
      <p class="small text-muted">Categoria: <strong>{{ itemData.category }}</strong> ·
        Genere: <strong>{{ itemData.gender === 'D' ? 'Donna' : 'Uomo' }}</strong>.
        I prodotti devono essere attivi e visibili nell'app.</p>
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
        [showFilter]="true"
        [isSearchable]="false"
        [tableHeight]="480"
        (emittendSelectionRow)="selectRow($event)">
      </app-data-grid>
      <div *ngIf="grid as list" class="outfit-product-picker__paging" aria-live="polite">
        <span>{{ list.rowsData().length }} prodotti caricati</span>
        <button *ngIf="list.remoteHasMore" type="button" class="btn btn-sm btn-outline-primary"
          [disabled]="list.isLoading" (click)="loadMore()">
          {{ list.isLoading ? 'Caricamento...' : 'Carica altri prodotti' }}
        </button>
        <span *ngIf="!list.remoteHasMore && list.rowsData().length">Fine risultati</span>
      </div>
      <p class="small text-muted">Usa il filtro Nome e i menu nelle intestazioni della griglia per cercare nel catalogo. Clicca una riga per scegliere il nuovo prodotto. La sostituzione viene salvata soltanto quando confermi le modifiche.</p>
      <button type="button" class="btn btn-outline-secondary" (click)="result.emit({ name: 'cancelled' })">Annulla</button>
    </section>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .outfit-product-picker { display: grid; gap: .75rem; padding: .6rem; min-width: 0; }
    .outfit-product-picker p { margin: 0; }
    .outfit-product-picker > button { justify-self: start; }
    .outfit-product-picker__paging {
      display: flex; flex-wrap: wrap; align-items: center;
      justify-content: space-between; gap: .5rem;
      font-size: .8rem; color: var(--bs-secondary-color, #6c757d);
    }
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

  columns: Colonne[] = [];
  readonly styles = PICKER_STYLE_OPTIONS;
  provider?: GridDataProvider<OutfitReplacementRow>;
  loading = true;
  error = '';

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
        const validSubcategories = [...new Set(subcategories.filter(Boolean))]
          .sort((a, b) => a.localeCompare(b));
        const validColors = colors.filter(item => item.id && item.value)
          .sort((a, b) => a.value.localeCompare(b.value));
        this.columns = buildReplacementPickerColumns(validSubcategories, validColors);
        this.provider = { load: (request) => this.loadPage(request) };
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = 'Impossibile caricare i filtri del catalogo.'; },
    });
  }

  /** Explicit pagination also works when excluded in-use products leave a partial page. */
  async loadMore(): Promise<void> {
    const grid = this.grid;
    if (!grid || !grid.remoteHasMore || grid.isLoading) return;
    this.error = '';
    const loaded = await grid.loadNextRemotePage();
    if (!loaded) this.error = 'Impossibile caricare altri prodotti. Riprova.';
  }

  async loadPage(request: GridLoadRequest): Promise<{ items: OutfitReplacementRow[]; continuation?: string; hasMore: boolean }> {
    if (request.sort?.length) {
      throw new Error('L ordinamento remoto non è disponibile per il catalogo prodotti.');
    }

    const permittedFilters: Record<string, string> = {
      name: 'contains', styleLabel: 'eq',
      subcategory: 'eq', normalizedColor: 'eq',
    };
    const filters = request.filters ?? [];
    if (filters.some(filter => permittedFilters[filter.field] !== filter.operator ||
      typeof filter.value !== 'string')) {
      throw new Error('Filtro della griglia non supportato dal catalogo prodotti.');
    }
    const filterValue = (field: string): string | undefined => {
      const value = filters.find(filter => filter.field === field)?.value;
      return typeof value === 'string' ? value.trim() || undefined : undefined;
    };

    // Category and gender are fixed by the outfit slot, not editable grid filters.
    const nameFilter = filterValue('name');
    const globalQuery = request.search?.value?.trim();
    if (nameFilter && globalQuery && nameFilter !== globalQuery) {
      throw new Error('Usa il filtro Nome oppure la ricerca generale, non entrambi.');
    }
    const query = nameFilter ?? globalQuery;
    const page = await firstValueFrom(this.catalog.getProducts({
      limit: request.pageSize,
      ...(typeof request.continuation === 'string' ? { cursor: request.continuation } : {}),
      ...(query ? { q: query } : {}),
      category: this.itemData.category,
      gender: this.itemData.gender,
      visibleInApp: true,
      activeOnly: true,
      ...(filterValue('subcategory') ? { subcategory: filterValue('subcategory') } : {}),
      ...(filterValue('styleLabel') ? { style: filterValue('styleLabel') } : {}),
      ...(filterValue('normalizedColor') ? { color: filterValue('normalizedColor') } : {}),
    }));
    const used = new Set(this.itemData.productIdsInOutfit);
    const items = page.data
      .filter(product => !used.has(product.id))
      .map(product => ({
        ...product,
        genderLabel: product.genderTargets.map(code => code === 'D' ? 'Donna' : code === 'U' ? 'Uomo' : code).join(', '),
        styleLabel: product.fashionProfile?.styleAffinities?.map(code =>
          PICKER_STYLE_OPTIONS.find(option => option.value === code)?.label ?? code).join(', ') || '—',
        imagePreview: product.images?.find(image => typeof image === 'string' &&
          /^https:\/\//i.test(image.trim())) || '',
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

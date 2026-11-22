import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild, inject } from '@angular/core';
import { catchError, firstValueFrom, forkJoin, map, of, timeout } from 'rxjs';
import { ColData, Colonne, DataGridComponent, GridDataProvider, GridLoadRequest } from '../../../../core/public-api';
import { CatalogProduct } from '../../models/affiliate-catalog.models';
import { OutfitTaxonomyOption, readableTaxonomyName } from '../../models/outfit-taxonomy-labels';
import { isAllowedOutfitRoleProduct, outfitRoleLabel } from '../../models/outfit-accessory-roles';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

/** Data passed through the existing Core PopUpService registry. */
export interface OutfitReplacementPickerContext {
  category: string;
  gender: 'U' | 'D';
  productIdsInOutfit: string[];
  /** Set only for replacement. Adding a new slot keeps the original fixed-category picker. */
  allowedCategories?: string[];
  role?: string;
  /** Display names loaded by the editor; the backend still receives category ids. */
  categoryLabels?: Record<string, string>;
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
  subcategories: readonly OutfitTaxonomyOption[],
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
      lista: listOptions(subcategories.map(item => ({
        value: item.id, label: readableTaxonomyName(item.id, item.categoryName),
      }))),
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
      <div class="outfit-product-picker__category">
        <label *ngIf="itemData.allowedCategories?.length; else fixedCategory" for="outfit-replacement-category">
          Categoria
          <select id="outfit-replacement-category" class="form-select form-select-sm"
            [value]="selectedCategory" (change)="changeCategory($any($event.target).value)">
            <option *ngFor="let category of categoryOptions" [value]="category">{{ categoryDisplayName(category) }}</option>
          </select>
        </label>
        <ng-template #fixedCategory>
          <span>Categoria: <strong>{{ categoryDisplayName(selectedCategory) }}</strong></span>
        </ng-template>
        <span>Genere: <strong>{{ itemData.gender === 'D' ? 'Donna' : 'Uomo' }}</strong></span>
        <span>I prodotti devono essere attivi e visibili nell'app.</span>
      </div>
      <p *ngIf="itemData.allowedCategories?.length" class="small text-muted">
        Mostro solo categorie compatibili con il ruolo {{ roleLabel(itemData.role ?? '') }}.
        Il cambio azzera sottocategoria, nome, stile, colore e paginazione.
      </p>
      <p *ngIf="loading" role="status">Caricamento filtri…</p>
      <p *ngIf="error" class="text-danger" role="alert">{{ error }}</p>
      <p *ngIf="filterWarning" class="small text-muted" role="status">{{ filterWarning }}</p>
      <!-- ngFor destroys the old Core grid when the category changes, clearing
           its remote filters, selected row, cursor and pagination. -->
      <ng-container *ngFor="let activeCategory of [selectedCategory]">
      <app-data-grid *ngIf="!loading && provider"
        #grid
        [idTable]="'outfit-replacement-picker-grid-' + activeCategory"
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
      </ng-container>
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
    .outfit-product-picker__category {
      display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1rem;
      font-size: .8rem; color: var(--bs-secondary-color, #6c757d);
    }
    .outfit-product-picker__category label { display: flex; align-items: center; gap: .5rem; }
    .outfit-product-picker__category select { width: auto; min-width: 180px; }
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
      queueMicrotask(() => {
        if (this.grid === grid) void grid.renderGrid();
      });
    }
  }

  columns: Colonne[] = [];
  selectedCategory = '';
  categoryOptions: string[] = [];
  filterWarning = '';
  readonly styles = PICKER_STYLE_OPTIONS;
  readonly roleLabel = outfitRoleLabel;
  private filterLoadId = 0;

  categoryDisplayName(category: string): string {
    return readableTaxonomyName(category, this.itemData.categoryLabels?.[category]);
  }
  provider?: GridDataProvider<OutfitReplacementRow>;
  loading = true;
  error = '';

  ngOnInit(): void {
    this.selectedCategory = this.itemData.category;
    this.categoryOptions = [...new Set([
      this.itemData.category,
      ...(this.itemData.allowedCategories ?? []),
    ])].sort((a, b) => a.localeCompare(b));
    if (!this.itemData.category || !['D', 'U'].includes(this.itemData.gender)) {
      this.error = 'Categoria o genere del capo originale non validi.';
      this.loading = false;
      return;
    }
    this.loadCategoryFilters();
  }

  private loadCategoryFilters(): void {
    const category = this.selectedCategory;
    const loadId = ++this.filterLoadId;
    this.loading = true;
    this.provider = undefined; // destroys the previous Core grid and its filters
    this.filterWarning = '';

    forkJoin({
      // The canonical taxonomy returns both ids and their user-facing descriptions.
      // The ids-only affiliate endpoint is a fallback, not the primary source.
      subcategories: this.catalog.getCurationCategories(category).pipe(
        timeout({ first: 6000 }),
        catchError(() => {
          if (loadId === this.filterLoadId) {
            this.filterWarning = 'Descrizioni delle sottocategorie non disponibili: uso nomi di riserva.';
          }
          return this.catalog.getProductSubcategories(category).pipe(
            timeout({ first: 6000 }),
            map(ids => (Array.isArray(ids) ? ids : []).map(id => ({
              id, categoryName: readableTaxonomyName(id),
            }))),
            catchError(() => {
              if (loadId === this.filterLoadId) {
                this.filterWarning = 'Sottocategorie non disponibili. Puoi cercare per nome.';
              }
              return of([] as OutfitTaxonomyOption[]);
            }),
          );
        }),
      ),
      colors: this.catalog.getOutfitColors().pipe(
        timeout({ first: 6000 }),
        catchError(() => {
          if (loadId === this.filterLoadId) {
            this.filterWarning = this.filterWarning
              ? this.filterWarning + ' Colori non disponibili.'
              : 'Filtro colori non disponibile. Puoi cercare per nome.';
          }
          return of([] as Array<{ id: string; value: string }>);
        }),
      ),
    }).subscribe({
      next: ({ subcategories, colors }) => {
        if (loadId !== this.filterLoadId) return;
        const validSubcategories = [...new Map(
          (Array.isArray(subcategories) ? subcategories : [])
            .filter((item): item is OutfitTaxonomyOption =>
              !!item && typeof item.id === 'string' && !!item.id.trim())
            .map(item => [item.id, item] as const),
        ).values()].sort((a, b) =>
          readableTaxonomyName(a.id, a.categoryName)
            .localeCompare(readableTaxonomyName(b.id, b.categoryName), 'it'));
        const validColors = (Array.isArray(colors) ? colors : [])
          .filter(item => item && item.id && item.value)
          .sort((a, b) => a.value.localeCompare(b.value));
        this.columns = buildReplacementPickerColumns(validSubcategories, validColors);
        this.provider = { load: (request) => this.loadPage(request) };
        this.loading = false;
      },
      error: () => {
        if (loadId !== this.filterLoadId) return;
        this.columns = buildReplacementPickerColumns([], []);
        this.provider = { load: (request) => this.loadPage(request) };
        this.filterWarning = 'Filtri non disponibili. Puoi cercare per nome.';
        this.loading = false;
      },
    });
  }

  changeCategory(category: string): void {
    if (!this.itemData.allowedCategories?.length || !this.categoryOptions.includes(category) ||
        category === this.selectedCategory) return;
    this.selectedCategory = category;
    this.error = '';
    this.loadCategoryFilters();
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

    // Gender and outfit role are immutable. Category is selected above the grid.
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
      category: this.selectedCategory,
      gender: this.itemData.gender,
      visibleInApp: true,
      activeOnly: true,
      ...(filterValue('subcategory') ? { subcategory: filterValue('subcategory') } : {}),
      ...(filterValue('styleLabel') ? { style: filterValue('styleLabel') } : {}),
      ...(filterValue('normalizedColor') ? { color: filterValue('normalizedColor') } : {}),
    }));
    const used = new Set(this.itemData.productIdsInOutfit);
    const items = page.data
      .filter(product => !used.has(product.id) &&
        product.category === this.selectedCategory &&
        (!this.itemData.role || isAllowedOutfitRoleProduct(
          this.itemData.role, product.category, product.subcategory ?? '',
        )))
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
      product.category === this.selectedCategory &&
      (!this.itemData.role || isAllowedOutfitRoleProduct(
        this.itemData.role, product.category, product.subcategory ?? '',
      )) &&
      product.genderTargets.includes(this.itemData.gender) &&
      !this.itemData.productIdsInOutfit.includes(product.id);
    if (!valid) {
      this.error = 'Questo prodotto non è disponibile o non è compatibile con il capo da sostituire.';
      return;
    }
    this.result.emit({ name: 'selected', product });
  }
}

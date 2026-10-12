import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DynamicFormComponent } from '../../../core/forms/dynamic-form/dynamic-form.component';
import {
  AFFILIATE_PRODUCT_CURATION_FORM,
  AffiliateProductCurationFormEvent,
  buildAffiliateProductCurationFormData,
  buildAffiliateProductCurationUpdate,
} from '../components/products/affiliate-product-detail.component';
import { CatalogProduct } from '../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../services/affiliate-catalog.service';

export interface AffiliateProductFormContext {
  productId: string;
}

export interface AffiliateProductFormResult {
  name: 'saved' | 'cancelled';
  product?: CatalogProduct;
}

@Component({
  selector: 'app-affiliate-product-form-host',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicFormComponent],
  templateUrl: './affiliate-product-form-host.component.html',
  styleUrl: './affiliate-product-form-host.component.scss',
})
export class AffiliateProductFormHostComponent implements OnInit {
  private readonly catalog = inject(AffiliateCatalogService);

  itemData: AffiliateProductFormContext = { productId: '' };
  @Output() result = new EventEmitter<AffiliateProductFormResult>();

  readonly formId = AFFILIATE_PRODUCT_CURATION_FORM;
  product: CatalogProduct | null = null;
  formData: ReturnType<typeof buildAffiliateProductCurationFormData> | null = null;
  enabledForApp = false;
  loading = false;
  saving = false;
  error = '';

  ngOnInit(): void {
    if (!this.itemData.productId) {
      this.error = 'Identificativo prodotto non valido.';
      return;
    }
    this.loading = true;
    this.catalog.getProduct(this.itemData.productId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.formData = buildAffiliateProductCurationFormData(product);
          this.enabledForApp = product.active && product.enabledForApp !== false;
        },
        error: () => this.error = 'Impossibile caricare il prodotto da modificare.',
      });
  }

  productImage(product: CatalogProduct): string | null {
    return product.images?.find((image) => typeof image === 'string' && image.trim().length > 0) || null;
  }

  handleForm(event: AffiliateProductCurationFormEvent): void {
    if (event.name === 'cancelForm') {
      if (!this.saving) this.result.emit({ name: 'cancelled' });
      return;
    }
    if (event.name !== 'submitForm' || !this.product || this.saving) return;

    const category = String(event.formData['category'] ?? '').trim();
    const subcategory = String(event.formData['subcategory'] ?? '').trim();
    if (this.product.active && this.enabledForApp && (!category || !subcategory)) {
      this.error = 'Per mostrare il prodotto nell’app devi associare categoria e sottocategoria ComeMiVesto.';
      return;
    }

    const input = buildAffiliateProductCurationUpdate(this.product, this.enabledForApp, event.formData);
    if (!Object.keys(input).length) {
      this.result.emit({ name: 'cancelled' });
      return;
    }

    this.error = '';
    this.saving = true;
    this.catalog.updateProduct(this.product.id, input)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (product) => this.result.emit({ name: 'saved', product }),
        error: (error: { status?: number }) => {
          if (error?.status === 401 || error?.status === 403) {
            this.error = 'Non sei autorizzato a modificare questo prodotto.';
          } else if (error?.status === 409) {
            this.error = 'Categoria, sottocategoria o colore non validi per la tassonomia ComeMiVesto.';
          } else if (error?.status === 400) {
            this.error = 'Controlla i dati della classificazione.';
          } else {
            this.error = 'Impossibile salvare il prodotto. Riprova.';
          }
        },
      });
  }
}

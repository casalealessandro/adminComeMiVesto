import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  AiOutfitPreviewOccasion,
  AiOutfitPreviewOutfit,
  AiOutfitPreviewProduct,
  AiOutfitPreviewRequest,
  AiOutfitPreviewResult,
  AiOutfitPreviewSeason,
  AiOutfitPreviewStyle,
  AiOutfitPreviewGender,
} from '../../models/affiliate-catalog-api.models';
import { AiOutfitPublishRequest } from '../../models/ai-outfit-publish.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AiOutfitCostEstimate, estimateAiOutfitCost } from '../../utils/ai-outfit-cost-estimate';

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-affiliate-outfit-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './affiliate-outfit-preview.component.html',
  styleUrls: ['./affiliate-outfit-preview.component.scss', './affiliate-outfit-publish.scss', './affiliate-outfit-count.scss'],
})
export class AffiliateOutfitPreviewComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  readonly minOutfitCount = 3;
  readonly maxOutfitCount = 6;

  readonly genderOptions: SelectOption<AiOutfitPreviewGender>[] = [
    { value: 'MAN', label: 'Uomo' },
    { value: 'WOMAN', label: 'Donna' },
  ];
  readonly seasonOptions: SelectOption<AiOutfitPreviewSeason>[] = [
    { value: 'SPRING', label: 'Primavera' },
    { value: 'SUMMER', label: 'Estate' },
    { value: 'AUTUMN', label: 'Autunno' },
    { value: 'WINTER', label: 'Inverno' },
  ];
  readonly occasionOptions: SelectOption<AiOutfitPreviewOccasion>[] = [
    { value: 'EVERYDAY', label: 'Quotidiano' },
    { value: 'OFFICE', label: 'Ufficio' },
    { value: 'APERITIVO', label: 'Aperitivo' },
    { value: 'CEREMONY', label: 'Cerimonia' },
    { value: 'EVENING', label: 'Sera' },
    { value: 'SPORT', label: 'Sport' },
    { value: 'TRAVEL', label: 'Viaggio' },
  ];
  readonly styleOptions: SelectOption<AiOutfitPreviewStyle>[] = [
    { value: 'CASUAL', label: 'Casual' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'SPORTY', label: 'Sportivo' },
    { value: 'SMART_CASUAL', label: 'Smart casual' },
    { value: 'ELEGANT', label: 'Elegante' },
    { value: 'ALTERNATIVE', label: 'Alternativo' },
    { value: 'FESTIVAL', label: 'Festival' },
    { value: 'CLASSIC', label: 'Classico' },
    { value: 'TRENDY', label: 'Trendy' },
    { value: 'EVENING', label: 'Serata' },
  ];

  request: AiOutfitPreviewRequest = {
    gender: 'MAN',
    season: 'SPRING',
    occasion: 'EVERYDAY',
    style: 'CASUAL',
  };
  outfitCount = 3;

  result: AiOutfitPreviewResult | null = null;
  loading = false;
  error = '';
  programNames = new Map<string, string>();
  readonly publishing = new Set<string>();
  readonly published = new Map<string, string>();
  readonly publishErrors = new Map<string, string>();

  ngOnInit(): void {
    this.affiliateCatalogService.getPrograms().subscribe({
      next: (programs) => {
        this.programNames = new Map(programs.map((program) => [program.id, program.name]));
      },
      error: () => {},
    });
  }

  generate(): void {
    if (this.loading) return;
    const count = Number(this.outfitCount);
    if (!Number.isInteger(count) || count < this.minOutfitCount || count > this.maxOutfitCount) {
      this.error = `Il numero di outfit deve essere un intero tra ${this.minOutfitCount} e ${this.maxOutfitCount}.`;
      return;
    }

    this.loading = true;
    this.error = '';
    this.result = null;
    this.publishing.clear();
    this.published.clear();
    this.publishErrors.clear();
    const request: AiOutfitPreviewRequest = { ...this.request, count };
    // Keep the normalized request available to the UI/tests and aligned with the backend response.
    this.request = request;

    this.affiliateCatalogService.generateOutfitPreview(request)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (result) => this.result = result,
        error: (error) => {
          const status = Number(error?.status ?? 0);
          if (status === 403) {
            this.error = 'La generazione AI è riservata agli amministratori.';
            return;
          }
          this.error = error?.error?.message || 'Impossibile generare la preview AI. Riprova tra poco.';
        },
      });
  }

  publish(outfit: AiOutfitPreviewOutfit): void {
    const key = this.outfitKey(outfit);
    if (this.publishing.has(key) || this.published.has(key)) return;

    const input: AiOutfitPublishRequest = {
      title: outfit.title,
      description: outfit.description,
      previewImageUrl: outfit.previewImageUrl,
      gender: outfit.gender,
      season: outfit.season,
      style: outfit.style,
      products: outfit.products.map((product) => ({ catalogProductId: product.catalogProductId, role: product.role })),
    };

    this.publishing.add(key);
    this.publishErrors.delete(key);
    this.affiliateCatalogService.publishOutfitPreview(input)
      .pipe(finalize(() => this.publishing.delete(key)))
      .subscribe({
        next: (published) => {
          this.published.set(key, published.id);
          outfit.previewImageUrl = published.imageUrl;
        },
        error: (error) => {
          const status = Number(error?.status ?? 0);
          if (status === 409) {
            this.publishErrors.set(key, 'Il catalogo o la preview sono cambiati: genera nuovamente questo batch prima di salvarlo.');
            return;
          }
          this.publishErrors.set(key, error?.error?.message || 'Impossibile salvare questo outfit.');
        },
      });
  }

  outfitKey(outfit: AiOutfitPreviewOutfit): string {
    return `${outfit.title}|${outfit.products.map((product) => product.catalogProductId).join('|')}`;
  }

  isPublishing(outfit: AiOutfitPreviewOutfit): boolean {
    return this.publishing.has(this.outfitKey(outfit));
  }

  publishedId(outfit: AiOutfitPreviewOutfit): string | undefined {
    return this.published.get(this.outfitKey(outfit));
  }

  publishError(outfit: AiOutfitPreviewOutfit): string {
    return this.publishErrors.get(this.outfitKey(outfit)) || '';
  }

  programLabel(programId: string | undefined): string {
    if (!programId) return 'Non disponibile';
    return this.programNames.get(programId) || programId;
  }

  productImage(product: AiOutfitPreviewProduct): string {
    return product.images?.find((image) => Boolean(image?.trim())) || '';
  }

  outfitTotal(outfit: AiOutfitPreviewOutfit): number {
    return outfit.products.reduce((total, product) => total + (Number.isFinite(product.price) ? product.price : 0), 0);
  }

  costEstimate(preview: AiOutfitPreviewResult): AiOutfitCostEstimate | null {
    return estimateAiOutfitCost(preview);
  }

  formatTokens(value: number | undefined): string {
    return new Intl.NumberFormat('it-IT').format(value ?? 0);
  }

  formatEuro(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 3,
      maximumFractionDigits: 4,
    }).format(value);
  }

  formatUsd(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 4,
    }).format(value);
  }

  trackOutfit(index: number, outfit: AiOutfitPreviewOutfit): string {
    return `${index}-${outfit.title}`;
  }

  trackProduct(_index: number, product: AiOutfitPreviewProduct): string {
    return product.catalogProductId;
  }
}

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
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-affiliate-outfit-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './affiliate-outfit-preview.component.html',
  styleUrl: './affiliate-outfit-preview.component.scss',
})
export class AffiliateOutfitPreviewComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

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

  result: AiOutfitPreviewResult | null = null;
  loading = false;
  error = '';
  programNames = new Map<string, string>();

  ngOnInit(): void {
    this.affiliateCatalogService.getPrograms().subscribe({
      next: (programs) => {
        this.programNames = new Map(programs.map((program) => [program.id, program.name]));
      },
      error: () => {
        // Program names are presentation-only. Preview generation remains available with program IDs.
      },
    });
  }

  generate(): void {
    if (this.loading) return;

    this.loading = true;
    this.error = '';
    this.result = null;
    const request: AiOutfitPreviewRequest = { ...this.request };

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

  formatTokens(value: number | undefined): string {
    return new Intl.NumberFormat('it-IT').format(value ?? 0);
  }

  trackOutfit(index: number, outfit: AiOutfitPreviewOutfit): string {
    return `${index}-${outfit.title}`;
  }

  trackProduct(_index: number, product: AiOutfitPreviewProduct): string {
    return product.catalogProductId;
  }
}

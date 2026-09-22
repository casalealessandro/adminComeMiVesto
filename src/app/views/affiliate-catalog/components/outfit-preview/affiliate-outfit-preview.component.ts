import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  AiOutfitDraft,
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
import { AiCreator } from '../../models/ai-creator.models';
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

  readonly minOutfitCount = 1;
  readonly maxOutfitCount = 6;
  readonly fallbackAvatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';

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
  creators: AiCreator[] = [];
  creatorsLoading = false;
  pendingDrafts: AiOutfitDraft[] = [];
  draftsLoading = false;
  resumedDraftId: string | null = null;
  readonly publishing = new Set<string>();
  readonly published = new Map<string, string>();
  readonly publishErrors = new Map<string, string>();
  readonly selectedProductByOutfit = new Map<string, string>();

  ngOnInit(): void {
    this.affiliateCatalogService.getPrograms().subscribe({
      next: (programs) => {
        this.programNames = new Map(programs.map((program) => [program.id, program.name]));
      },
      error: () => {},
    });
    this.creatorsLoading = true;
    this.affiliateCatalogService.getAiCreators()
      .pipe(finalize(() => this.creatorsLoading = false))
      .subscribe({
        next: (creators) => this.creators = creators,
        error: () => {},
      });
    this.loadDrafts();
  }

  loadDrafts(): void {
    if (this.draftsLoading) return;
    this.draftsLoading = true;
    this.affiliateCatalogService.getPendingOutfitDrafts()
      .pipe(finalize(() => this.draftsLoading = false))
      .subscribe({
        next: (drafts) => this.pendingDrafts = drafts,
        error: () => {},
      });
  }

  resumeDraft(draft: AiOutfitDraft): void {
    const result: AiOutfitPreviewResult = {
      generatedAt: draft.generatedAt,
      model: draft.model,
      providerResponseId: draft.providerResponseId,
      request: { ...draft.request },
      candidatesEvaluated: draft.candidatesEvaluated,
      imagesEvaluated: draft.imagesEvaluated,
      usage: draft.usage,
      outfits: [{ ...draft.outfit, draftId: draft.id }],
    };
    this.ensureTagPositions(result);
    this.result = result;
    this.resumedDraftId = draft.id;
    this.request = { ...draft.request };
    this.outfitCount = draft.request.count ?? 1;
    this.error = '';
    this.publishing.clear();
    this.published.clear();
    this.publishErrors.clear();
  }

  availableCreators(): AiCreator[] {
    const gender = this.request.gender === 'WOMAN' ? 'D' : 'U';
    return this.creators.filter((creator) => creator.active && creator.gender === gender);
  }

  onGenderChange(gender: AiOutfitPreviewGender): void {
    this.request.gender = gender;
    if (this.request.creatorUid && !this.availableCreators().some((creator) => creator.uid === this.request.creatorUid)) {
      this.request.creatorUid = undefined;
    }
  }

  creatorByUid(uid: string | undefined): AiCreator | undefined {
    return uid ? this.creators.find((creator) => creator.uid === uid) : undefined;
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
    this.resumedDraftId = null;
    this.publishing.clear();
    this.published.clear();
    this.publishErrors.clear();
    const request: AiOutfitPreviewRequest = { ...this.request, count };
    // Keep the normalized request available to the UI/tests and aligned with the backend response.
    this.request = request;

    this.affiliateCatalogService.generateOutfitPreview(request)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (result) => {
          this.ensureTagPositions(result);
          this.result = result;
          this.loadDrafts();
        },
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

    const creatorUid = outfit.creatorUid || this.result?.request.creatorUid || this.request.creatorUid;
    const input: AiOutfitPublishRequest = {
      title: outfit.title,
      description: outfit.description,
      previewImageUrl: outfit.previewImageUrl,
      gender: outfit.gender,
      season: outfit.season,
      style: outfit.style,
      ...(creatorUid ? { creatorUid } : {}),
      ...(outfit.draftId ? { draftId: outfit.draftId } : {}),
      products: outfit.products.map((product) => ({
        catalogProductId: product.catalogProductId,
        role: product.role,
        ...(this.hasNormalizedPosition(product) ? { x: product.x, y: product.y } : {}),
      })),
    };

    this.publishing.add(key);
    this.publishErrors.delete(key);
    this.affiliateCatalogService.publishOutfitPreview(input)
      .pipe(finalize(() => this.publishing.delete(key)))
      .subscribe({
        next: (published) => {
          this.published.set(key, published.id);
          outfit.previewImageUrl = published.imageUrl;
          if (outfit.draftId) {
            this.pendingDrafts = this.pendingDrafts.filter((draft) => draft.id !== outfit.draftId);
          }
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
    return outfit.draftId || `${outfit.title}|${outfit.products.map((product) => product.catalogProductId).join('|')}`;
  }

  selectProductTag(outfit: AiOutfitPreviewOutfit, product: AiOutfitPreviewProduct, event?: Event): void {
    event?.stopPropagation();
    if (this.publishedId(outfit)) return;
    this.selectedProductByOutfit.set(this.outfitKey(outfit), product.catalogProductId);
  }

  isSelectedTag(outfit: AiOutfitPreviewOutfit, product: AiOutfitPreviewProduct): boolean {
    return this.selectedProductByOutfit.get(this.outfitKey(outfit)) === product.catalogProductId;
  }

  tagStyle(product: AiOutfitPreviewProduct, index: number): Record<string, string> {
    const position = this.positionForProduct(product, index);
    return { left: `${position.x * 100}%`, top: `${position.y * 100}%` };
  }

  moveSelectedTag(event: MouseEvent, outfit: AiOutfitPreviewOutfit): void {
    if (this.publishedId(outfit)) return;
    const selectedId = this.selectedProductByOutfit.get(this.outfitKey(outfit));
    if (!selectedId) return;
    const product = outfit.products.find((item) => item.catalogProductId === selectedId);
    const host = event.currentTarget as HTMLElement | null;
    const image = host?.querySelector('img') as HTMLImageElement | null;
    if (!product || !image || !image.naturalWidth || !image.naturalHeight) return;

    const rect = image.getBoundingClientRect();
    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const boxRatio = rect.width / rect.height;
    let renderedWidth = rect.width;
    let renderedHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (naturalRatio > boxRatio) {
      renderedHeight = rect.width / naturalRatio;
      offsetY = (rect.height - renderedHeight) / 2;
    } else {
      renderedWidth = rect.height * naturalRatio;
      offsetX = (rect.width - renderedWidth) / 2;
    }

    const x = (event.clientX - rect.left - offsetX) / renderedWidth;
    const y = (event.clientY - rect.top - offsetY) / renderedHeight;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    product.x = Math.round(x * 1000) / 1000;
    product.y = Math.round(y * 1000) / 1000;
  }

  private ensureTagPositions(result: AiOutfitPreviewResult): void {
    result.outfits.forEach((outfit) => outfit.products.forEach((product, index) => {
      if (this.hasNormalizedPosition(product)) return;
      const fallback = this.positionForRole(product.role, index);
      product.x = fallback.x;
      product.y = fallback.y;
    }));
  }

  private hasNormalizedPosition(product: AiOutfitPreviewProduct): product is AiOutfitPreviewProduct & { x: number; y: number } {
    return Number.isFinite(product.x) && Number.isFinite(product.y)
      && (product.x as number) >= 0 && (product.x as number) <= 1
      && (product.y as number) >= 0 && (product.y as number) <= 1;
  }

  private positionForProduct(product: AiOutfitPreviewProduct, index: number): { x: number; y: number } {
    return this.hasNormalizedPosition(product) ? { x: product.x, y: product.y } : this.positionForRole(product.role, index);
  }

  private positionForRole(role: string, index: number): { x: number; y: number } {
    const normalized = (role || '').trim().toUpperCase();
    const x = [0.38, 0.62, 0.42, 0.58][Math.abs(index) % 4];
    if (normalized === 'SHOES' || /(SHOE|SNEAKER|BOOT|SCARP|STIVAL)/.test(normalized)) return { x, y: 0.86 };
    if (normalized === 'BOTTOM' || /(PANT|TROUSER|JEAN|SHORT|BERMUDA|SKIRT|GONNA|PANTAL)/.test(normalized)) return { x, y: 0.61 };
    if (normalized === 'HEADWEAR' || /(HAT|CAP|GLASSES|OCCHIAL|EARRING|NECKLACE|COLLAN)/.test(normalized)) return { x, y: 0.18 };
    if (normalized === 'BAG' || /(BAG|BORS)/.test(normalized)) return { x: index % 2 === 0 ? 0.72 : 0.28, y: 0.48 };
    if (normalized === 'ACCESSORY' || /(BELT|CINTUR|WATCH|OROLOG|ACCESSOR)/.test(normalized)) return { x, y: 0.45 };
    if (normalized === 'DRESS' || /(DRESS|ABITO|VESTITO)/.test(normalized)) return { x, y: 0.48 };
    if (normalized === 'OUTERWEAR' || /(OUTER|JACKET|BLAZER|COAT|TRENCH|GIACC|CAPPOTT)/.test(normalized)) return { x, y: 0.36 };
    return { x, y: 0.34 };
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

  draftCreator(draft: AiOutfitDraft): AiCreator | undefined {
    return this.creatorByUid(draft.outfit.creatorUid || draft.request.creatorUid);
  }

  trackDraft(_index: number, draft: AiOutfitDraft): string {
    return draft.id;
  }

  trackOutfit(index: number, outfit: AiOutfitPreviewOutfit): string {
    return `${index}-${outfit.title}`;
  }

  trackProduct(_index: number, product: AiOutfitPreviewProduct): string {
    return product.catalogProductId;
  }
}

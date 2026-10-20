import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnagraficaWrapperComponent } from '../../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DynamicFormComponent } from '../../../components/dynamic-form/dynamic-form.component';
import { outfit, OutfitsService, Tag, CatalogReplacementRequest } from '../../../services/outfit.service';
import { FotoOutfitPage } from '../foto-outfit/foto-outfit.page';
import { UserProfile } from '../../../interface/app.interface';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { FormService } from '../../../services/form.service';
import { alert } from '../../../widgets/ui-dialogs';

export const EDITABLE_OUTFIT_FIELDS = [
  'title', 'description', 'gender', 'style', 'season', 'occasion',
] as const;

/**
 * The existing REST endpoint accepts only these fields. Derived categories,
 * colors, brands and product ids are calculated on the server from tags.
 */
export function buildOutfitFormPayload(
  formData: Record<string, unknown>,
  imageUrl: string,
  tags: Tag[],
  originalImageUrl = '',
): Partial<outfit> {
  const payload: Record<string, unknown> = {};
  for (const key of EDITABLE_OUTFIT_FIELDS) {
    if (key === 'occasion' && (formData[key] === null || formData[key] === '')) continue;
    if (formData[key] !== undefined) payload[key] = formData[key];
  }
  // FotoOutfit owns image edits; a configured imageUrl form field is supported
  // when the photo component has not changed the image.
  const submittedImage = typeof formData['imageUrl'] === 'string' ? formData['imageUrl'] : '';
  if (imageUrl && imageUrl !== originalImageUrl) payload['imageUrl'] = imageUrl;
  else if (submittedImage) payload['imageUrl'] = submittedImage;
  else if (imageUrl) payload['imageUrl'] = imageUrl;
  payload['tags'] = [...tags];
  return payload as Partial<outfit>;
}

@Component({
  selector: 'app-outfit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AnagraficaWrapperComponent, DynamicFormComponent, FotoOutfitPage],
  templateUrl: './outfit-form.component.html',
  styleUrl: './outfit-form.component.scss'
})
export class OutfitFormComponent {
  outfitData = signal<outfit | undefined>(undefined);
  formReady = signal(false);
  loading = signal(false);
  saving = signal(false);
  regeneratingImage = signal(false);
  regenerationError = signal('');
  @ViewChild(FotoOutfitPage) photoPage?: FotoOutfitPage;
  error = signal('');
  missingFormFields = signal<string[]>([]);
  readonly editableFieldNames = EDITABLE_OUTFIT_FIELDS;

  private readonly activateRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly outFitService = inject(OutfitsService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly formService = inject(FormService);

  subtitle = '';
  outfitTitle = '';
  outfitId: string | null = null;
  imageUrl = signal('');
  private originalImageUrl = '';
  tags = signal<Tag[]>([]);
  catalogReplacements: CatalogReplacementRequest[] = [];
  targetUsers: UserProfile[] = [];
  targetUserId = '';

  ngOnInit(): void {
    this.fetchDataOutfit();
    this.userService.getUsers(100).subscribe({
      next: users => this.targetUsers = this.authService.isAdmin()
        ? users : users.filter(user => user.role === 'creator'),
      error: () => { /* Creator list is optional when editing an existing outfit. */ },
    });
    this.formService.getFormFields('outfitForm').subscribe({
      next: fields => {
        const names = new Set(fields.map(field => field.name));
        this.missingFormFields.set(
          EDITABLE_OUTFIT_FIELDS.filter(name => !names.has(name)),
        );
      },
      error: () => this.error.set('Impossibile verificare i campi del form outfit.'),
    });
  }

  fetchDataOutfit(): void {
    this.activateRoute.paramMap.subscribe(async params => {
      const id = params.get('id');
      this.outfitId = id;
      this.error.set('');
      this.formReady.set(false);
      this.loading.set(!!id);
      this.outfitData.set(undefined);
      this.imageUrl.set('');
      this.originalImageUrl = '';
      this.tags.set([]);
      this.catalogReplacements = [];
      this.regenerationError.set('');
      this.outfitTitle = id ? 'Modifica outfit' : 'Nuovo outfit';
      if (!id) {
        this.formReady.set(true);
        return;
      }
      try {
        const results = await this.outFitService.getAdminOutfitById(id);
        const item = results[0];
        if (!item) throw new Error('Outfit non trovato');
        this.applyOutfit(item);
        this.formReady.set(true);
      } catch {
        this.error.set('Impossibile caricare l’outfit. Il form non è stato aperto per evitare modifiche su dati incompleti.');
      } finally {
        this.loading.set(false);
      }
    });
  }

  setTags(event: { tags?: Tag[] }): void {
    if (Array.isArray(event?.tags)) this.tags.set([...event.tags]);
  }

  setCatalogReplacements(selections: CatalogReplacementRequest[]): void {
    this.catalogReplacements = selections;
  }

  canRegenerateImage(): boolean {
    const item = this.outfitData();
    return !!this.outfitId && item?.aiGenerated === true && !!item.aiOutfitDraftId &&
      item.imageMayNotMatchProducts === true && this.catalogReplacements.length === 0;
  }

  /** Uses the shared AI image backend only after saving and explicitly confirming. */
  async regenerateImage(): Promise<void> {
    const id = this.outfitId;
    if (!id || !this.canRegenerateImage() || this.saving() || this.regeneratingImage()) return;
    if (typeof window !== 'undefined' && !window.confirm(
      'Rigenerare la fotografia con i nuovi prodotti? Questa operazione usa AI a pagamento.'
    )) return;
    this.regeneratingImage.set(true);
    this.regenerationError.set('');
    try {
      const item = await this.outFitService.regeneratePublishedOutfitImage(id);
      this.applyOutfit(item);
    } catch (error: any) {
      this.regenerationError.set(error?.status === 409
        ? 'Outfit modificato oppure rigenerazione già avviata. Ricarica e riprova.'
        : error?.status === 504
          ? 'Il servizio AI non ha risposto in tempo. La fotografia precedente rimane disponibile.'
          : 'Rigenerazione non riuscita: la foto attuale e i prodotti salvati restano invariati.');
      // A browser timeout may happen after the server has completed.
      try {
        const fresh = (await this.outFitService.getAdminOutfitById(id))[0];
        if (fresh) this.applyOutfit(fresh);
      } catch { /* Keep the stale-image warning until a later refresh. */ }
    } finally {
      this.regeneratingImage.set(false);
    }
  }

  private applyOutfit(item: outfit): void {
    this.outfitData.set(item);
    this.imageUrl.set(item.imageUrl || '');
    this.originalImageUrl = item.imageUrl || '';
    this.tags.set(Array.isArray(item.tags) ? [...item.tags] : []);
    this.outfitTitle = item.title || 'Modifica outfit';
  }

  async submitFormOutfit(event: { name: string; formData?: Record<string, unknown> }): Promise<void> {
    if (event.name === 'cancelForm') {
      await this.router.navigate(['/outfit-list']);
      return;
    }
    if (event.name !== 'submitForm' || this.saving() || this.regeneratingImage()) return;

    const data = event.formData || {};
    const payload = buildOutfitFormPayload(data, this.imageUrl(), this.tags(), this.originalImageUrl);
    if (this.outfitId && this.catalogReplacements.length) {
      payload.catalogReplacements = [...this.catalogReplacements];
      if (typeof this.outfitData()?.updatedAt === 'number') {
        payload.expectedUpdatedAt = this.outfitData()!.updatedAt;
      }
    }
    const replaced = !!this.outfitId && this.catalogReplacements.length > 0;
    this.saving.set(true);
    this.error.set('');
    try {
      if (this.outfitId) {
        await this.outFitService.updateAdminOutfit(this.outfitId, payload);
      } else {
        if (this.targetUserId) payload.userId = this.targetUserId;
        await this.outFitService.createAdminOutfit(payload);
      }
      if (replaced && this.outfitId) {
        // Do not send the user to the list: show the manual image action after save.
        this.catalogReplacements = [];
        this.photoPage?.selectedReplacements.clear();
        this.photoPage?.emitReplacements();
        try {
          const updated = (await this.outFitService.getAdminOutfitById(this.outfitId))[0];
          if (!updated) throw new Error('Saved outfit unavailable');
          this.applyOutfit(updated);
        } catch {
          this.error.set('Sostituzione salvata: ricarica la pagina per vedere il nuovo outfit e rigenerare la foto.');
        }
        return;
      }
      await this.router.navigate(['/outfit-list']);
    } catch {
      this.error.set('Salvataggio outfit non riuscito. I dati rimangono nel form per un nuovo tentativo.');
      alert(this.error(), 'Errore durante il salvataggio');
    } finally {
      this.saving.set(false);
    }
  }

  btnInputEvent(_event: unknown): void {
    // Reserved for future field-specific interactions. No-op for PR2.
  }
}

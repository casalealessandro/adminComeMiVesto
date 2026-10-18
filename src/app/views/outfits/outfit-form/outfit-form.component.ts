import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnagraficaWrapperComponent } from '../../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DynamicFormComponent } from '../../../components/dynamic-form/dynamic-form.component';
import { outfit, OutfitsService, Tag } from '../../../services/outfit.service';
import { FotoOutfitPage } from '../foto-outfit/foto-outfit.page';
import { UserProfile } from '../../../interface/app.interface';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { FormService } from '../../../services/form.service';
import { alert } from '../../../widgets/ui-dialogs';

export const EDITABLE_OUTFIT_FIELDS = [
  'title', 'description', 'imageUrl', 'gender', 'style', 'season',
] as const;

/**
 * The existing REST endpoint accepts only these fields. Derived categories,
 * colors, brands and product ids are calculated on the server from tags.
 */
export function buildOutfitFormPayload(
  formData: Record<string, unknown>,
  imageUrl: string,
  tags: Tag[],
): Partial<outfit> {
  const payload: Record<string, unknown> = {};
  for (const key of EDITABLE_OUTFIT_FIELDS) {
    if (formData[key] !== undefined) payload[key] = formData[key];
  }
  // The image editor is the owner of imageUrl; the form's imageUrl is a fallback
  // until an explicit image-editor change is made.
  if (imageUrl) payload['imageUrl'] = imageUrl;
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
  tags = signal<Tag[]>([]);
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
      this.tags.set([]);
      this.outfitTitle = id ? 'Modifica outfit' : 'Nuovo outfit';
      if (!id) {
        this.formReady.set(true);
        return;
      }
      try {
        const results = await this.outFitService.getAdminOutfitById(id);
        const item = results[0];
        if (!item) throw new Error('Outfit non trovato');
        this.outfitData.set(item);
        this.imageUrl.set(item.imageUrl || '');
        this.tags.set(Array.isArray(item.tags) ? [...item.tags] : []);
        this.outfitTitle = item.title || 'Modifica outfit';
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

  async submitFormOutfit(event: { name: string; formData?: Record<string, unknown> }): Promise<void> {
    if (event.name === 'cancelForm') {
      await this.router.navigate(['/outfit-list']);
      return;
    }
    if (event.name !== 'submitForm' || this.saving()) return;

    const data = event.formData || {};
    const payload = buildOutfitFormPayload(data, this.imageUrl(), this.tags());
    this.saving.set(true);
    this.error.set('');
    try {
      if (this.outfitId) {
        await this.outFitService.updateAdminOutfit(this.outfitId, payload);
      } else {
        if (this.targetUserId) payload.userId = this.targetUserId;
        await this.outFitService.createAdminOutfit(payload);
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

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { DynamicFormComponent } from '../../../core/forms/dynamic-form/dynamic-form.component';
import {
  AiCreator,
  AiCreatorCreateInput,
  AiCreatorGender,
  AiCreatorStyle,
  AiCreatorUpdateInput,
} from '../models/ai-creator.models';
import { AffiliateCatalogService } from '../services/affiliate-catalog.service';

export type AffiliateAiCreatorFormMode = 'create' | 'edit';

export interface AffiliateAiCreatorFormContext {
  mode: AffiliateAiCreatorFormMode;
  creator?: AiCreator;
}

export interface AffiliateAiCreatorFormEvent {
  name: 'submitForm' | 'cancelForm';
  formData: Record<string, unknown>;
}

export interface AffiliateAiCreatorFormResult {
  name: 'saved' | 'cancelled';
  creator?: AiCreator;
}

const normalizedString = (value: unknown): string => String(value ?? '').trim();
const normalizedStyles = (value: unknown): AiCreatorStyle[] =>
  Array.isArray(value) ? value.filter((item): item is AiCreatorStyle => typeof item === 'string') : [];

export function buildAiCreatorCreateInput(formData: Record<string, unknown>): AiCreatorCreateInput {
  return {
    email: normalizedString(formData['email']),
    displayName: normalizedString(formData['displayName']),
    nome: normalizedString(formData['nome']),
    cognome: normalizedString(formData['cognome']),
    bio: normalizedString(formData['bio']),
    gender: formData['gender'] as AiCreatorGender,
    styleAffinity: normalizedStyles(formData['styleAffinity']),
    personaPrompt: normalizedString(formData['personaPrompt']),
    active: formData['active'] === true,
  };
}

export function buildAiCreatorUpdateInput(formData: Record<string, unknown>): AiCreatorUpdateInput {
  return {
    displayName: normalizedString(formData['displayName']),
    nome: normalizedString(formData['nome']),
    cognome: normalizedString(formData['cognome']),
    bio: normalizedString(formData['bio']),
    gender: formData['gender'] as AiCreatorGender,
    styleAffinity: normalizedStyles(formData['styleAffinity']),
    personaPrompt: normalizedString(formData['personaPrompt']),
    active: formData['active'] === true,
  };
}

export function selectedAiCreatorPhoto(formData: Record<string, unknown>): string | null {
  const value = normalizedString(formData['photoURL']);
  return /^data:image\//i.test(value) ? value : null;
}

export function aiCreatorErrorMessage(status: number): string {
  if (status === 400) return 'Controlla i dati inseriti nel creator.';
  if (status === 401 || status === 403) return 'Non sei autorizzato a gestire i creator AI.';
  if (status === 404) return 'Il creator AI non è più disponibile.';
  if (status === 409) return 'Esiste già un account con questa email oppure il creator non è utilizzabile.';
  if (status === 422) return 'Nome, bio o immagine del profilo non superano i controlli di moderazione.';
  if (status === 503) return 'Il servizio di moderazione non è temporaneamente disponibile.';
  if (status === 0) return 'Il backend non è raggiungibile. Riprova tra poco.';
  return 'Operazione sul creator AI non riuscita.';
}

@Component({
  selector: 'app-affiliate-ai-creator-form-host',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './affiliate-ai-creator-form-host.component.html',
  styleUrl: './affiliate-ai-creator-form-host.component.scss',
})
export class AffiliateAiCreatorFormHostComponent {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  itemData: AffiliateAiCreatorFormContext = { mode: 'create' };
  @Output() result = new EventEmitter<AffiliateAiCreatorFormResult>();

  saving = false;
  error = '';

  readonly createDefaults: Partial<AiCreatorCreateInput> = {
    gender: 'D',
    styleAffinity: ['C'],
    active: true,
  };

  readonly formId = 'affiliateAiCreator';

  handleForm(event: AffiliateAiCreatorFormEvent): void {
    if (event.name === 'cancelForm') {
      if (!this.saving) this.result.emit({ name: 'cancelled' });
      return;
    }

    if (event.name !== 'submitForm' || this.saving) return;
    this.itemData.mode === 'edit'
      ? this.updateCreator(event.formData)
      : this.createCreator(event.formData);
  }

  private createCreator(formData: Record<string, unknown>): void {
    this.saving = true;
    this.error = '';
    const photo = selectedAiCreatorPhoto(formData);

    this.affiliateCatalogService.createAiCreator(buildAiCreatorCreateInput(formData)).subscribe({
      next: (creator) => this.completeWithOptionalPhoto(creator, photo),
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.error = aiCreatorErrorMessage(error.status);
      },
    });
  }

  private updateCreator(formData: Record<string, unknown>): void {
    const uid = this.itemData.creator?.uid;
    if (!uid) {
      this.error = 'Identificativo creator non disponibile.';
      return;
    }

    this.saving = true;
    this.error = '';
    const photo = selectedAiCreatorPhoto(formData);

    this.affiliateCatalogService.updateAiCreator(uid, buildAiCreatorUpdateInput(formData)).subscribe({
      next: (creator) => this.completeWithOptionalPhoto(creator, photo),
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.error = aiCreatorErrorMessage(error.status);
      },
    });
  }

  private completeWithOptionalPhoto(creator: AiCreator, photoDataUrl: string | null): void {
    if (!photoDataUrl) {
      this.saving = false;
      this.result.emit({ name: 'saved', creator });
      return;
    }

    this.dataUrlToJpegBlob(photoDataUrl)
      .then((photo) => {
        this.affiliateCatalogService.uploadAiCreatorPhoto(creator.uid, photo).subscribe({
          next: (updatedCreator) => {
            this.saving = false;
            this.result.emit({ name: 'saved', creator: updatedCreator });
          },
          error: (error: HttpErrorResponse) => {
            this.saving = false;
            this.error = `Creator salvato, ma la foto non è stata aggiornata. ${aiCreatorErrorMessage(error.status)}`;
          },
        });
      })
      .catch(() => {
        this.saving = false;
        this.error = 'Creator salvato, ma non è stato possibile preparare la foto profilo.';
      });
  }

  private dataUrlToJpegBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error('image-load'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('canvas'));
          return;
        }

        context.drawImage(image, 0, 0);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('jpeg')),
          'image/jpeg',
          0.88,
        );
      };
      image.src = dataUrl;
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import {
  AiCreator,
  AiCreatorCreateInput,
  AiCreatorGender,
  AiCreatorStyle,
  AiCreatorUpdateInput,
} from '../../models/ai-creator.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

interface StyleOption {
  value: AiCreatorStyle;
  label: string;
}

@Component({
  selector: 'app-affiliate-ai-creators',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './affiliate-ai-creators.component.html',
  styleUrl: './affiliate-ai-creators.component.scss',
})
export class AffiliateAiCreatorsComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);
  readonly auth = inject(AuthService);

  readonly fallbackAvatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  readonly styleOptions: StyleOption[] = [
    { value: 'C', label: 'Casual' },
    { value: 'B', label: 'Business' },
    { value: 'SP', label: 'Sportivo' },
    { value: 'SC', label: 'Smart casual' },
    { value: 'E', label: 'Elegante' },
    { value: 'AT', label: 'Alternativo' },
    { value: 'FES', label: 'Festival' },
    { value: 'CL', label: 'Classico' },
    { value: 'TR', label: 'Trendy' },
    { value: 'SE', label: 'Serata' },
  ];

  creators: AiCreator[] = [];
  loading = false;
  saving = false;
  error = '';
  formOpen = false;
  editingUid: string | null = null;
  draft: AiCreatorCreateInput = this.emptyDraft();

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.affiliateCatalogService.getAiCreators()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (creators) => this.creators = creators,
        error: () => this.error = 'Impossibile caricare i creator AI.',
      });
  }

  openCreate(): void {
    if (!this.auth.isAdmin()) return;
    this.editingUid = null;
    this.draft = this.emptyDraft();
    this.formOpen = true;
    this.error = '';
  }

  openEdit(creator: AiCreator): void {
    if (!this.auth.isAdmin()) return;
    this.editingUid = creator.uid;
    this.draft = {
      email: creator.email,
      displayName: creator.displayName,
      nome: creator.nome,
      cognome: creator.cognome,
      bio: creator.bio,
      photoURL: creator.photoURL,
      gender: creator.gender,
      styleAffinity: [...creator.styleAffinity],
      personaPrompt: creator.personaPrompt,
      active: creator.active,
    };
    this.formOpen = true;
    this.error = '';
  }

  closeForm(): void {
    if (this.saving) return;
    this.formOpen = false;
    this.editingUid = null;
    this.draft = this.emptyDraft();
  }

  save(): void {
    if (!this.auth.isAdmin() || this.saving) return;
    const payload = this.normalizedDraft();
    if (!payload) return;

    this.saving = true;
    this.error = '';
    const request = this.editingUid
      ? this.affiliateCatalogService.updateAiCreator(this.editingUid, this.toUpdateInput(payload))
      : this.affiliateCatalogService.createAiCreator(payload);

    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: (creator) => {
        const index = this.creators.findIndex((item) => item.uid === creator.uid);
        if (index >= 0) this.creators[index] = creator;
        else this.creators = [...this.creators, creator];
        this.closeForm();
      },
      error: (error) => {
        const status = Number(error?.status ?? 0);
        if (status === 409) this.error = 'Esiste già un account con questa email oppure il creator non è utilizzabile.';
        else if (status === 422) this.error = 'Nome, bio o immagine del profilo non superano i controlli di moderazione.';
        else if (status === 503) this.error = 'Il servizio di moderazione non è temporaneamente disponibile.';
        else this.error = error?.error?.message || 'Impossibile salvare il creator AI.';
      },
    });
  }

  toggleStyle(style: AiCreatorStyle): void {
    const current = new Set(this.draft.styleAffinity);
    if (current.has(style)) {
      if (current.size === 1) return;
      current.delete(style);
    } else {
      current.add(style);
    }
    this.draft.styleAffinity = this.styleOptions
      .map((option) => option.value)
      .filter((value) => current.has(value));
  }

  hasStyle(style: AiCreatorStyle): boolean {
    return this.draft.styleAffinity.includes(style);
  }

  genderLabel(gender: AiCreatorGender): string {
    return gender === 'D' ? 'Donna' : 'Uomo';
  }

  styleLabel(style: AiCreatorStyle): string {
    return this.styleOptions.find((option) => option.value === style)?.label || style;
  }

  trackCreator(_index: number, creator: AiCreator): string {
    return creator.uid;
  }

  private emptyDraft(): AiCreatorCreateInput {
    return {
      email: '',
      displayName: '',
      nome: '',
      cognome: '',
      bio: '',
      photoURL: '',
      gender: 'D',
      styleAffinity: ['C'],
      personaPrompt: '',
      active: true,
    };
  }

  private normalizedDraft(): AiCreatorCreateInput | null {
    const payload: AiCreatorCreateInput = {
      email: this.draft.email.trim(),
      displayName: this.draft.displayName.trim(),
      nome: this.draft.nome.trim(),
      cognome: this.draft.cognome.trim(),
      bio: this.draft.bio.trim(),
      photoURL: this.draft.photoURL?.trim() || undefined,
      gender: this.draft.gender,
      styleAffinity: [...this.draft.styleAffinity],
      personaPrompt: this.draft.personaPrompt.trim(),
      active: this.draft.active,
    };
    if (!payload.email || !payload.displayName || !payload.nome || !payload.cognome
        || !payload.bio || !payload.personaPrompt || !payload.styleAffinity.length) {
      this.error = 'Compila tutti i campi obbligatori e seleziona almeno uno stile.';
      return null;
    }
    if (payload.photoURL && !/^https:\/\//i.test(payload.photoURL)) {
      this.error = 'La foto profilo deve usare un URL HTTPS.';
      return null;
    }
    return payload;
  }

  private toUpdateInput(payload: AiCreatorCreateInput): AiCreatorUpdateInput {
    const { email: _email, ...update } = payload;
    return update;
  }
}

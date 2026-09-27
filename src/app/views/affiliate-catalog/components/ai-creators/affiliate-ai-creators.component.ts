import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { alert } from '../../../../core/dialogs/ui-dialogs';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AuthService } from '../../../../services/auth.service';
import {
  AffiliateAiCreatorFormContext,
  AffiliateAiCreatorFormResult,
} from '../../forms/affiliate-ai-creator-form-host.component';
import {
  AiCreator,
  AiCreatorGender,
  AiCreatorStyle,
} from '../../models/ai-creator.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

interface StyleOption {
  value: AiCreatorStyle;
  label: string;
}

@Component({
  selector: 'app-affiliate-ai-creators',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './affiliate-ai-creators.component.html',
  styleUrl: './affiliate-ai-creators.component.scss',
})
export class AffiliateAiCreatorsComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);
  private readonly popupService = inject(PopUpService);
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
  error = '';

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
        error: () => {
          this.creators = [];
          this.error = 'Impossibile caricare i creator AI.';
        },
      });
  }

  openCreate(): void {
    if (!this.auth.isAdmin()) return;
    this.openForm({ mode: 'create' });
  }

  openEdit(creator: AiCreator): void {
    if (!this.auth.isAdmin() || !creator?.uid) return;
    this.openForm({ mode: 'edit', creator });
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

  private openForm(context: AffiliateAiCreatorFormContext): void {
    const guid = `affiliate-ai-creator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = context.mode === 'edit' ? 'Modifica creator AI' : 'Nuovo creator AI';

    this.popupService.setNewPopUp(
      guid,
      'AffiliateAiCreatorFormHostComponent',
      context,
      760,
      undefined,
      undefined,
      false,
      true,
      title,
      'center',
      false,
    );

    void this.popupService.getOutputComponent(guid).then((result: AffiliateAiCreatorFormResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      if (result?.name !== 'saved') return;

      this.refresh();
      alert(
        context.mode === 'edit' ? 'Creator AI aggiornato.' : 'Creator AI creato.',
        'Operazione completata',
      );
    });
  }
}

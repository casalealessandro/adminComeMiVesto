import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { finalize } from 'rxjs';
import { FORM_DEFINITION_REPOSITORY } from '../../../core/forms/contracts/form-definition-repository';
import { DynamicFormComponent } from '../../../core/forms/dynamic-form/dynamic-form.component';
import { FormService } from '../../../services/form.service';
import { StaticPage, StaticPageInput } from '../models/static-page.models';
import { StaticPageService } from '../services/static-page.service';

export type StaticPageFormMode = 'create' | 'edit';

export interface StaticPageFormContext {
  mode: StaticPageFormMode;
  page?: StaticPage;
}

export interface StaticPageFormResult {
  name: 'saved' | 'cancelled';
  page?: StaticPage;
}

export interface StaticPageFormEvent {
  name: 'submitForm' | 'cancelForm';
  formData: Record<string, unknown>;
}

export const STATIC_PAGE_FORM = 'staticPageForm';

const normalizedString = (value: unknown): string => String(value ?? '').trim();

export function buildStaticPageInput(formData: Record<string, unknown>): StaticPageInput {
  return {
    slug: normalizedString(formData['slug']),
    title: normalizedString(formData['title']),
    content: normalizedString(formData['content']),
  };
}

export function staticPageErrorMessage(status: number): string {
  if (status === 400) return 'Controlla i dati inseriti nella pagina.';
  if (status === 401 || status === 403) return 'Non sei autorizzato a modificare le pagine statiche.';
  if (status === 404) return 'La pagina non è più disponibile.';
  if (status === 409) return 'Esiste già una pagina con questo slug.';
  if (status === 0) return 'Il backend non è raggiungibile. Riprova tra poco.';
  return 'Operazione sulla pagina non riuscita.';
}

@Component({
  selector: 'app-static-page-form-host',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  providers: [
    {
      provide: FORM_DEFINITION_REPOSITORY,
      useExisting: FormService,
    },
  ],
  templateUrl: './static-page-form-host.component.html',
  styleUrl: './static-page-form-host.component.scss',
})
export class StaticPageFormHostComponent {
  private readonly staticPageService = inject(StaticPageService);

  itemData: StaticPageFormContext = { mode: 'create' };
  @Output() result = new EventEmitter<StaticPageFormResult>();

  saving = false;
  error = '';
  readonly formId = STATIC_PAGE_FORM;

  get editData(): Pick<StaticPage, 'slug' | 'title' | 'content'> | undefined {
    const page = this.itemData.page;
    if (this.itemData.mode !== 'edit' || !page) return undefined;
    return { slug: page.slug, title: page.title, content: page.content };
  }

  handleForm(event: StaticPageFormEvent): void {
    if (event.name === 'cancelForm') {
      if (!this.saving) this.result.emit({ name: 'cancelled' });
      return;
    }
    if (event.name !== 'submitForm' || this.saving) return;

    const input = buildStaticPageInput(event.formData);

    if (!input.slug || !input.title || !input.content) {
      this.error = 'Slug, titolo e contenuto sono obbligatori.';
      return;
    }

    this.saving = true;
    this.error = '';
    const request = this.itemData.mode === 'edit' && this.itemData.page?.id
      ? this.staticPageService.updatePage(this.itemData.page.id, input)
      : this.staticPageService.createPage(input);

    request
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (page) => this.result.emit({ name: 'saved', page }),
        error: (error: HttpErrorResponse) => this.error = staticPageErrorMessage(error.status),
      });
  }
}

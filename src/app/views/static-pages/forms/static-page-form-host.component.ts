import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './static-page-form-host.component.html',
  styleUrl: './static-page-form-host.component.scss',
})
export class StaticPageFormHostComponent {
  private readonly staticPageService = inject(StaticPageService);

  itemData: StaticPageFormContext = { mode: 'create' };
  @Output() result = new EventEmitter<StaticPageFormResult>();

  slug = '';
  title = '';
  content = '';
  saving = false;
  error = '';
  private initializedForId = '';

  get isEdit(): boolean {
    return this.itemData.mode === 'edit';
  }

  ngDoCheck(): void {
    const page = this.itemData.page;
    const key = this.isEdit ? page?.id || '' : 'create';
    if (!key || key === this.initializedForId) return;
    this.initializedForId = key;
    this.slug = page?.slug || '';
    this.title = page?.title || '';
    this.content = page?.content || '';
  }

  cancel(): void {
    if (!this.saving) this.result.emit({ name: 'cancelled' });
  }

  save(): void {
    if (this.saving) return;

    const input: StaticPageInput = {
      slug: this.slug.trim(),
      title: this.title.trim(),
      content: this.content.trim(),
    };

    if (!input.slug || !input.title || !input.content) {
      this.error = 'Slug, titolo e contenuto sono obbligatori.';
      return;
    }

    this.saving = true;
    this.error = '';
    const request = this.isEdit && this.itemData.page?.id
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

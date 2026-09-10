import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import {
  AffiliateCatalogAudit,
  ComeMiVestoAuditCategory,
} from '../../models/affiliate-catalog-audit.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

export function auditPercentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

@Component({
  selector: 'app-affiliate-catalog-audit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './affiliate-catalog-audit.component.html',
  styleUrl: './affiliate-catalog-audit.component.scss',
})
export class AffiliateCatalogAuditComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  audit: AffiliateCatalogAudit | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (this.loading) return;

    this.loading = true;
    this.error = '';

    this.affiliateCatalogService.getCatalogAudit()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (audit) => this.audit = audit,
        error: () => {
          this.audit = null;
          this.error = 'Impossibile caricare l’analisi del catalogo affiliato.';
        },
      });
  }

  percentage(value: number, total: number): number {
    return auditPercentage(value, total);
  }

  categoryLabel(value: string): string {
    return value?.trim() || 'Senza categoria';
  }

  subcategoryLabel(value: string): string {
    return value?.trim() || 'Senza sottocategoria';
  }

  taxonomyGender(category: ComeMiVestoAuditCategory): string {
    return category.gender?.map((value) => String(value)).filter(Boolean).join(', ') || '—';
  }

  taxonomyStatus(category: ComeMiVestoAuditCategory): string {
    if (category.status === true) return 'Attiva';
    if (category.status === false) return 'Inattiva';
    if (typeof category.status === 'string' && category.status.trim()) return category.status;
    return '—';
  }

  taxonomyStatusClass(category: ComeMiVestoAuditCategory): string {
    if (category.status === true || String(category.status).toLowerCase() === 'active') return 'text-bg-success';
    if (category.status === false || String(category.status).toLowerCase() === 'inactive') return 'text-bg-secondary';
    return 'text-bg-light';
  }

  get rootCategories(): ComeMiVestoAuditCategory[] {
    return this.audit?.comeMiVestoCategories.filter((category) => !category.parentCategory) ?? [];
  }

  childrenFor(parentId: string): ComeMiVestoAuditCategory[] {
    return this.audit?.comeMiVestoCategories.filter((category) => category.parentCategory === parentId) ?? [];
  }

  get orphanCategories(): ComeMiVestoAuditCategory[] {
    const categories = this.audit?.comeMiVestoCategories ?? [];
    const ids = new Set(categories.map((category) => category.id));
    return categories.filter((category) => category.parentCategory && !ids.has(category.parentCategory));
  }
}

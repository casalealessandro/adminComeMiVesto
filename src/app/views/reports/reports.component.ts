import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Report, ReportResolution, ReportService, ReportStatus } from '../../services/report.service';
import { confirm } from '../../widgets/ui-dialogs';

@Component({ standalone: true, selector: 'app-reports', imports: [CommonModule, FormsModule], templateUrl: './reports.component.html', styleUrl: './reports.component.scss' })
export class ReportsComponent {
  private readonly api = inject(ReportService);
  reports: Report[] = [];
  selected?: Report;
  selectedStatus: ReportStatus = 'pending';
  selectedResolution?: ReportResolution;
  loading = false;
  error = '';

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.api.list().subscribe({ next: reports => { this.reports = reports; this.loading = false; }, error: () => { this.error = 'Impossibile caricare le segnalazioni.'; this.loading = false; } });
  }
  detail(report: Report): void {
    this.api.detail(report.id).subscribe({ next: value => { this.selected = value; this.selectedStatus = value.status || 'pending'; this.selectedResolution = value.resolution; this.normalizeResolution(); }, error: () => this.error = 'Segnalazione non trovata.' });
  }
  normalizeResolution(): void {
    if (this.selectedStatus === 'pending') this.selectedResolution = undefined;
    if (this.selectedStatus === 'dismissed') this.selectedResolution = 'no_violation';
  }
  save(): void {
    if (!this.selected) return;
    if (this.selectedStatus === 'resolved' && !this.selectedResolution) { this.error = 'Seleziona una risoluzione.'; return; }
    this.loading = true;
    this.api.update(this.selected.id, this.selectedStatus, this.selectedResolution).subscribe({ next: () => { this.selected = undefined; this.load(); }, error: () => { this.error = 'Aggiornamento non riuscito.'; this.loading = false; } });
  }
  remove(report: Report): void { confirm('Eliminare definitivamente la segnalazione?', 'Conferma', yes => yes && this.api.delete(report.id).subscribe({ next: () => this.reports = this.reports.filter(item => item.id !== report.id), error: () => this.error = 'Eliminazione non riuscita.' })); }
}

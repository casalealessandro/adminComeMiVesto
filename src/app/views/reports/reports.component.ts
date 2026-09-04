import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Report, ReportResolution, ReportService, ReportStatus } from '../../services/report.service';
import { confirm } from '../../widgets/ui-dialogs';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne } from '../../interface/app.interface';

@Component({ standalone: true, selector: 'app-reports', imports: [CommonModule, FormsModule, DataGridComponent], templateUrl: './reports.component.html', styleUrl: './reports.component.scss' })
export class ReportsComponent {
  private readonly api = inject(ReportService);
  reports: Report[] = [];
  selected?: Report;
  selectedStatus: ReportStatus = 'pending';
  selectedResolution?: ReportResolution;
  loading = false;
  error = '';
  readonly columns: Colonne[] = [{ itemType: 'group', groupDataField: '', data: [
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'typeSegnaletion', colWidth: '170', colCaption: 'Tipo', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'reason', colWidth: '320', colCaption: 'Motivo', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'status', colWidth: '110', colCaption: 'Stato', edit: false, groupDataField: undefined },
    { type: 'campoDateTime', colVisible: true, allowEditing: false, dataField: 'createdAt', colWidth: '150', colCaption: 'Creazione', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'outFitId', colWidth: '190', colCaption: 'Outfit', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'userIdSegnalation', colWidth: '190', colCaption: 'Segnalato da', edit: false, groupDataField: undefined },
    { type: 'campoButton', colVisible: true, allowEditing: false, dataField: '', colWidth: '70', colCaption: 'Elimina', edit: false, groupDataField: undefined, button: { text: '', name: 'delete', event: 'delete', icon: 'mdi mdi-trash-can-outline', hint: 'Elimina' } }
  ] }];

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
  gridDetail(event: any): void { if (event?.cancel !== undefined) event.cancel = true; const report = event?.data || event?.rowData || event; if (report) this.detail(report); }
  gridAction(event: any): void { if (event?.name === 'delete' && event.rowData) this.remove(event.rowData); }
}

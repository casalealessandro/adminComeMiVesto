import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DashboardActivityType, DashboardService, DashboardSummary } from '../../services/dashboard.service';
import { DashboardStatCardComponent } from './components/dashboard-stat-card/dashboard-stat-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AnagraficaWrapperComponent, DashboardStatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(false);

    this.dashboardService.getSummary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: () => {
          this.summary.set(null);
          this.error.set(true);
        },
      });
  }

  activityIcon(type: DashboardActivityType): string {
    switch (type) {
      case 'user': return 'mdi-account-plus-outline';
      case 'outfit': return 'mdi-hanger';
      case 'report': return 'mdi-alert-circle-outline';
    }
  }

  activityRoute(type: DashboardActivityType): string {
    switch (type) {
      case 'user': return '/utenti';
      case 'outfit': return '/outfit-list';
      case 'report': return '/reports';
    }
  }
}

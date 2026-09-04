import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-stat-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-stat-card.component.html',
  styleUrl: './dashboard-stat-card.component.scss',
})
export class DashboardStatCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: number | string = 0;
  @Input() meta = '';
  @Input() icon = 'mdi-chart-box-outline';
  @Input() route = '/dashboard';
  @Input() tone: 'primary' | 'success' | 'warning' | 'danger' = 'primary';
}

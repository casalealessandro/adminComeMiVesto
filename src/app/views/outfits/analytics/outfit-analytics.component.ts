import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface Analytics {
  total: number;
  byGender: Record<string, number>;
  byStyle: Record<string, number>;
  byOccasion: Record<string, number>;
  byOccasionAndGender: Record<string, Record<string, number>>;
  generatedAt: number;
}

@Component({
  selector: 'app-outfit-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outfit-analytics.component.html',
  styleUrl: './outfit-analytics.component.scss'
})
export class OutfitAnalyticsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  data: Analytics | null = null;
  loading = false;
  error = '';

  ngOnInit(): void { void this.reload(); }

  async reload(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    try {
      const result = await firstValueFrom(
        this.http.get<{ data: Analytics }>(`${environment.apiBaseUrl}/admin/outfits/analytics`)
      );
      this.data = result.data;
    } catch {
      this.error = 'Impossibile caricare le statistiche degli outfit.';
    } finally {
      this.loading = false;
    }
  }

  entries(group: Record<string, number> | undefined): { label: string; count: number }[] {
    return Object.entries(group || {})
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  genders(data: Analytics): string[] {
    return Object.keys(data.byGender).sort((a, b) => a.localeCompare(b));
  }

  coverage(data: Analytics, occasion: string, gender: string): number {
    return data.byOccasionAndGender[occasion]?.[gender] || 0;
  }

  percent(count: number, total: number): number {
    return total > 0 ? count / total * 100 : 0;
  }
}

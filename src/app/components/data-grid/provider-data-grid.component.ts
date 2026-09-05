import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { CustomScrollbarComponent } from '../custom-scrollbar/custom-scrollbar.component';
import { GridDataProvider } from './data-grid-provider';
import { DataGridComponent } from './data-grid.component';
import { TdItemComponent } from './td-item/td-item.component';

/**
 * Conservative bridge for recovering provider-neutral remote loading without
 * changing the existing DataGridComponent runtime yet.
 *
 * It deliberately reuses the current DataGrid template, styles and behavior.
 * When no provider is supplied, the inherited legacy remote path is preserved.
 */
@Component({
  selector: 'app-provider-data-grid',
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TdItemComponent,
    CustomScrollbarComponent,
  ],
})
export class ProviderDataGridComponent<T = any> extends DataGridComponent {
  @Input() dataProvider?: GridDataProvider<T>;

  remoteContinuation?: unknown;
  remoteHasMore = false;

  override buildAndTestQueryString(): Promise<boolean> {
    if (this.dataProvider) {
      return Promise.resolve(true);
    }

    return super.buildAndTestQueryString();
  }

  override async loadRemoteRecords(): Promise<boolean> {
    if (!this.dataProvider) {
      return super.loadRemoteRecords();
    }

    this.isLoading = true;

    try {
      const page = await this.dataProvider.load({
        pageSize: this.pageSize,
      });

      this.rowsData.set([...page.items]);
      this.totalRecords = page.totalCount ?? page.items.length;
      this.remoteContinuation = page.continuation;
      this.remoteHasMore = page.hasMore;
      this.showNullData = page.items.length === 0;

      return true;
    } catch {
      return false;
    } finally {
      this.isLoading = false;
    }
  }
}

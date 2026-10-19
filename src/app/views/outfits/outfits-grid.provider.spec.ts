import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { outfit } from '../../services/outfit.service';
import { OutfitsGridProvider } from './outfits-grid.provider';

describe('OutfitsGridProvider', () => {
  let provider: OutfitsGridProvider;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OutfitsGridProvider, provideHttpClient(), provideHttpClientTesting()]
    });
    provider = TestBed.inject(OutfitsGridProvider);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('forwards the provider-neutral filter/search/sort and continuation', async () => {
    const request = {
      pageSize: 50, continuation: '50',
      search: { value: 'blazer', conditions: [{ field: 'title', operator: 'contains' as const, value: 'blazer' }] },
      filters: [{ field: 'status', operator: 'eq' as const, value: 'approved' }],
      sort: [{ field: 'createdAt', direction: 'desc' as const }]
    };
    const result = provider.load(request);
    const pending = http.expectOne(`${environment.apiBaseUrl}/admin/outfits/grid`);
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).toEqual(request);
    pending.flush({ items: [{ id: 'a', title: 'Blazer' }], hasMore: false, totalCount: 51 });
    expect((await result).items[0].id).toBe('a');
  });

  it('deletes only selected outfit ids using the bulk endpoint', async () => {
    const result = provider.deleteMany([{id:'a'},{id:'b'}] as outfit[]);
    const pending = http.expectOne(`${environment.apiBaseUrl}/admin/outfits/bulk-delete`);
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).toEqual({ ids: ['a','b'] });
    pending.flush({ deleted: 2 });
    await expectAsync(result).toBeResolved();
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AffiliateFeedCreateInput } from '../models/affiliate-catalog-api.models';
import { AffiliateCatalogService } from './affiliate-catalog.service';

describe('Affiliate feed creation mapping contract', () => {
  let service: AffiliateCatalogService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/admin/affiliate`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AffiliateCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('keeps source values returned by the existing feed creation endpoint', () => {
    const input: AffiliateFeedCreateInput = {
      networkFeedId: '44191',
      affiliateProgramId: 'program-1',
      name: 'Pull&Bear',
      enabled: true,
      adapterType: 'PULL_BEAR',
      readMode: 'WHOLE_FEED',
      locale: 'it-IT',
      market: 'IT',
      rules: '',
      rulesMapper: '',
    };
    let response: any;

    service.createFeed(input).subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/feeds`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({
      data: { id: 'feed-1', ...input },
      sourceValues: {
        recordsRead: 2,
        recordsNormalized: 2,
        categories: ['Jeans', 'T-Shirts'],
        colors: ['Black'],
        genders: ['female'],
      },
      sourceValuesError: null,
    });

    expect(response.sourceValues.categories).toEqual(['Jeans', 'T-Shirts']);
    expect(response.data.networkFeedId).toBe('44191');
  });

  it('uses the existing update endpoint to load source values for an already-created feed', () => {
    let response: any;
    service.updateFeedWithSourceValues('feed-1', { rules: '{"version":1}' })
      .subscribe((value) => response = value);

    const request = http.expectOne((candidate) =>
      candidate.url === `${baseUrl}/feeds/feed-1`
      && candidate.params.get('sourceValues') === 'true',
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ rules: '{"version":1}' });
    request.flush({
      data: { id: 'feed-1', networkFeedId: '44191', rules: '{"version":1}', rulesMapper: '' },
      sourceValues: {
        recordsRead: 1,
        recordsNormalized: 1,
        categories: ['Jeans'],
        colors: ['Black'],
        genders: ['female'],
      },
      sourceValuesError: null,
    });

    expect(response.sourceValues.categories).toEqual(['Jeans']);
  });

  it('loads ComeMiVesto colors from the existing taxonomy endpoint', () => {
    let response: any;
    service.getOutfitColors().subscribe((value) => response = value);

    const request = http.expectOne(`${environment.apiBaseUrl}/gen/outfitColors`);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'N', value: 'Nero', parent: null, hex: '#000000' }]);

    expect(response).toEqual([{ id: 'N', value: 'Nero', parent: null, hex: '#000000' }]);
  });
});

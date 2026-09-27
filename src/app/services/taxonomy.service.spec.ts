import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { OutfitStyle, TaxonomyService } from './taxonomy.service';

describe('TaxonomyService styles', () => {
  let service: TaxonomyService;
  let http: HttpTestingController;
  const url = `${environment.apiBaseUrl}/gen/outfitStyles`;
  const style: OutfitStyle = { id: 'C', value: 'Casual', parent: null, order: 10, gender: ['U'] };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TaxonomyService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('normalizes a direct array response', () => { service.getStyles().subscribe(value => expect(value).toEqual([style])); http.expectOne(url).flush([style]); });
  it('normalizes a data response', () => { service.getStyles().subscribe(value => expect(value).toEqual([style])); http.expectOne(url).flush({ data: [style] }); });
  it('creates at the styles endpoint', () => { service.createStyle(style).subscribe(); const request = http.expectOne(url); expect(request.request.method).toBe('POST'); request.flush({}); });
  it('updates the encoded style endpoint', () => { service.updateStyle('A/B', { value: 'Casual', parent: null, order: 10, gender: ['U'] }).subscribe(); const request = http.expectOne(`${url}/A%2FB`); expect(request.request.method).toBe('PUT'); request.flush({}); });
  it('deletes at the encoded style endpoint', () => { service.deleteStyle('A/B').subscribe(); const request = http.expectOne(`${url}/A%2FB`); expect(request.request.method).toBe('DELETE'); request.flush({}); });
});

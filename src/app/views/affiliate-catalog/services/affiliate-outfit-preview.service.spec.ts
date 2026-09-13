import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AiOutfitPreviewRequest, AiOutfitPreviewResult } from '../models/affiliate-catalog-api.models';
import { AffiliateCatalogService } from './affiliate-catalog.service';

describe('AffiliateCatalogService AI outfit preview', () => {
  let service: AffiliateCatalogService;
  let http: HttpTestingController;
  const endpoint = `${environment.apiBaseUrl}/admin/affiliate/outfit-generator/preview`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AffiliateCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the exact canonical request and unwraps the preview data', () => {
    const input: AiOutfitPreviewRequest = {
      gender: 'MAN',
      season: 'SPRING',
      occasion: 'EVERYDAY',
      style: 'CASUAL',
    };
    const result: AiOutfitPreviewResult = {
      generatedAt: 1,
      model: 'gpt-5.6-terra',
      providerResponseId: 'resp-1',
      request: input,
      candidatesEvaluated: 36,
      imagesEvaluated: 36,
      usage: {
        inputTokens: 100,
        outputTokens: 100,
        totalTokens: 200,
        stylist: { inputTokens: 60, outputTokens: 10, totalTokens: 70 },
        imageGeneration: {
          inputTokens: 40,
          outputTokens: 90,
          totalTokens: 130,
          model: 'gpt-image-2.5-sunburst',
          imagesGenerated: 3,
          providerResponseIds: ['img-1', 'img-2', 'img-3'],
        },
      },
      outfits: [],
    };

    let response: AiOutfitPreviewResult | undefined;
    service.generateOutfitPreview(input).subscribe((value) => response = value);

    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ data: result });

    expect(response).toEqual(result);
  });
});

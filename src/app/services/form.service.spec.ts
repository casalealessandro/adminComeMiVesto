import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormService, parseFields } from './form.service';
import { environment } from '../../environments/environment';

describe('parseFields', () => {
  const legacy: any = { name: 'x', type: 'textBox', typeInput: 'text', label: 'X', maxlength: 12 };
  it('normalizes arrays and JSON array strings', () => {
    expect(parseFields([legacy])[0].maxLength).toBe(12);
    expect(parseFields(JSON.stringify([legacy]))[0].maxLength).toBe(12);
  });
  it('returns an empty array for invalid JSON, valid non-arrays, null, undefined, and objects', () => {
    for (const value of ['not-json', '{"name":"x"}', null, undefined, { name: 'x' }]) expect(parseFields(value)).toEqual([]);
  });
  it('does not support the stale max_length spelling', () => {
    expect(parseFields('[{"type":"textBox","max_length":12}]')[0].maxLength).toBeUndefined();
  });
});

describe('FormService HTTP contract', () => {
  let service: FormService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/gen/forms`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FormService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('GETs forms, maps response.data and parses json', () => {
    let result: any;
    service.getForms().subscribe(value => result = value);
    const request = http.expectOne(base); expect(request.request.method).toBe('GET');
    request.flush({ data: [{ id: 'a', nameForm: 'A', json: '[{"name":"x","maxlength":4}]' }] });
    expect(result[0].json[0].maxLength).toBe(4);
  });
  it('GETs an encoded id and maps the response.data backend shape', () => {
    let result: any;
    service.getFormById('a/b').subscribe(value => result = value);
    http.expectOne(`${base}/a%2Fb`).flush({ data: { id: 'db', nameForm: 'Name', json: [] } });
    expect(result).toEqual({ id: 'db', nameForm: 'Name', json: [] });
  });
  it('characterizes the fallback response shape and default identity values', () => {
    let result: any;
    service.getFormById('fallback').subscribe(value => result = value);
    http.expectOne(`${base}/fallback`).flush({ json: [] });
    expect(result).toEqual({ id: 'fallback', nameForm: 'fallback', json: [] });
  });
  it('getFormFields exposes only form.json', () => {
    let result: any;
    service.getFormFields('a').subscribe(value => result = value);
    http.expectOne(`${base}/a`).flush({ data: { id: 'a', nameForm: 'A', json: '[{"name":"x"}]' } });
    expect(result).toEqual([{ name: 'x' }]);
  });
  it('POSTs normalized create payload for new and missing-id forms', async () => {
    for (const [formId, form] of [['new', { id: 'generated', nameForm: 'A', json: [] }], ['candidate', { nameForm: 'B', json: [] }]] as any[]) {
      const promise = service.saveForm(formId, form);
      const request = http.expectOne(base); expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ id: form.id || formId, nameForm: form.nameForm, json: [] });
      request.flush({ ok: true }); await promise;
    }
  });
  it('PUTs update payload without the technical id', async () => {
    const promise = service.saveForm('a/b', { id: 'a/b', nameForm: 'A', json: [] });
    const request = http.expectOne(`${base}/a%2Fb`); expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ nameForm: 'A', json: [] }); request.flush({}); await promise;
  });
  it('DELETEs an encoded form id', async () => {
    const promise = service.deleteForm('a/b');
    const request = http.expectOne(`${base}/a%2Fb`); expect(request.request.method).toBe('DELETE'); request.flush({}); await promise;
  });
  it('composes getData as /gen/{api}{queryString}', async () => {
    const promise = service.getData('cities', '/IT');
    const request = http.expectOne(`${environment.apiBaseUrl}/gen/cities/IT`); expect(request.request.method).toBe('GET');
    request.flush([{ id: 1 }]); expect(await promise).toEqual([{ id: 1 }]);
  });
});

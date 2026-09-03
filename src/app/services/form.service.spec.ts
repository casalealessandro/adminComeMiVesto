import { TestBed } from '@angular/core/testing';

import { FormService, parseFields } from './form.service';
import { provideHttpClient } from '@angular/common/http';

describe('FormService', () => {
  let service: FormService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(FormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('normalizes legacy string payloads defensively', () => {
    expect(parseFields('[{"type":"textBox","max_length":12}]')[0].maxLength).toBe(12);
    expect(parseFields('not-json')).toEqual([]);
  });
});

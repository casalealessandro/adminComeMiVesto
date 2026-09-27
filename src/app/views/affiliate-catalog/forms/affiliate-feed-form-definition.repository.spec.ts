import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AffiliateCatalogService } from '../services/affiliate-catalog.service';
import { AffiliateProgram } from '../models/affiliate-catalog.models';
import {
  AFFILIATE_FEED_CREATE_FORM,
  AFFILIATE_FEED_EDIT_FORM,
  AffiliateFeedFormDefinitionRepository,
  buildAffiliateFeedFormDefinitions,
} from './affiliate-feed-form-definition.repository';

describe('Affiliate feed form definitions', () => {
  const program: AffiliateProgram = {
    id: 'program-1',
    network: 'TRADEDOUBLER',
    networkProgramId: '12345',
    name: 'Programma demo',
    networkStatus: 'ACTIVE',
    enabled: true,
    defaultAdapterType: 'TRADEDOUBLER',
    market: 'IT',
    currency: 'EUR',
    priceSegment: 'MID_RANGE',
    createdAt: 1,
    updatedAt: 1,
  };

  it('keeps identity fields create-only and uses actual programs as local options', () => {
    const [create, edit] = buildAffiliateFeedFormDefinitions([program]);
    const createNames = create.json.map((field) => field.name);
    const editNames = edit.json.map((field) => field.name);
    const programField = create.json.find((field) => field.name === 'affiliateProgramId');

    expect(createNames).toContain('networkFeedId');
    expect(createNames).toContain('affiliateProgramId');
    expect(editNames).not.toContain('networkFeedId');
    expect(editNames).not.toContain('affiliateProgramId');
    expect(programField?.selectOptions?.remote).toBeFalse();
    expect(programField?.selectOptions?.options).toEqual([
      { label: 'Programma demo · 12345', value: 'program-1' },
    ]);
  });

  it('keeps import rules in create and exposes raw rulesMapper only in edit', () => {
    const [create, edit] = buildAffiliateFeedFormDefinitions([program]);
    const createRules = create.json.find((field) => field.name === 'rules');
    const createMapper = create.json.find((field) => field.name === 'rulesMapper');
    const editRules = edit.json.find((field) => field.name === 'rules');
    const editMapper = edit.json.find((field) => field.name === 'rulesMapper');

    expect(createRules?.type).toBe('textArea');
    expect(createMapper).toBeUndefined();
    expect(editRules?.type).toBe('textArea');
    expect(editMapper?.type).toBe('textArea');
  });

  it('uses real booleans and the exact supported read modes', () => {
    const [create] = buildAffiliateFeedFormDefinitions([program]);
    const enabled = create.json.find((field) => field.name === 'enabled');
    const readMode = create.json.find((field) => field.name === 'readMode');

    expect(enabled?.selectOptions?.options).toEqual([
      { label: 'Sì', value: true },
      { label: 'No', value: false },
    ]);
    expect(readMode?.selectOptions?.options?.map((option) => option.value)).toEqual([
      'WHOLE_FEED',
      'PAGINATED',
    ]);
  });

  it('loads programs through AffiliateCatalogService for the create definition', (done) => {
    const service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', ['getPrograms']);
    service.getPrograms.and.returnValue(of([program]));

    TestBed.configureTestingModule({
      providers: [
        AffiliateFeedFormDefinitionRepository,
        { provide: AffiliateCatalogService, useValue: service },
      ],
    });

    const repository = TestBed.inject(AffiliateFeedFormDefinitionRepository);
    repository.getFormById(AFFILIATE_FEED_CREATE_FORM).subscribe((definition) => {
      expect(service.getPrograms).toHaveBeenCalled();
      expect(definition.id).toBe(AFFILIATE_FEED_CREATE_FORM);
      done();
    });
  });

  it('does not load programs for the edit definition', (done) => {
    const service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', ['getPrograms']);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AffiliateFeedFormDefinitionRepository,
        { provide: AffiliateCatalogService, useValue: service },
      ],
    });

    const repository = TestBed.inject(AffiliateFeedFormDefinitionRepository);
    repository.getFormById(AFFILIATE_FEED_EDIT_FORM).subscribe((definition) => {
      expect(service.getPrograms).not.toHaveBeenCalled();
      expect(definition.id).toBe(AFFILIATE_FEED_EDIT_FORM);
      done();
    });
  });
});

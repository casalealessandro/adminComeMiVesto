import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AffiliateAiCreatorsComponent } from './affiliate-ai-creators.component';

describe('AffiliateAiCreatorsComponent', () => {
  let fixture: ComponentFixture<AffiliateAiCreatorsComponent>;
  let component: AffiliateAiCreatorsComponent;
  let service: jasmine.SpyObj<AffiliateCatalogService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<AffiliateCatalogService>(
      'AffiliateCatalogService',
      ['getAiCreators', 'createAiCreator', 'updateAiCreator'],
    );
    service.getAiCreators.and.returnValue(of([]));
    service.createAiCreator.and.callFake((input) => of({
      uid: 'creator-1',
      ...input,
      photoURL: input.photoURL || '',
      createdAt: 1,
      updatedAt: 1,
    }));
    service.updateAiCreator.and.callFake((uid, input) => of({
      uid,
      email: 'creator@example.com',
      displayName: input.displayName || 'Creator',
      nome: input.nome || 'Nome',
      cognome: input.cognome || 'Cognome',
      bio: input.bio || 'Bio',
      photoURL: input.photoURL || '',
      gender: input.gender || 'D',
      styleAffinity: input.styleAffinity || ['C'],
      personaPrompt: input.personaPrompt || 'Persona',
      active: input.active ?? true,
      createdAt: 1,
      updatedAt: 2,
    }));

    await TestBed.configureTestingModule({
      imports: [AffiliateAiCreatorsComponent],
      providers: [
        { provide: AffiliateCatalogService, useValue: service },
        { provide: AuthService, useValue: { isAdmin: () => true } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AffiliateAiCreatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the managed creator list on init', () => {
    expect(service.getAiCreators).toHaveBeenCalled();
    expect(component.creators).toEqual([]);
  });

  it('creates a real creator payload and keeps at least one style affinity', () => {
    component.openCreate();
    Object.assign(component.draft, {
      email: 'creator@example.com',
      displayName: 'Creator Donna',
      nome: 'Creator',
      cognome: 'Donna',
      bio: 'Virtual fashion creator di ComeMiVesto.',
      gender: 'D',
      styleAffinity: ['C', 'SC'],
      personaPrompt: 'Casual contemporaneo e smart casual.',
      active: true,
    });
    component.save();

    expect(service.createAiCreator).toHaveBeenCalledWith(jasmine.objectContaining({
      email: 'creator@example.com',
      gender: 'D',
      styleAffinity: ['C', 'SC'],
    }));
    expect(component.creators[0].uid).toBe('creator-1');
  });

  it('does not allow removing the last style affinity', () => {
    component.draft.styleAffinity = ['C'];
    component.toggleStyle('C');
    expect(component.draft.styleAffinity).toEqual(['C']);
  });
});

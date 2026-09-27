import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AuthService } from '../../../../services/auth.service';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AffiliateAiCreatorsComponent } from './affiliate-ai-creators.component';

describe('AffiliateAiCreatorsComponent', () => {
  let fixture: ComponentFixture<AffiliateAiCreatorsComponent>;
  let component: AffiliateAiCreatorsComponent;
  let service: jasmine.SpyObj<AffiliateCatalogService>;
  let popup: jasmine.SpyObj<PopUpService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<AffiliateCatalogService>(
      'AffiliateCatalogService',
      ['getAiCreators'],
    );
    popup = jasmine.createSpyObj<PopUpService>(
      'PopUpService',
      ['setNewPopUp', 'getOutputComponent', 'destroyCurrentOpenPopUpByGuid'],
    );

    service.getAiCreators.and.returnValue(of([]));
    popup.getOutputComponent.and.returnValue(new Promise(() => {}));

    await TestBed.configureTestingModule({
      imports: [AffiliateAiCreatorsComponent],
      providers: [
        { provide: AffiliateCatalogService, useValue: service },
        { provide: PopUpService, useValue: popup },
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

  it('opens the DynamicForm host for a new creator', () => {
    component.openCreate();

    expect(popup.setNewPopUp).toHaveBeenCalled();
    const args = popup.setNewPopUp.calls.mostRecent().args;
    expect(args[1]).toBe('AffiliateAiCreatorFormHostComponent');
    expect(args[2]).toEqual({ mode: 'create' });
    expect(args[3]).toBe(760);
  });

  it('opens the DynamicForm host with edit data for an existing creator', () => {
    const creator = {
      uid: 'creator-1',
      email: 'creator@example.com',
      displayName: 'Creator Donna',
      nome: 'Creator',
      cognome: 'Donna',
      bio: 'Virtual fashion creator',
      photoURL: '',
      gender: 'D' as const,
      styleAffinity: ['C' as const, 'SC' as const],
      personaPrompt: 'Casual contemporaneo.',
      active: true,
      createdAt: 1,
      updatedAt: 1,
    };

    component.openEdit(creator);

    const args = popup.setNewPopUp.calls.mostRecent().args;
    expect(args[1]).toBe('AffiliateAiCreatorFormHostComponent');
    expect(args[2]).toEqual({ mode: 'edit', creator });
  });

  it('keeps creator labels aligned with canonical values', () => {
    expect(component.genderLabel('D')).toBe('Donna');
    expect(component.genderLabel('U')).toBe('Uomo');
    expect(component.styleLabel('SC')).toBe('Smart casual');
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AuthService } from '../../../../services/auth.service';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AffiliateFashionEnrichmentComponent } from './affiliate-fashion-enrichment.component';

describe('Intelligenza Fashion page', () => {
  it('shows only visual analysis and loads no retired panels on first visit', async () => {
    const service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
      'getCurationCategories', 'getFashionOverview', 'getFeeds', 'getPrograms',
    ]);
    service.getCurationCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AffiliateFashionEnrichmentComponent],
      providers: [
        { provide: AffiliateCatalogService, useValue: service },
        { provide: AuthService, useValue: { isAdmin: () => true } },
        { provide: PopUpService, useValue: { setNewPopUp: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AffiliateFashionEnrichmentComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('#fashion-vision-title')?.textContent).toContain('Analisi visiva per categoria');
    expect(root.querySelector('#fashion-vision-category')).not.toBeNull();
    expect(root.querySelector('#fashion-ai-title')).toBeNull();
    expect(root.querySelector('.fashion-overview__kpis')).toBeNull();
    expect(root.textContent).not.toContain('Ricalcola panoramica');
    expect(root.textContent).not.toContain('Copertura per merchant');

    expect(service.getCurationCategories).toHaveBeenCalled();
    expect(service.getFashionOverview).not.toHaveBeenCalled();
    expect(service.getFeeds).not.toHaveBeenCalled();
    expect(service.getPrograms).not.toHaveBeenCalled();
  });
});

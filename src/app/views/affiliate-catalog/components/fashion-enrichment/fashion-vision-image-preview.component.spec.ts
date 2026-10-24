import { TestBed } from '@angular/core/testing';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AuthService } from '../../../../services/auth.service';
import { comeMiVestoPopupComponents } from '../../../../app-popup-components';
import { FashionVisionReviewRow } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AffiliateFashionEnrichmentComponent } from './affiliate-fashion-enrichment.component';
import { FashionVisionImagePreviewComponent } from './fashion-vision-image-preview.component';

describe('Fashion vision image preview', () => {
  let popup: jasmine.SpyObj<PopUpService>;
  let component: AffiliateFashionEnrichmentComponent;
  const row = {
    productId: 'product-1',
    image: 'https://merchant.example/product.jpg',
    name: 'Trench lungo',
  } as FashionVisionReviewRow;

  beforeEach(() => {
    popup = jasmine.createSpyObj<PopUpService>('PopUpService', ['setNewPopUp']);
    TestBed.configureTestingModule({
      providers: [
        { provide: PopUpService, useValue: popup },
        { provide: AffiliateCatalogService, useValue: {} },
        { provide: AuthService, useValue: { isAdmin: () => true } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new AffiliateFashionEnrichmentComponent());
  });

  it('registers an application image host with the existing Popup Core', () => {
    expect(comeMiVestoPopupComponents.some(entry =>
      entry.name === 'FashionVisionImagePreviewComponent' &&
      entry.component === FashionVisionImagePreviewComponent,
    )).toBeTrue();
  });

  it('opens the Core popup instead of a new tab on mobile', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const event = new MouseEvent('click', { cancelable: true });

    component.openVisionImageOnMobile(event, row);

    expect(event.defaultPrevented).toBeTrue();
    expect(popup.setNewPopUp).toHaveBeenCalledWith(
      'fashion-vision-image-preview',
      'FashionVisionImagePreviewComponent',
      { image: row.image, name: row.name },
      900, undefined, undefined, false, true, row.name, 'center', true,
    );
  });

  it('keeps the existing merchant image link on desktop', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const event = new MouseEvent('click', { cancelable: true });

    component.openVisionImageOnMobile(event, row);

    expect(event.defaultPrevented).toBeFalse();
    expect(popup.setNewPopUp).not.toHaveBeenCalled();
  });

  it('does not open the popup without an image', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const event = new MouseEvent('click', { cancelable: true });

    component.openVisionImageOnMobile(event, { ...row, image: '' });

    expect(event.defaultPrevented).toBeTrue();
    expect(popup.setNewPopUp).not.toHaveBeenCalled();
  });

  it('shows the merchant image with an accessible description', () => {
    const fixture = TestBed.createComponent(FashionVisionImagePreviewComponent);
    fixture.componentInstance.itemData = { image: row.image, name: row.name };
    fixture.detectChanges();

    const img: HTMLImageElement | null = fixture.nativeElement.querySelector('img');
    expect(img?.getAttribute('src')).toBe(row.image);
    expect(img?.getAttribute('alt')).toBe(row.name);
  });
});

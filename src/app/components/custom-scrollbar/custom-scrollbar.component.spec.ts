import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayService } from '../../services/overlay.service';
import { CloseOverlayOnScrollDirective } from './close-overlay-on-scroll.directive';
import { CustomScrollbarComponent } from './custom-scrollbar.component';

@Component({
  standalone: true,
  imports: [CustomScrollbarComponent, CloseOverlayOnScrollDirective],
  template: `
    <app-custom-scrollbar [scrollHeigth]="height">
      <span class="projected-content">Projected</span>
    </app-custom-scrollbar>

    <app-custom-scrollbar class="policy-scrollbar" appCloseOverlayOnScroll>
      <span>Policy</span>
    </app-custom-scrollbar>
  `
})
class CustomScrollbarHostComponent {
  height = 500;
}

describe('CustomScrollbarComponent F.3 boundary', () => {
  let fixture: ComponentFixture<CustomScrollbarHostComponent>;
  let overlayService: jasmine.SpyObj<OverlayService>;

  beforeEach(async () => {
    overlayService = jasmine.createSpyObj<OverlayService>('OverlayService', ['closeOverlay']);

    await TestBed.configureTestingModule({
      imports: [CustomScrollbarHostComponent],
      providers: [{ provide: OverlayService, useValue: overlayService }]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomScrollbarHostComponent);
    fixture.detectChanges();
  });

  it('projects content into the scroll container', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.projected-content')?.textContent).toContain('Projected');
  });

  it('applies scrollHeigth as the max-height in pixels', () => {
    const container = (fixture.nativeElement as HTMLElement).querySelector('.scrollbar-container') as HTMLElement;
    expect(container.style.maxHeight).toBe('500px');
  });

  it('emits scroll without closing overlays by itself', () => {
    const containers = (fixture.nativeElement as HTMLElement).querySelectorAll('.scrollbar-container');
    const genericContainer = containers[0] as HTMLElement;

    genericContainer.dispatchEvent(new Event('scroll'));

    expect(overlayService.closeOverlay).not.toHaveBeenCalled();
  });

  it('closes overlays only when the explicit policy directive is present', () => {
    const policyHost = (fixture.nativeElement as HTMLElement).querySelector('.policy-scrollbar') as HTMLElement;
    const policyContainer = policyHost.querySelector('.scrollbar-container') as HTMLElement;

    policyContainer.dispatchEvent(new Event('scroll'));

    expect(overlayService.closeOverlay).toHaveBeenCalledTimes(1);
  });
});

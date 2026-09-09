import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayService } from '../../services/overlay.service';
import { CustomScrollbarComponent } from './custom-scrollbar.component';

@Component({
  standalone: true,
  imports: [CustomScrollbarComponent],
  template: `
    <app-custom-scrollbar [scrollHeigth]="height">
      <span class="projected-content">Projected</span>
    </app-custom-scrollbar>
  `
})
class CustomScrollbarHostComponent {
  height = 500;
}

describe('CustomScrollbarComponent F.0 characterization', () => {
  let fixture: ComponentFixture<CustomScrollbarHostComponent>;
  let overlayService: jasmine.SpyObj<OverlayService>;

  beforeEach(async () => {
    overlayService = jasmine.createSpyObj<OverlayService>('OverlayService', ['closeOverlay']);

    await TestBed.configureTestingModule({
      imports: [CustomScrollbarHostComponent],
      providers: [
        { provide: OverlayService, useValue: overlayService }
      ]
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

  it('closes the shared overlay on every scroll event', () => {
    const container = (fixture.nativeElement as HTMLElement).querySelector('.scrollbar-container') as HTMLElement;

    container.dispatchEvent(new Event('scroll'));

    expect(overlayService.closeOverlay).toHaveBeenCalledTimes(1);
  });
});

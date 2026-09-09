import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomScrollbarComponent } from './custom-scrollbar.component';
import { SCROLL_INTERACTION_POLICY, ScrollInteractionPolicy } from './scroll-interaction-policy';

@Component({
  standalone: true,
  imports: [CustomScrollbarComponent],
  template: `
    <app-custom-scrollbar [scrollHeigth]="height" (scrolled)="onScrolled($event)">
      <span class="projected-content">Projected</span>
    </app-custom-scrollbar>
  `
})
class CustomScrollbarHostComponent {
  height = 500;
  lastScrollEvent?: Event;

  onScrolled(event: Event): void {
    this.lastScrollEvent = event;
  }
}

describe('CustomScrollbarComponent F.3 boundary', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('keeps projected content, historical height and generic scroll output without an application policy', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomScrollbarHostComponent]
    }).compileComponents();

    const fixture: ComponentFixture<CustomScrollbarHostComponent> = TestBed.createComponent(CustomScrollbarHostComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const container = element.querySelector('.scrollbar-container') as HTMLElement;
    const scrollEvent = new Event('scroll');

    expect(element.querySelector('.projected-content')?.textContent).toContain('Projected');
    expect(container.style.maxHeight).toBe('500px');

    container.dispatchEvent(scrollEvent);

    expect(fixture.componentInstance.lastScrollEvent).toBe(scrollEvent);
  });

  it('delegates scroll side effects to the configured interaction policy', async () => {
    const policy = jasmine.createSpyObj<ScrollInteractionPolicy>('ScrollInteractionPolicy', ['onScroll']);

    await TestBed.configureTestingModule({
      imports: [CustomScrollbarHostComponent],
      providers: [{ provide: SCROLL_INTERACTION_POLICY, useValue: policy }]
    }).compileComponents();

    const fixture: ComponentFixture<CustomScrollbarHostComponent> = TestBed.createComponent(CustomScrollbarHostComponent);
    fixture.detectChanges();

    const container = (fixture.nativeElement as HTMLElement).querySelector('.scrollbar-container') as HTMLElement;
    const scrollEvent = new Event('scroll');

    container.dispatchEvent(scrollEvent);

    expect(policy.onScroll).toHaveBeenCalledOnceWith(scrollEvent);
  });
});

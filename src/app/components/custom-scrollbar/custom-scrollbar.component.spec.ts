import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomScrollbarComponent } from './custom-scrollbar.component';

describe('CustomScrollbarComponent', () => {
  let component: CustomScrollbarComponent;
  let fixture: ComponentFixture<CustomScrollbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomScrollbarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomScrollbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should preserve overlay cleanup and emit the original scroll event', () => {
    const event = new Event('scroll');
    const emitted: Event[] = [];
    const closeOverlay = spyOn(component.overlayService, 'closeOverlay');
    component.scrollEvent.subscribe(currentEvent => emitted.push(currentEvent));

    component.onScroll(event);

    expect(closeOverlay).toHaveBeenCalledTimes(1);
    expect(emitted).toEqual([event]);
  });
});

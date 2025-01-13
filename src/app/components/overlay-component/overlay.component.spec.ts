import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayComponentComponent } from './overlay-component.component';

describe('OverlayComponentComponent', () => {
  let component: OverlayComponentComponent;
  let fixture: ComponentFixture<OverlayComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OverlayComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

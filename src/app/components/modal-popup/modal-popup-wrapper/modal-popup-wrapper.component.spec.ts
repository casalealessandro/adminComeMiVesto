import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupWrapperComponent } from './modal-popup-wrapper.component';

describe('PopupWrapperComponent', () => {
  let component: PopupWrapperComponent;
  let fixture: ComponentFixture<PopupWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

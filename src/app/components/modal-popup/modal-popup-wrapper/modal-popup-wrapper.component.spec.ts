import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NicaPopupWrapperComponent } from './modal-popup-wrapper.component';

describe('NicaPopupWrapperComponent', () => {
  let component: NicaPopupWrapperComponent;
  let fixture: ComponentFixture<NicaPopupWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NicaPopupWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NicaPopupWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

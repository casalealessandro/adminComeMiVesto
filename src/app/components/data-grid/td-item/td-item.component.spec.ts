import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TdItemComponent } from './td-item.component';

describe('TdItemComponent', () => {
  let component: TdItemComponent;
  let fixture: ComponentFixture<TdItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TdItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TdItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutfitProductsComponent } from './outfit-products.component';

describe('OutfitProductsComponent', () => {
  let component: OutfitProductsComponent;
  let fixture: ComponentFixture<OutfitProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutfitProductsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OutfitProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

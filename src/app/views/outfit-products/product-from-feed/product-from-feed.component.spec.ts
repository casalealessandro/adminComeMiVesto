import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductFromFeedComponent } from './product-from-feed.component';

describe('ProductFromFeedComponent', () => {
  let component: ProductFromFeedComponent;
  let fixture: ComponentFixture<ProductFromFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFromFeedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductFromFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

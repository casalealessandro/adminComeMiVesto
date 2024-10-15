import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutfitCategoryComponent } from './outfit-category.component';

describe('OutfitCategoryComponent', () => {
  let component: OutfitCategoryComponent;
  let fixture: ComponentFixture<OutfitCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutfitCategoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OutfitCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

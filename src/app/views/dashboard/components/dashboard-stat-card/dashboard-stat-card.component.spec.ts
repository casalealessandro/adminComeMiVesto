import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardStatCardComponent } from './dashboard-stat-card.component';

describe('DashboardStatCardComponent', () => {
  let fixture: ComponentFixture<DashboardStatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStatCardComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardStatCardComponent);
    fixture.componentInstance.label = 'Utenti';
    fixture.componentInstance.value = 10;
    fixture.componentInstance.meta = '+2 negli ultimi 7 giorni';
    fixture.componentInstance.route = '/utenti';
    fixture.detectChanges();
  });

  it('renders the configured metric', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Utenti');
    expect(text).toContain('10');
    expect(text).toContain('+2 negli ultimi 7 giorni');
  });
});

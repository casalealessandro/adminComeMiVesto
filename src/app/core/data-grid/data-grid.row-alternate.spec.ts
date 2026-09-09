import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DataGridComponent } from './data-grid.component';
import { AnagraficaService } from '../../services/anagrafica.service';


describe('DataGridComponent row alternation', () => {
  let component: DataGridComponent;

  const anagraficaServiceStub = {
    getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
    getValue: jasmine.createSpy('getValue').and.resolveTo(null),
    actionInsert: jasmine.createSpy('actionInsert').and.resolveTo(null),
    actionPut: jasmine.createSpy('actionPut').and.resolveTo(null),
    actionDelete: jasmine.createSpy('actionDelete').and.resolveTo(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataGridComponent],
      providers: [
        { provide: AnagraficaService, useValue: anagraficaServiceStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DataGridComponent);
    component = fixture.componentInstance;
    component.idTable = 'data-grid-row-alternate-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.colonne = [];
    fixture.detectChanges();
  });

  it('should apply alternate class deterministically to odd data rows', () => {
    component.rowAlternate = true;

    expect(component.updateRowClasses(0)['alternate']).toBeFalse();
    expect(component.updateRowClasses(1)['alternate']).toBeTrue();
    expect(component.updateRowClasses(2)['alternate']).toBeFalse();
    expect(component.updateRowClasses(3)['alternate']).toBeTrue();
  });

  it('should not apply alternate class when row alternation is disabled', () => {
    component.rowAlternate = false;

    expect(component.updateRowClasses(0)['alternate']).toBeFalse();
    expect(component.updateRowClasses(1)['alternate']).toBeFalse();
  });

  it('should preserve the existing selected-row state together with row alternation', () => {
    component.rowAlternate = true;
    component.rowSelected[1] = true;

    const classes = component.updateRowClasses(1);

    expect(classes['alternate']).toBeTrue();
    expect(classes['selected-row']).toBeTrue();
  });
});

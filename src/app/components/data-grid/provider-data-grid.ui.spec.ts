import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { ProviderDataGridComponent } from './provider-data-grid.component';

describe('ProviderDataGridComponent search and filter UI', () => {
  let component: ProviderDataGridComponent<any>;
  let fixture: ComponentFixture<ProviderDataGridComponent<any>>;

  const anagraficaServiceStub = {
    getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
    getValue: jasmine.createSpy('getValue').and.resolveTo(null),
    actionInsert: jasmine.createSpy('actionInsert').and.resolveTo(null),
    actionPut: jasmine.createSpy('actionPut').and.resolveTo(null),
    actionDelete: jasmine.createSpy('actionDelete').and.resolveTo(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderDataGridComponent],
      providers: [
        { provide: AnagraficaService, useValue: anagraficaServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderDataGridComponent);
    component = fixture.componentInstance;
    component.idTable = 'provider-ui-grid-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.showNullData = true;
    component.showToolbarTop = true;
    component.isSearchable = true;
    component.showFilter = true;
    component.colsHeader = [
      { dataField: 'name', type: 'campo', caption: 'Nome', colWidth: 180, search: true } as any,
      { dataField: 'age', type: 'campoNumber', caption: 'Età', colWidth: 100, search: true } as any,
      { dataField: 'active', type: 'campoBoolean', caption: 'Stato', colWidth: 120, search: true } as any,
      { dataField: '', type: 'editorButtons', caption: '', colWidth: 40, search: false } as any,
    ];
  });

  it('should render global search in the top toolbar before the table', () => {
    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector('.-data-grid-global-search input') as HTMLInputElement | null;
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement | null;

    expect(search).not.toBeNull();
    expect(search?.placeholder).toBe('Cerca in tutti i campi...');
    expect(table).not.toBeNull();
    expect(search!.compareDocumentPosition(table!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should render one separate filter row below the column header when showFilter is enabled', () => {
    fixture.detectChanges();

    const headerRows = fixture.nativeElement.querySelectorAll('thead > tr');
    const filterRow = fixture.nativeElement.querySelector('thead > tr.-data-grid-filter-row');

    expect(headerRows.length).toBe(2);
    expect(filterRow).not.toBeNull();
    expect(filterRow.querySelector('input[data-grid-filter-field="name"]')?.getAttribute('type')).toBe('text');
    expect(filterRow.querySelector('input[data-grid-filter-field="age"]')?.getAttribute('type')).toBe('number');
    expect(filterRow.querySelector('select[data-grid-filter-field="active"]')).not.toBeNull();
  });

  it('should hide only the column filter row when showFilter is disabled', () => {
    component.showFilter = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('thead > tr.-data-grid-filter-row')).toBeNull();
    expect(fixture.nativeElement.querySelector('.-data-grid-global-search input')).not.toBeNull();
  });
});

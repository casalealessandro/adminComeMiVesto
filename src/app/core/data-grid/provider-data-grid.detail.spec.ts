import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { detailOptions } from '../../interface/app.interface';
import { ProviderDataGridComponent } from './provider-data-grid.component';

describe('ProviderDataGridComponent remote detail', () => {
  let component: ProviderDataGridComponent<any>;
  let getElenco: jasmine.Spy;

  beforeEach(async () => {
    getElenco = jasmine.createSpy('getElenco');

    await TestBed.configureTestingModule({
      imports: [ProviderDataGridComponent],
      providers: [
        {
          provide: AnagraficaService,
          useValue: {
            getElenco,
            getValue: jasmine.createSpy('getValue'),
            actionInsert: jasmine.createSpy('actionInsert'),
            actionPut: jasmine.createSpy('actionPut'),
            actionDelete: jasmine.createSpy('actionDelete'),
          },
        },
      ],
    }).compileComponents();

    component = TestBed.createComponent(ProviderDataGridComponent).componentInstance;
    component.idTable = 'provider-detail-grid-test';
  });

  afterEach(() => {
    document.getElementById('provider-detail-grid-test')?.remove();
  });

  it('should load provider detail from the exact parent row and preserve onRowExpanded payload', async () => {
    const row = { code: 'PARENT-1', category: 'shirt' };
    const details = [
      { code: 'DETAIL-1' },
      { code: 'DETAIL-2' },
    ];
    const load = jasmine.createSpy('load').and.resolveTo(details);
    const emitted: any[] = [];

    component.detailDataProvider = { load };
    component.emittendGridEvent.subscribe(event => emitted.push(event));

    await component.renderGridDetailData(buildRemoteDetailOptions(), row, 3);

    expect(load).toHaveBeenCalledOnceWith({ parentRow: row });
    expect(component.colsRowDetail[3]).toBe(details);
    expect(component.showDetailRow[3]).toBeTrue();
    expect(component.showNullDataDetail).toBeFalse();
    expect(emitted).toEqual([{
      cancel: false,
      data: row,
      rowIndex: 3,
      expandedData: details,
      name: 'onRowExpanded',
    }]);
  });

  it('should show the historic detail empty state when the provider returns no rows', async () => {
    const row = { code: 'EMPTY-PARENT' };
    const load = jasmine.createSpy('load').and.resolveTo([]);

    component.detailDataProvider = { load };

    await component.renderGridDetailData(buildRemoteDetailOptions(), row, 0);

    expect(component.colsRowDetail[0]).toEqual([]);
    expect(component.showDetailRow[0]).toBeTrue();
    expect(component.showNullDataDetail).toBeTrue();
  });

  it('should preserve the previous detail state and not emit a false expansion when provider loading fails', async () => {
    const previousDetails = [{ code: 'KEEP-DETAIL' }];
    const emitted: any[] = [];
    const load = jasmine.createSpy('load').and.rejectWith(new Error('detail failed'));

    component.colsRowDetail[1] = previousDetails;
    component.showDetailRow[1] = false;
    component.showNullDataDetail = true;
    component.detailDataProvider = { load };
    component.emittendGridEvent.subscribe(event => emitted.push(event));

    await component.renderGridDetailData(buildRemoteDetailOptions(), { code: 'FAIL-PARENT' }, 1);

    expect(component.colsRowDetail[1]).toBe(previousDetails);
    expect(component.showDetailRow[1]).toBeFalse();
    expect(component.showNullDataDetail).toBeTrue();
    expect(emitted).toEqual([]);
  });

  it('should keep the legacy remote detail loader untouched when no detail provider is configured', async () => {
    const row = { id: 12 };
    const details = [{ code: 'LEGACY-DETAIL' }];
    const options = buildRemoteDetailOptions('?parent=$id');

    getElenco.and.returnValue(of({ items: details }));

    await component.renderGridDetailData(options, row, 0);

    expect(getElenco).toHaveBeenCalledOnceWith('/legacy-details', '?parent=12');
    expect(component.colsRowDetail[0]).toBe(details);
    expect(component.showDetailRow[0]).toBeTrue();
  });

  it('should keep the original collapse flow and delegate only remote data loading polymorphically', () => {
    const parentRow = { code: 'PARENT-COLLAPSE' };
    const table = document.createElement('table');
    table.id = 'provider-detail-grid-test';
    const tbody = document.createElement('tbody');
    const row = document.createElement('tr');
    row.classList.add('dx-datagrid-group-closed');
    tbody.appendChild(row);
    table.appendChild(tbody);
    document.body.appendChild(table);

    component.detailOptions = buildRemoteDetailOptions();
    component.showDetailRow[0] = false;

    const detailLoader = spyOn(component, 'renderGridDetailData').and.resolveTo();
    const event = {
      currentTarget: row,
      stopPropagation: jasmine.createSpy('stopPropagation'),
      preventDefault: jasmine.createSpy('preventDefault'),
    };

    component.collapse(event, parentRow, 0);

    expect(detailLoader).toHaveBeenCalledOnceWith(component.detailOptions, parentRow, 0);
    expect(row.classList.contains('dx-datagrid-group-opened')).toBeTrue();
    expect(row.classList.contains('dx-datagrid-group-closed')).toBeFalse();
  });

  function buildRemoteDetailOptions(queryString = ''): detailOptions {
    return {
      isRemote: true,
      service: '',
      api: '/legacy-details',
      isEditable: false,
      groupDataField: 'details',
      queryString,
      costantValue: [],
      colonne: [],
    };
  }
});

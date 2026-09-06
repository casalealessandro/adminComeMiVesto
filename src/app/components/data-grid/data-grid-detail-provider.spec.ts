import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { detailOptions } from '../../interface/app.interface';
import { DataGridComponent } from './data-grid.component';
import { GridDetailDataProvider } from './data-grid-detail-provider';

describe('DataGrid remote detail safety net', () => {
  let component: DataGridComponent;
  let getElenco: jasmine.Spy;

  beforeEach(async () => {
    getElenco = jasmine.createSpy('getElenco');

    await TestBed.configureTestingModule({
      imports: [DataGridComponent],
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

    component = TestBed.createComponent(DataGridComponent).componentInstance;
    component.idTable = 'detail-grid-test';
  });

  it('should keep the detail provider contract backend-neutral and pass the parent row as-is', async () => {
    const parentRow = { code: 'PARENT-1', category: 'shirt' };
    const detailRows = [{ code: 'DETAIL-1' }];
    const load = jasmine.createSpy('load').and.resolveTo(detailRows);

    const provider: GridDetailDataProvider<typeof parentRow, { code: string }> = {
      load,
    };

    const result = await provider.load({ parentRow });

    expect(load).toHaveBeenCalledOnceWith({ parentRow });
    expect(result).toBe(detailRows);
  });

  it('should preserve historic parent-row and costantValue token replacement', async () => {
    const row = { id: 42, category: 'shirt' };
    const options: detailOptions = {
      isRemote: true,
      service: '',
      api: '/details',
      isEditable: false,
      groupDataField: 'details',
      queryString: '?parent=$id&category=$category&scope=$tenant',
      costantValue: [
        { key: 'tenant', value: 'public' },
      ],
      colonne: [],
    };

    getElenco.and.returnValue(of({ items: [{ id: 'D-1' }] }));

    await component.renderGridDetailData(options, row, 0);

    expect(getElenco).toHaveBeenCalledOnceWith(
      '/details',
      '?parent=42&category=shirt&scope=public',
    );
  });

  it('should preserve historic items unwrapping and onRowExpanded payload', async () => {
    const row = { id: 7 };
    const details = [
      { id: 'D-1', label: 'Uno' },
      { id: 'D-2', label: 'Due' },
    ];
    const emitted: any[] = [];
    const options = buildRemoteDetailOptions('?parent=$id');

    getElenco.and.returnValue(of({ items: details }));
    component.emittendGridEvent.subscribe(event => emitted.push(event));

    await component.renderGridDetailData(options, row, 2);

    expect(component.colsRowDetail[2]).toBe(details);
    expect(component.showDetailRow[2]).toBeTrue();
    expect(emitted).toEqual([{
      cancel: false,
      data: row,
      rowIndex: 2,
      expandedData: details,
      name: 'onRowExpanded',
    }]);
  });

  it('should preserve support for a raw detail array response', async () => {
    const row = { id: 9 };
    const details = [{ id: 'RAW-1' }];
    const options = buildRemoteDetailOptions('?parent=$id');

    getElenco.and.returnValue(of(details));

    await component.renderGridDetailData(options, row, 1);

    expect(component.colsRowDetail[1]).toBe(details);
    expect(component.showDetailRow[1]).toBeTrue();
  });

  function buildRemoteDetailOptions(queryString: string): detailOptions {
    return {
      isRemote: true,
      service: '',
      api: '/details',
      isEditable: false,
      groupDataField: 'details',
      queryString,
      costantValue: [],
      colonne: [],
    };
  }
});

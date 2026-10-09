import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TdItemComponent } from './td-item.component';
import { AnagraficaService } from '../../../services/anagrafica.service';


describe('TdItemComponent', () => {
  let component: TdItemComponent;
  let fixture: ComponentFixture<TdItemComponent>;

  const anagraficaServiceStub = {
    getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
    getValue: jasmine.createSpy('getValue').and.resolveTo(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdItemComponent],
      providers: [
        { provide: AnagraficaService, useValue: anagraficaServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TdItemComponent);
    component = fixture.componentInstance;
    component.colProperty = {
      colAlignment: 'left',
      dataField: 'name',
      dataOptions: {},
      editorbuttons: [],
    };
    component.colType = 'campo';
    component.value = 'Test value';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should preserve plain text values', () => {
    expect(component.renderHtmlColumn('Hello', '')).toBe('Hello');
  });

  it('should prepare image cells without a remote lookup', () => {
    component.colType = 'campoImg';
    const result = component.renderHtmlColumn('https://example.test/image.jpg', '');

    expect(component.toolTipImg).toBe('https://example.test/image.jpg');
    expect(result).toContain('<img');
    expect(result).toContain('https://example.test/image.jpg');
  });
  describe('campoLista rendering', () => {
    const config = {
      valueExp: 'id',
      displayExp: 'value',
      options: [
        { id: 'creator', value: 'Creator' },
        { id: 'admin', value: 'Admin' },
      ],
    };

    it('renders the label for a known list value', () => {
      component.colType = 'campoLista';
      component.colProperty = { ...component.colProperty, customizedOptions: config };
      component.value = 'creator';

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.staticData).toBe('Creator');
    });

    it('does not throw for a null placeholder while loading the next page', () => {
      component.colType = 'campoLista';
      component.colProperty = { ...component.colProperty, customizedOptions: config };
      component.value = null;

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.staticData).toBe('');
    });

    it('keeps unmatched non-null values visible for diagnosis', () => {
      component.colType = 'campoLista';
      component.colProperty = { ...component.colProperty, customizedOptions: config };
      component.value = 'legacy-role';

      fixture.detectChanges();
      expect(component.staticData).toBe('legacy-role');
    });

    it('preserves boolean false mapping to its configured label', () => {
      component.colType = 'campoLista';
      component.colProperty = {
        ...component.colProperty,
        customizedOptions: {
          valueExp: 'id',
          displayExp: 'value',
          options: [
            { id: false, value: 'ATTIVO' },
            { id: true, value: 'DISABILITATO' },
          ],
        },
      };
      component.value = false;

      fixture.detectChanges();
      expect(component.staticData).toBe('ATTIVO');
    });

    it('handles missing list configuration and missing values without errors', () => {
      component.colType = 'campoLista';
      component.colProperty = { colAlignment: 'left', dataField: 'role' };
      component.value = undefined;

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.staticData).toBe('');
    });
  });

});

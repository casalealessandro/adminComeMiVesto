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
    const result = component.renderHtmlColumn('https://example.test/image.jpg', '');

    expect(component.toolTipImg).toBe('https://example.test/image.jpg');
    expect(result).toContain('<img');
    expect(result).toContain('https://example.test/image.jpg');
  });
});

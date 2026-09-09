import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CaptionComponent } from './caption.component';
import { ToolbarButton } from '../../interface/app.interface';

describe('CaptionComponent F.1 regression', () => {
  let component: CaptionComponent;
  let fixture: ComponentFixture<CaptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CaptionComponent);
    component = fixture.componentInstance;
    component.caption = 'Titolo pagina';
    component.customToolbarButtons = [];
    fixture.detectChanges();
  });

  it('renders the configured caption', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('.page-title')?.textContent).toContain('Titolo pagina');
  });

  it('renders only visible custom toolbar buttons and preserves disabled state', () => {
    const buttons: ToolbarButton[] = [
      { id: 'enabled', name: 'enabled', text: 'Enabled', disabled: false, visible: true, widget: 'button' },
      { id: 'disabled', name: 'disabled', text: 'Disabled', disabled: true, visible: true, widget: 'button' },
      { id: 'hidden', name: 'hidden', text: 'Hidden', disabled: false, visible: false, widget: 'button' }
    ];

    component.customToolbarButtons = buttons;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#enabled')).toBeTruthy();
    expect((element.querySelector('#disabled') as HTMLButtonElement).disabled).toBeTrue();
    expect(element.querySelector('#hidden')).toBeNull();
  });

  it('emits the configured toolbar button on click', () => {
    const button: ToolbarButton = {
      id: 'custom', name: 'custom', text: 'Custom', disabled: false, visible: true, widget: 'button'
    };
    const emitted: ToolbarButton[] = [];
    component.customToolbarButtons = [button];
    component.emitToolbarButtonClick.subscribe(value => emitted.push(value));
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#custom')?.click();

    expect(emitted).toEqual([button]);
  });

  it('emits the historical addButton descriptor from the add action', () => {
    const emitted: ToolbarButton[] = [];
    component.addButtonShow = true;
    component.emitAddEvent.subscribe(value => emitted.push(value));
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#addButton')?.click();

    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe('addButton');
    expect(emitted[0].name).toBe('addButton');
  });

  it('preserves search-button delivery through emitToolbarSearchInputChange', () => {
    const searchValues: string[] = [];
    const buttonInputValues: string[] = [];
    component.showSearchInput = true;
    component.showButtonInput = true;
    component.inputValue = 'outfit';
    component.emitToolbarSearchInputChange.subscribe(value => searchValues.push(value));
    component.emitToolbarButtonInput.subscribe(value => buttonInputValues.push(value));
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.input-container button')?.click();

    expect(searchValues).toEqual(['outfit']);
    expect(buttonInputValues).toEqual([]);
  });

  it('emits close only when the closable action is available', () => {
    const emitted: unknown[] = [];
    component.isClosable = true;
    component.emitChiusura.subscribe(value => emitted.push(value));
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.icon-button')?.click();
    expect(emitted.length).toBe(1);

    component.isClosable = false;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.icon-button')).toBeNull();
  });
});

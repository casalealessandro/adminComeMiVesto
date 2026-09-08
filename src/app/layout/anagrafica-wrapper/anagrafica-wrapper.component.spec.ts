import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AnagraficaWrapperComponent } from './anagrafica-wrapper.component';
import { CaptionComponent } from '../../components/caption/caption.component';
import { ToolbarButton } from '../../interface/app.interface';

@Component({
  selector: 'app-anagrafica-wrapper-host',
  standalone: true,
  imports: [AnagraficaWrapperComponent],
  template: `
    <app-anagrafica-wrapper
      [caption]="caption"
      [subTitle]="subTitle"
      [tip]="tip"
      [showSpinner]="showSpinner"
      [addButtonShow]="true"
      [showSearchInput]="true"
      [customToolbarButtons]="customToolbarButtons"
      (emittEventButton)="onButton($event)"
      (emitEventSearchInput)="onSearch($event)"
      (emitEventButtonInputChange)="onButtonInput($event)"
    >
      <span class="projected-content">Contenuto pagina</span>
    </app-anagrafica-wrapper>
  `
})
class AnagraficaWrapperHostComponent {
  caption = 'Titolo pagina';
  subTitle = 'Sottotitolo pagina';
  tip = 'Suggerimento';
  showSpinner = true;
  customToolbarButtons: ToolbarButton[] = [
    { id: 'custom', name: 'custom', text: 'Custom', disabled: false, visible: true, icon: 'mdi mdi-test-tube', widget: 'button' }
  ];
  receivedButton: any;
  receivedSearch: any;
  receivedButtonInput: any;

  onButton(event: any) { this.receivedButton = event; }
  onSearch(event: any) { this.receivedSearch = event; }
  onButtonInput(event: any) { this.receivedButtonInput = event; }
}

describe('AnagraficaWrapperComponent E.4.2 characterization', () => {
  let fixture: ComponentFixture<AnagraficaWrapperHostComponent>;
  let host: AnagraficaWrapperHostComponent;
  let topCaption: CaptionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnagraficaWrapperHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AnagraficaWrapperHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    topCaption = fixture.debugElement.queryAll(By.directive(CaptionComponent))[0].componentInstance as CaptionComponent;
  });

  it('renders the current page shell content', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(topCaption.caption).toBe(host.caption);
    expect(element.querySelector('h2')?.textContent).toContain(host.subTitle);
    expect(element.querySelector('.alert')?.textContent).toContain(host.tip);
    expect(element.textContent).toContain('Carimento in corso...');
    expect(element.querySelector('.projected-content')?.textContent).toContain('Contenuto pagina');
  });

  it('passes custom toolbar buttons to the top caption', () => {
    expect(topCaption.customToolbarButtons).toBe(host.customToolbarButtons);
  });

  it('forwards add and toolbar button events', () => {
    const addEvent = { name: 'addButton' };
    topCaption.emitAddEvent.emit(addEvent);
    expect(host.receivedButton).toBe(addEvent);

    const toolbarEvent = { name: 'custom' };
    topCaption.emitToolbarButtonClick.emit(toolbarEvent);
    expect(host.receivedButton).toBe(toolbarEvent);
  });

  it('forwards search and button input events', () => {
    topCaption.emitToolbarSearchInputChange.emit('cerca');
    expect(host.receivedSearch).toBe('cerca');

    topCaption.emitToolbarButtonInput.emit('valore');
    expect(host.receivedButtonInput).toBe('valore');
  });
});

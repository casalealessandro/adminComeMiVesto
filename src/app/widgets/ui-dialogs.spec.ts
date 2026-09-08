import { alert, confirm } from './ui-dialogs';

describe('ui-dialogs characterization', () => {
  afterEach(() => {
    document.querySelectorAll('.modal').forEach(element => element.remove());
  });

  it('renders an alert and reports true when OK is pressed', () => {
    const callback = jasmine.createSpy('callback');

    alert('Messaggio di prova', 'Attenzione', callback);

    const modal = document.querySelector('.modal') as HTMLElement;
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('Attenzione');
    expect(modal.textContent).toContain('Messaggio di prova');

    (modal.querySelector('.ok-button') as HTMLButtonElement).click();

    expect(callback).toHaveBeenCalledWith(true);
    expect(document.querySelector('.modal')).toBeNull();
  });

  it('renders a confirm and reports true for Si', () => {
    const callback = jasmine.createSpy('callback');

    confirm('Confermare?', 'Conferma', callback);

    const modal = document.querySelector('.modal') as HTMLElement;
    const buttons = Array.from(modal.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.map(button => button.textContent)).toEqual(['Si', 'No']);

    buttons[0].click();

    expect(callback).toHaveBeenCalledWith(true);
    expect(document.querySelector('.modal')).toBeNull();
  });

  it('reports false for No in a confirm dialog', () => {
    const callback = jasmine.createSpy('callback');

    confirm('Confermare?', 'Conferma', callback);

    const modal = document.querySelector('.modal') as HTMLElement;
    const buttons = Array.from(modal.querySelectorAll('button')) as HTMLButtonElement[];
    buttons[1].click();

    expect(callback).toHaveBeenCalledWith(false);
    expect(document.querySelector('.modal')).toBeNull();
  });
});

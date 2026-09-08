import { alert, confirm } from './ui-dialogs';

describe('ui-dialogs characterization', () => {
  afterEach(() => {
    document.querySelectorAll('.modal').forEach(element => element.remove());
    document.querySelectorAll('[data-ui-dialog-origin]').forEach(element => element.remove());
  });

  it('renders an accessible alert, focuses its action and reports true when OK is pressed', () => {
    const callback = jasmine.createSpy('callback');

    alert('Messaggio di prova', 'Attenzione', callback);

    const modal = document.querySelector('.modal') as HTMLElement;
    const okButton = modal.querySelector('.ok-button') as HTMLButtonElement;
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('Attenzione');
    expect(modal.textContent).toContain('Messaggio di prova');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-labelledby')).toBeTruthy();
    expect(document.activeElement).toBe(okButton);

    okButton.click();

    expect(callback).toHaveBeenCalledWith(true);
    expect(document.querySelector('.modal')).toBeNull();
  });

  it('renders a confirm and reports true for Si', () => {
    const callback = jasmine.createSpy('callback');

    confirm('Confermare?', 'Conferma', callback);

    const modal = document.querySelector('.modal') as HTMLElement;
    const buttons = Array.from(modal.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.map(button => button.textContent)).toEqual(['Si', 'No']);
    expect(document.activeElement).toBe(buttons[0]);

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

  it('treats Escape as cancel for confirm and restores the previous focus', () => {
    const callback = jasmine.createSpy('callback');
    const origin = document.createElement('button');
    origin.setAttribute('data-ui-dialog-origin', 'true');
    document.body.appendChild(origin);
    origin.focus();

    confirm('Confermare?', 'Conferma', callback);

    const modal = document.querySelector('.modal') as HTMLElement;
    const focusedButton = document.activeElement as HTMLButtonElement;
    focusedButton.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    }));

    expect(callback).toHaveBeenCalledWith(false);
    expect(document.querySelector('.modal')).toBeNull();
    expect(document.activeElement).toBe(origin);
  });
});

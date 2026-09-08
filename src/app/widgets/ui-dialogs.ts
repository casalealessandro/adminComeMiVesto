const dialogTemplate = `
 
    <div class="ui-modal-dialog ">
      <div class="ui-modal-dialog-content">
        <div class="ui-modal-title">
          <span>{{title}}</span>
        </div>
        <div class="ui-modal-body-message">
          {{message}}
        </div>
        <div class="ui-modal-footer-message">
          <button class="ui-modal-button ok-button btn">OK</button>
        </div>
      </div>
    </div>
 
`;

let dialogTitleSequence = 0;

const prepareDialog = (dialogElement: HTMLElement): HTMLElement | null => {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const titleElement = dialogElement.querySelector('.ui-modal-title');

  dialogElement.setAttribute('role', 'dialog');
  dialogElement.setAttribute('aria-modal', 'true');

  if (titleElement) {
    const titleId = `ui-modal-title-${++dialogTitleSequence}`;
    titleElement.id = titleId;
    dialogElement.setAttribute('aria-labelledby', titleId);
  }

  return previousFocus;
};

const mountAndFocusDialog = (dialogElement: HTMLElement): void => {
  document.body.appendChild(dialogElement);
  (dialogElement.querySelector('button') as HTMLButtonElement | null)?.focus();
};

const removeDialogAndRestoreFocus = (
  dialogElement: HTMLElement,
  previousFocus: HTMLElement | null
): void => {
  if (dialogElement.isConnected) {
    dialogElement.remove();
  }

  if (previousFocus?.isConnected) {
    previousFocus.focus();
  }
};

export const alert = (messageHtml: string, title: string, callback?: (resp?: any) => void): void => {
  const dialog = dialogTemplate
    .replace('{{title}}', title)
    .replace('{{message}}', messageHtml);

  const alertElement = document.createElement('div');
  alertElement.classList.add('modal');
  alertElement.style.display = 'block';
  alertElement.innerHTML = dialog;

  const previousFocus = prepareDialog(alertElement);
  let isClosed = false;

  const closeAlert = () => {
    if (isClosed) {
      return;
    }

    isClosed = true;
    removeDialogAndRestoreFocus(alertElement, previousFocus);
    callback?.(true);
  };

  alertElement.querySelector('.ok-button')!.addEventListener('click', closeAlert);
  alertElement.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAlert();
    }
  });

  mountAndFocusDialog(alertElement);
};

export const confirm = (messageHtml: string, title: string, callback?: (resp?: any) => void): void => {
  const dialog = dialogTemplate
    .replace('{{title}}', title)
    .replace('{{message}}', messageHtml);

  const alertElement = document.createElement('div');
  alertElement.classList.add('modal');
  alertElement.style.display = 'block';
  alertElement.innerHTML = dialog;

  const okButton = document.createElement('button');
  const cancelButton = document.createElement('button');
  okButton.classList.add('ui-modal-button');
  cancelButton.classList.add('ui-modal-button');
  okButton.textContent = 'Si';
  cancelButton.textContent = 'No';

  alertElement.querySelector('.ui-modal-footer-message')!.innerHTML = '';
  alertElement.querySelector('.ui-modal-footer-message')!.appendChild(okButton);
  alertElement.querySelector('.ui-modal-footer-message')!.appendChild(cancelButton);

  const previousFocus = prepareDialog(alertElement);
  let isClosed = false;

  const closeConfirm = (response: boolean) => {
    if (isClosed) {
      return;
    }

    isClosed = true;
    removeDialogAndRestoreFocus(alertElement, previousFocus);
    callback?.(response);
  };

  okButton.addEventListener('click', () => closeConfirm(true));
  cancelButton.addEventListener('click', () => closeConfirm(false));
  alertElement.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeConfirm(false);
    }
  });

  mountAndFocusDialog(alertElement);
};

export const showPopover = (messageHtml: string, targetElement: HTMLElement, position: 'top' | 'left' | 'right' | 'bottom' = 'bottom'): void => {
  const popover = document.createElement('div');
  popover.innerHTML = messageHtml;

  // Applica lo stile base del popover
  popover.style.position = 'absolute';
  popover.style.backgroundColor = '#ffffff';
  popover.style.border = '1px solid #000000';
  popover.style.padding = '10px';

  // Calcola le coordinate del popover in base alla posizione specificata
  const targetRect = targetElement.getBoundingClientRect();
  let top = 0;
  let left = 0;

  switch (position) {
    case 'top':
      top = targetRect.top - popover.offsetHeight;
      left = targetRect.left + targetRect.width / 2 - popover.offsetWidth / 2;
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - popover.offsetHeight / 2;
      left = targetRect.left - popover.offsetWidth;
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - popover.offsetHeight / 2;
      left = targetRect.left + targetRect.width;
      break;
    case 'bottom':
      top = targetRect.top + targetRect.height;
      left = targetRect.left + targetRect.width / 2 - popover.offsetWidth / 2;
      break;
    default:
      top = targetRect.top + targetRect.height;
      left = targetRect.left + targetRect.width / 2 - popover.offsetWidth / 2;
  }

  // Applica le coordinate calcolate al popover
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;

  // Aggiungi il popover al DOM
  document.body.appendChild(popover);
};

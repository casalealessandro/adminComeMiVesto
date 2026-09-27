const dialogTemplate = `
    <div class="ui-modal-dialog">
      <div class="ui-modal-dialog-content">
        <div class="ui-modal-title">
          <span>{{title}}</span>
        </div>
        <div class="ui-modal-body-message">
          {{message}}
        </div>
        <div class="ui-modal-footer-message">
          <button class="ui-modal-button ok-button btn" type="button">OK</button>
        </div>
      </div>
    </div>
`;

let dialogTitleSequence = 0;

const resolveOverlayLayer = (): string => {
  const activeModalLayers = Array.from(document.querySelectorAll('.modal.popup'))
    .map(element => parseFloat(window.getComputedStyle(element).zIndex))
    .filter(zIndex => Number.isFinite(zIndex));

  const highestModalLayer = activeModalLayers.length ? Math.max(...activeModalLayers) : 0;
  return String(highestModalLayer > 0 ? highestModalLayer + 100 : 1200);
};

const prepareDialog = (dialogElement: HTMLElement): HTMLElement | null => {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const titleElement = dialogElement.querySelector('.ui-modal-title');

  dialogElement.setAttribute('role', 'dialog');
  dialogElement.setAttribute('aria-modal', 'true');
  dialogElement.classList.add('core-dialog-layer');

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
  alertElement.style.zIndex = 'var(--cmv-layer-dialog, 3000)';
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
  alertElement.style.zIndex = 'var(--cmv-layer-dialog, 3000)';
  alertElement.innerHTML = dialog;

  const okButton = document.createElement('button');
  const cancelButton = document.createElement('button');
  okButton.type = 'button';
  cancelButton.type = 'button';
  okButton.classList.add('ui-modal-button', 'ui-modal-button-primary');
  cancelButton.classList.add('ui-modal-button');
  okButton.textContent = 'Si';
  cancelButton.textContent = 'No';

  const footer = alertElement.querySelector('.ui-modal-footer-message')!;
  footer.innerHTML = '';
  footer.appendChild(okButton);
  footer.appendChild(cancelButton);

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

export const showPopover = (
  messageHtml: string,
  targetElement: HTMLElement,
  position: 'top' | 'left' | 'right' | 'bottom' = 'bottom'
): void => {
  const popover = document.createElement('div');
  popover.classList.add('core-popover');
  popover.innerHTML = messageHtml;
  popover.style.position = 'absolute';
  popover.style.zIndex = resolveOverlayLayer();
  popover.style.visibility = 'hidden';

  document.body.appendChild(popover);

  const targetRect = targetElement.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  let top = 0;
  let left = 0;

  switch (position) {
    case 'top':
      top = targetRect.top + window.scrollY - popoverRect.height - 8;
      left = targetRect.left + window.scrollX + targetRect.width / 2 - popoverRect.width / 2;
      break;
    case 'left':
      top = targetRect.top + window.scrollY + targetRect.height / 2 - popoverRect.height / 2;
      left = targetRect.left + window.scrollX - popoverRect.width - 8;
      break;
    case 'right':
      top = targetRect.top + window.scrollY + targetRect.height / 2 - popoverRect.height / 2;
      left = targetRect.right + window.scrollX + 8;
      break;
    case 'bottom':
    default:
      top = targetRect.bottom + window.scrollY + 8;
      left = targetRect.left + window.scrollX + targetRect.width / 2 - popoverRect.width / 2;
      break;
  }

  const viewportMargin = 8;
  const maxLeft = window.scrollX + window.innerWidth - popoverRect.width - viewportMargin;
  left = Math.max(window.scrollX + viewportMargin, Math.min(left, maxLeft));

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
  popover.style.visibility = 'visible';
};



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


export const alert = (messageHtml: string, title: string, callback?: (resp?: any) => void): void => {

  
  const dialog = dialogTemplate
  .replace('{{title}}', title)
  .replace('{{message}}', messageHtml); //document.createElement('div');
 


  const alertElement = document.createElement('div');
  alertElement.classList.add('modal');
  alertElement.style.display = 'block'
  alertElement.innerHTML = dialog;
  // Adding OK button
  
  alertElement.querySelector('.ok-button')!.addEventListener('click', () => {
    let resp = true
    document.body.removeChild(alertElement);
    if (callback) {
      callback(resp); // Chiama la callback se è stata fornita
    }
  });
  document.body.appendChild(alertElement);
  //dialog.appendChild(cancelButton);


};
export const confirm = (messageHtml: string, title: string, callback?: (resp?: any) => void): void => {

  const dialog = dialogTemplate
  .replace('{{title}}', title)
  .replace('{{message}}', messageHtml); //document.createElement('div');
 


  const alertElement = document.createElement('div');
  alertElement.classList.add('modal');
  alertElement.style.display = 'block'
  alertElement.innerHTML = dialog;

  // Adding OK button
  const okButton = document.createElement('button');
  const cancelButton = document.createElement('button');
  okButton.classList.add('ui-modal-button');
  cancelButton.classList.add('ui-modal-button');
  
  okButton.textContent = 'Si';
  cancelButton.textContent = 'No'

  alertElement.querySelector('.ui-modal-footer-message')!.innerHTML = '';
  
  alertElement.querySelector('.ui-modal-footer-message')!.appendChild(okButton)
  alertElement.querySelector('.ui-modal-footer-message')!.appendChild(cancelButton)

  okButton.addEventListener('click', () => {
    let resp = true
    document.body.removeChild(alertElement);
    if (callback) {
      callback(resp); // Chiama la callback se è stata fornita
    }
  });
  cancelButton.addEventListener('click', () => {
    let resp = false
    document.body.removeChild(alertElement);
    if (callback) {
      callback(resp); // Chiama la callback se è stata fornita
    }
  });
  

  // Adding the dialog to the DOM
  document.body.appendChild(alertElement);
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
# DynamicFormComponent

`app-dynamic-form` costruisce un `FormGroup` a partire dalla definizione salvata nel backend Forms (`GET /gen/forms/:id`). Il valore di `service` è l'identificativo del form; non è il nome di un metodo frontend né l'endpoint sul quale salvare i dati.

## Utilizzo

```html
<app-dynamic-form
  [service]="'outfitForm'"
  [editData]="entity"
  [showBottomButtons]="true"
  (submitFormEvent)="save($event)"
  (functionalInputFormEvent)="handleFunctionalInput($event)">
</app-dynamic-form>
```

- `service` (obbligatorio): ID della configurazione caricata da `FormService.getFormFields()`.
- `editData`: oggetto usato per precompilare i controlli. Se omesso, l'evento avrà `inEdit: false`.
- `idData`: compatibilità legacy; se valorizzato sostituisce `editData`.
- `showBottomButtons`, `showBottomButtonLeft`, `showBottomButtonRight`: visibilità dei comandi.
- `inputBtnLeftName`, `inputBtnRightName`: etichette personalizzate.

`submitFormEvent` emette `{ name, formData, form, inEdit }`; il componente chiamante rimane responsabile del DTO, dell'autorizzazione e della chiamata API. `functionalInputFormEvent` notifica i pulsanti funzionali definiti nei campi.

## Select

Le select usano `selectOptions`. Con `remote: false`, `options` contiene la lista. Con `remote: true`, `api` viene letto tramite `GET /gen/{api}`. `displayExp` e `valueExp` identificano rispettivamente etichetta e valore. `parent` abilita il caricamento o filtro a cascata.

## Registrazione amministrativa

La configurazione richiesta è `registerForm`, ad esempio:

```html
<app-dynamic-form
  [editData]="datiutente"
  [service]="'registerForm'"
  (submitFormEvent)="submitFormUser($event)"
  (functionalInputFormEvent)="btnInputEvent($event)">
</app-dynamic-form>
```

Il repository corrente non dichiara un endpoint protetto di creazione amministrativa. L'unico contratto `/admin/users` presente riguarda `PUT /admin/users/:uid/role`; perciò la UI di creazione non va esposta finché il backend non fornisce e documenta un endpoint dedicato (suggerito `POST /admin/users`) e il relativo DTO minimale. Non usare la registrazione pubblica e non impostare consensi Terms/Privacy per conto dell'utente.

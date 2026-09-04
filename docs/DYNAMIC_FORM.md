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

La creazione amministrativa usa una configurazione dedicata, `adminUserCreateForm`, perché il contratto è diverso da quello della registrazione pubblica:

```html
<app-dynamic-form
  [service]="'adminUserCreateForm'"
  [showBottomButtons]="true"
  [inputBtnLeftName]="'Annulla'"
  [inputBtnRightName]="'Crea utente'"
  [loading]="createUserBusy"
  (submitFormEvent)="handleCreateUserForm($event)">
</app-dynamic-form>
```

Il submit costruisce esplicitamente il DTO `{ email, displayName, nome, cognome, gender, role }` e lo invia al protetto `POST /admin/users`. `email` e `role` sono obbligatori; `role` ammette esclusivamente `creator`, `editor` e `admin`. Il form non include password né accettazioni Terms/Privacy: creazione account e invio best-effort dell'email di impostazione password sono gestiti dal backend. La risposta espone `passwordSetupEmailSent`, che consente alla UI di distinguere l'invio riuscito dall'account creato con email non inviata.

La configurazione da salvare nel backend Forms con ID `adminUserCreateForm` è:

```json
[{"type":"textBox","label":"Email","typeInput":"email","name":"email","required":true},{"type":"textBox","label":"Display name","typeInput":"text","name":"displayName"},{"type":"textBox","label":"Nome","typeInput":"text","name":"nome"},{"type":"textBox","label":"Cognome","typeInput":"text","name":"cognome"},{"type":"selectBox","label":"Gender","typeInput":"selectBox","selectOptions":{"multiple":false,"displayExp":"value","valueExp":"id","options":[{"id":"U","value":"Uomo"},{"id":"D","value":"Donna"}],"parent":"","remote":false,"api":""},"name":"gender"},{"type":"selectBox","label":"Ruolo","typeInput":"selectBox","selectOptions":{"multiple":false,"displayExp":"value","valueExp":"id","options":[{"id":"creator","value":"Creator"},{"id":"editor","value":"Editor"},{"id":"admin","value":"Admin"}],"parent":"","remote":false,"api":""},"name":"role","required":true}]
```

La tassonomia gender replica la fonte locale canonica già impiegata dalle configurazioni Forms del progetto (`U`/`D`); i ruoli sono locali perché costituiscono un insieme RBAC chiuso.

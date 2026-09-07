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

L'assenza di `service` è un contratto intenzionale: il componente non richiede metadata e non costruisce controlli. `DynamicFormComponent` non supporta un secondo modo di inizializzazione tramite fields locali passati dall'esterno.

`submitFormEvent` emette `{ name, formData, form, inEdit }`; il componente chiamante rimane responsabile del DTO, dell'autorizzazione e della chiamata API. `functionalInputFormEvent` notifica i pulsanti funzionali definiti nei campi.

## Select

Le select usano `selectOptions`. Con `remote: false`, `options` contiene la lista. Con `remote: true`, `api` viene letto tramite `GET /gen/{api}`. `displayExp` e `valueExp` identificano rispettivamente etichetta e valore. `parent` abilita il caricamento o filtro a cascata.

I valori delle options mantengono il tipo originale nel `FormControl` (per esempio `0`, `false`, numeri o stringhe) e una select `multiple` mantiene l'intero array selezionato anche dopo una modifica dell'utente. Se una select ha un `parent` configurato e il parent è `null`, `undefined` o `''`, il child non espone options e il proprio valore viene svuotato; `0` e `false` restano invece parent validi. Per un child remoto non viene eseguita alcuna chiamata finché il parent è vuoto.

## Radio

I campi `type: radio` sono scelte singole native e usano il contratto dedicato `radioOptions`, distinto da `selectOptions` e privo di `multiple`. `displayExp` identifica la proprietà mostrata, `valueExp` quella salvata nel `FormControl`, mentre `parent` abilita il filtro statico o il caricamento remoto a cascata. I valori parent espliciti `0` e `false` sono validi e anche i valori delle singole options mantengono il loro tipo originale.

Se un RadioBox ha un `parent` configurato e il parent è vuoto (`null`, `undefined` o `''`), le options del child e la selezione corrente vengono svuotate. Un RadioBox remoto non chiama l'API child finché il parent non viene valorizzato.

Esempio statico:

```json
{
  "type": "radio",
  "typeInput": "radio",
  "name": "gender",
  "label": "Gender",
  "radioOptions": {
    "displayExp": "value",
    "valueExp": "id",
    "options": [
      { "id": "U", "value": "Uomo" },
      { "id": "D", "value": "Donna" }
    ],
    "remote": false,
    "api": "",
    "parent": ""
  }
}
```

Esempio remoto a cascata:

```json
{
  "type": "radio",
  "typeInput": "radio",
  "name": "city",
  "label": "City",
  "radioOptions": {
    "displayExp": "name",
    "valueExp": "id",
    "options": [],
    "remote": true,
    "api": "cities",
    "parent": "country"
  }
}
```

Con `country = IT`, il runtime usa `FormService.getData('cities', '/IT')`; durante la richiesta il controllo è disabilitato e viene sempre riabilitato dopo successo, risposta vuota o errore. Se `country` viene poi svuotato, anche il RadioBox `city` viene svuotato e non viene effettuata una nuova chiamata remote finché il parent non viene nuovamente valorizzato.

## Cascade concatenate

SelectBox e RadioBox condividono la stessa semantica di parent. È quindi supportata una catena come:

```text
radio region
→ select city
→ radio district
```

Se `region` viene svuotato, `city` perde options e valore; lo svuotamento viene propagato tramite il normale `valueChange`, quindi anche `district` perde options e valore. Non viene introdotto uno stato cascade separato dal `FormControl`.

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

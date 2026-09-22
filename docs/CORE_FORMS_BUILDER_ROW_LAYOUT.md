# Forms Core — layout a righe del FormBuilder

Il FormBuilder mantiene il contratto persistito come array flat di `DynamicFormField`, ma ne ricava una vista a righe. Campi **consecutivi** con lo stesso `layout.rowId` sono mostrati nella stessa riga. Per i field visibili, `layout.rowId` è il formato canonico del Builder.

## Metadata

```json
[
  { "name": "firstName", "type": "textBox", "layout": { "rowId": "a81f" } },
  { "name": "lastName", "type": "textBox", "layout": { "rowId": "a81f" } },
  { "name": "active", "type": "checkBox", "layout": { "rowId": "a81f", "colSpan": 2 } }
]
```

`rowId` è un identificatore tecnico stabile generato dal client e non è modificabile nell'editor delle proprietà. L'assenza di `colSpan` significa larghezza **AUTO**: i campi AUTO condividono lo spazio residuo. Un `colSpan` intero tra 1 e 12 significa larghezza **CUSTOM** sulla griglia logica a dodici colonne. Il Builder non salva classi CSS o Bootstrap.

La somma dei soli valori CUSTOM di una riga deve essere minore o uguale a 12. I campi AUTO non entrano nella somma e non vengono convertiti in valori numerici. Il salvataggio è bloccato quando una riga supera il limite.

## Compatibilità

- Un field privo di `rowId` è tollerato temporaneamente come riga autonoma/full-width, senza essere mutato o arricchito al caricamento/salvataggio.
- La migrazione dei vecchi form sarà eseguita da una procedura batch amministrativa separata: il Core non contiene logica permanente di migrazione o materializzazione legacy.
- Un layout vuoto e un `colSpan` non intero o fuori dall'intervallo 1–12 vengono omessi dalla normalizzazione; le proprietà non correlate e le compatibilità legacy restano preservate.
- I `hiddenBox` rimangono nella posizione originale dell'array e nella propria riga logica. Sono mostrati in una sezione tecnica gestibile, ma non occupano spazio nella griglia, non espongono AUTO/CUSTOM e non partecipano al calcolo della larghezza.
- Le righe UI vuote non generano pseudo-field né metadata persistiti.

Il `DynamicFormComponent` non interpreta ancora queste righe: l'adeguamento del renderer (per esempio alla resa responsive equivalente a colonne flessibili) è intenzionalmente rinviato a una PR successiva.

## Operazioni

Il Builder permette di aggiungere, eliminare e spostare righe; i campi della riga si spostano insieme. Dentro una riga si possono aggiungere campi, cambiare AUTO/CUSTOM, duplicare, eliminare e spostare a sinistra/destra. Lo spostamento diretto di un campo tra righe non è incluso in questa iterazione: si può duplicare il campo nella riga desiderata e rimuovere l'originale.

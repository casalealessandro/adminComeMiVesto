# ComeMiVesto — configurazione outfitForm: occasion

Questa è la configurazione di **un nuovo elemento** nell'array `json` del documento Forms `outfitForm`, non la risposta HTTP completa (non includere `message`, `data`, `id` o `nameForm` nel campo `json`). Aggiungere l'elemento alla configurazione già esistente senza rimuovere gli altri sei campi.

```json
{
  "name": "occasion",
  "type": "selectBox",
  "typeInput": "selectBox",
  "label": "Occasione",
  "required": false,
  "selectOptions": {
    "multiple": false,
    "displayExp": "value",
    "valueExp": "id",
    "remote": true,
    "api": "outfitOccasions",
    "parent": null,
    "options": []
  }
}
```

Le opzioni sono caricate da `GET /gen/outfitOccasions`, tassonomia condivisa già disponibile nel backend. Il JSON non deve duplicare le opzioni. L'endpoint restituisce un array di oggetti `{ id, value, order, active }`. Attualmente il componente select remoto non esclude automaticamente le voci con `active: false`: valutare separatamente se filtrare la lista attiva, preservando il valore degli outfit storici. Il campo resta facoltativo per compatibilità con outfit storici e API precedenti. Se l'outfit non possiede un'occasione, si visualizza nessuna selezione: non assegnare automaticamente `EVERYDAY` a dati esistenti.

Per aggiornare il form tramite admin Forms: caricare `outfitForm`, inserirvi l'elemento sopra e salvare; verificare tramite GET `/gen/forms/outfitForm`. Il repository non aggiorna automaticamente il documento configurazione su Firebase.

Regola branch: **`main` è il ramo canonico** per ComeMiVesto (mobile, admin e Firebase API). Tutte le future PR, se usate, devono puntare a `main`. `develop` è un alias di compatibilità congelato e allineato a `main`; evitare nuove PR e commit diretti su `develop`. Gli stati storici precedenti all'allineamento del 18 ottobre 2026 sono disponibili nei branch `archive/develop-before-main-sync-20261018`.

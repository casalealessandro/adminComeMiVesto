# Layout & Navigation Core — Phase E.2 navigation boundary

## Obiettivo

Separare la configurazione delle voci di navigazione di ComeMiVesto dal `MenuComponent`, senza cambiare il comportamento del menu.

## Struttura

```text
comeMiVestoNavigation
        ↓
app.config.ts
        ↓
NAVIGATION_ITEMS
        ↓
MenuComponent
```

## Modifiche

- aggiunto `NavigationItem` come contratto minimo delle voci di menu;
- aggiunto `NAVIGATION_ITEMS` come token di configurazione;
- spostato l'array delle voci ComeMiVesto in `app-navigation.ts`;
- registrata la configurazione in `app.config.ts`;
- `MenuComponent` continua ad esporre `allMenu`, ma riceve le voci tramite constructor injection;
- mantenuti invariati ordine, label, path e icone attuali;
- mantenuti invariati `MenuService`, `RouterLink`, `RouterLinkActive`, `ariaCurrentWhenActive`, chiusura del menu e template.

## Confine Starter Kit

Il `MenuComponent` non decide più quali voci appartengono a ComeMiVesto.

Il componente si limita a:

- ricevere le voci;
- renderizzarle;
- gestire lo stato del menu;
- chiudere il menu alla selezione;
- mostrare correttamente la route attiva.

La configurazione applicativa resta nel composition root.

## Test

I test verificano che:

- ComeMiVesto mantenga esattamente le 8 voci e lo stesso ordine;
- il menu continui a renderizzare tutte le voci configurate;
- lo stato Signal introdotto in E.1 resti invariato;
- la selezione continui a chiudere il menu;
- `aria-current` continui a seguire la route attiva;
- una configurazione esterna differente possa essere renderizzata senza modificare `MenuComponent`.

## Non obiettivi

E.2 non modifica:

- routes;
- Auth/RBAC;
- permessi per singola voce;
- Header e profilo;
- responsive e CSS;
- MenuService;
- popup/overlay;
- menu multilivello;
- caricamento menu da backend;
- codice legacy `static-menu` / Nica.

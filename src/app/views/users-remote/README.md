# Utenti Remote — DataGrid laboratory

Questa area è un laboratorio isolato per validare `DataGridComponent` con un vero `GridDataProvider` e API backoffice reali.

La pagina Utenti esistente (`/utenti`) resta invariata ed è la baseline funzionale. Il laboratorio è disponibile su `/utenti-remote` e nel menu come **Utenti Remote (Lab)**.

## Architettura

```text
UsersRemoteComponent
        |
        v
DataGridComponent<UserRemoteGridRow>
        |
        v
DataGridEngine
        |
        v
UserGridProvider
        |
        v
POST /admin/users/grid
```

`UserGridProvider` è l'unico livello che conosce l'endpoint HTTP. La DataGrid continua a usare esclusivamente `GridLoadRequest` / `GridPage`.

## Backend richiesto

Il laboratorio richiede il workstream `firebase-api` su branch:

```text
feat/users-remote-grid-lab
```

Endpoint:

```text
POST /admin/users/grid
```

Autorizzazione: token Firebase valido + ruolo backoffice.

Il vecchio `GET /user/users` non viene modificato e continua a supportare la paginazione Firebase Auth `limit/pageToken` usata dalla pagina Utenti stabile.

## Cosa validare

1. caricamento prima pagina;
2. continuation paging tramite scroll;
3. ricerca globale remota;
4. filtri testuali;
5. filtro static-list sul ruolo;
6. filtri booleani `disabled` / `emailVerified`;
7. filtro data `sameDay`;
8. ordinamento remoto asc/desc;
9. combinazione search + filters + sort;
10. create tramite `DataGridComponent.createProviderRow()`;
11. update profilo tramite `DataGridComponent.updateProviderRow()`;
12. delete tramite il pulsante editor provider e reload autorevole;
13. rollback/stato UI in caso di errore API;
14. viewport desktop;
15. viewport smartphone.

## Limite intenzionale del laboratorio

Firebase Auth `listUsers` non offre search/filter/sort arbitrari. Il backend del laboratorio costruisce quindi il dataset amministrativo server-side, unisce Auth + profilo Firestore e applica la richiesta DataGrid sul server.

Il dataset è limitato intenzionalmente. Se il numero di utenti supera la soglia prevista dal backend, l'endpoint fallisce esplicitamente invece di restituire risultati parziali. In quel caso la soluzione definitiva dovrà essere un read model indicizzato dedicato alla gestione utenti.

## Regola

Non aggiungere sintassi Firebase, Firestore, REST o query-string specifiche dentro `DataGridComponent`, `DataGridEngine` o `DataGridUtils`. Qualsiasi traduzione concreta appartiene al provider o al backend adapter.

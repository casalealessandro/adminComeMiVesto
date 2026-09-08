# Layout & Navigation Core — Phase E.4

## Obiettivo

Ripulire il layout dai residui storici senza riscrivere i componenti attivi e senza cambiare il comportamento corrente dell'applicazione.

Base di lavoro: `develop` @ `254e5991568c4b7fa175230cd742dd2f0a867d81`.

## E.4.1 — Dead legacy removal

Rimossi componenti non più raggiungibili dal runtime corrente:

- `layout/static-menu/`;
- `layout/static-menu-functions/`;
- `layout/footer/`.

`static-menu` dipendeva da servizi e stato utente storici non più presenti nel runtime corrente. `static-menu-functions` conteneva inoltre logiche di dominio non appartenenti a ComeMiVesto. Il Footer non era più montato nel Container ed era hardcoded sull'applicazione.

## E.4.2 — AnagraficaWrapper characterization

`AnagraficaWrapperComponent` è invece un componente attivo e viene mantenuto.

Aggiunta caratterizzazione minima per proteggere:

- Caption e titolo pagina;
- subtitle e tip;
- spinner;
- content projection;
- custom toolbar buttons;
- forwarding degli eventi add, toolbar, search e button input.

Non è stato rinominato e non è stata modificata la sua API attiva.

## E.4.3 — Placeholder Toolbar removal

Rimosso `layout/toolbar/`, che era un vecchio placeholder e non rappresentava la toolbar attualmente usata dall'applicazione.

Rimossi esclusivamente i riferimenti morti collegati da:

- `ContainerComponent`;
- `AnagraficaWrapperComponent`;
- `DataGridComponent`.

La toolbar reale gestita da `CaptionComponent`, `ToolbarButton` e dalla DataGrid non è stata modificata.

## E.4.4 — Container residual cleanup

Rimossi dal Container solamente elementi non più utilizzati:

- import legacy/non runtime;
- `isClose`;
- `idTipoUtente`;
- vecchio `toggleMenu()` ormai sostituito dalla comunicazione diretta `HeaderComponent -> MenuService`;
- vecchio listener resize commentato;
- markup popup commentato.

La logica corrente di autenticazione, breakpoint, apertura/chiusura menu e responsive non è stata modificata.

Il test del Container è stato allineato ai boundary Header introdotti in E.3.

## E.4.5 — Compatibility tail

Rimosso da `UserService` il getter `InfoUtenteConnesso`, rimasto esclusivamente per supportare i widget layout legacy ora eliminati.

Nessuna API utente corrente è stata modificata.

## Layout dopo E.4

```text
layout/
├── anagrafica-wrapper/
├── container/
├── header/
└── menu/
```

Il runtime resta:

```text
AppComponent
├── ContainerComponent
│   ├── HeaderComponent
│   ├── MenuComponent
│   └── RouterOutlet
├── PopupWrapperComponent
└── OverlayComponent
```

## Non obiettivi

E.4 non include:

- rinomina o riscrittura di `AnagraficaWrapperComponent`;
- refactor di `CaptionComponent`;
- refactor della toolbar DataGrid;
- modifiche CSS o responsive;
- modifiche a routes o RBAC;
- modifiche all'architettura Auth;
- modifiche a Popup/Overlay;
- redesign visuale;
- cleanup generale di console log o altro codice non collegato al layout legacy.

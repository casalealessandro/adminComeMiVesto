# Layout & Navigation Core — Phase E.3.3 Header Cleanup

## Scope

E.3.3 rimuove esclusivamente codice legacy/dead rimasto nel `HeaderComponent` dopo i boundary E.3.1 ed E.3.2.

## Cleanup eseguito

Sono stati rimossi:

- `showProfileInfo`;
- `checkRoute()`;
- la dipendenza da `Router`, usata solo dal codice precedente;
- gli import Angular non utilizzati `EventEmitter`, `Input`, `Output` e `output`;
- `provideRouter([])` dal test dell'Header, non più necessario.

## Motivazione

La visibilità dell'Header è già responsabilità del `ContainerComponent`, che monta `<app-header>` solo quando l'utente è autenticato.

`showProfileInfo` non era utilizzato dal template e `checkRoute()` non influenzava quindi alcun comportamento visibile.

## Comportamento preservato

Restano invariati:

- caricamento del profilo tramite `HEADER_USER_PROVIDER`;
- branding tramite `HEADER_CONFIG`;
- hamburger e `MenuService`;
- apertura/chiusura profilo tramite `OverlayService`;
- logout;
- template HTML;
- CSS e responsive;
- struttura del dropdown.

## Non-goals

E.3.3 non modifica:

- `AuthService`;
- `UserService`;
- `MenuService`;
- `OverlayService`;
- `HEADER_CONFIG`;
- `HEADER_USER_PROVIDER`;
- routes/RBAC;
- CSS/responsive;
- Font Awesome;
- `console.log` esistenti;
- struttura visuale dell'Header.

## Risultato

Con E.3.1, E.3.2 ed E.3.3 l'Header mantiene il comportamento attuale ma il Core non contiene più branding, modello utente, accesso backend/auth o stato route-specifico di ComeMiVesto.

# Layout & Navigation Core — Phase E.3.2 Header User/Profile Boundary

## Scope

E.3.2 separa il profilo utente e il logout specifici di ComeMiVesto dal `HeaderComponent`, mantenendo invariato il comportamento visibile dell'Header.

## Boundary introdotto

```text
HeaderComponent
      ↓
HEADER_USER_PROVIDER
      ↑
ComeMiVestoHeaderUserService
      ↓
AuthService + UserService
```

Il Core conosce solo:

- `HeaderUser`;
- `HeaderUserProvider`;
- `HEADER_USER_PROVIDER`.

## HeaderUser

Il contratto contiene solo i dati necessari all'Header:

- `displayName`;
- `profileLabel`;
- `photoURL` opzionale.

`displayName` mantiene il valore usato come testo alternativo dell'avatar.
`profileLabel` mantiene il testo mostrato nel dropdown.

## Adapter ComeMiVesto

`ComeMiVestoHeaderUserService` continua a usare i servizi esistenti senza modificarli:

- `AuthService` per utente autenticato e logout;
- `UserService` per il caricamento del profilo.

La costruzione del testo mostrato nel dropdown resta equivalente al comportamento precedente:

```text
nome + cognome
fallback -> displayName
```

## Comportamento preservato

Restano invariati:

- avatar profilo;
- alt dell'avatar;
- nome mostrato nel dropdown;
- apertura e chiusura Overlay;
- hamburger/menu;
- logout e relativo redirect gestito da AuthService;
- branding introdotto in E.3.1.

## Test

La caratterizzazione dell'Header verifica:

- caricamento tramite provider;
- assenza utente;
- branding;
- toggle menu;
- Overlay;
- logout delegato al provider.

L'adapter ComeMiVesto verifica:

- mapping del profilo applicativo nel contratto generico;
- fallback del profile label;
- nessuna richiesta profilo senza utente autenticato;
- delega logout ad AuthService.

## Non-goals

E.3.2 non modifica:

- implementazione interna di `AuthService`;
- implementazione interna di `UserService`;
- RBAC;
- routes;
- `MenuService`;
- `OverlayService`;
- CSS/responsive;
- Font Awesome;
- `showProfileInfo` / `checkRoute`;
- import legacy non collegati al boundary;
- struttura generale dell'Header.

## Passo successivo

E.3.3 potrà rimuovere esclusivamente il codice legacy/dead dell'Header già identificato, senza cambiare il boundary introdotto in E.3.1/E.3.2.

# Layout & Navigation Core — Phase E.3.1 Header Branding Boundary

## Scope

E.3.1 separa la configurazione grafica specifica di ComeMiVesto dal `HeaderComponent`, senza cambiare il comportamento dell'Header.

## Boundary introdotto

```text
comeMiVestoHeaderConfig
        ↓
   app.config.ts
        ↓
    HEADER_CONFIG
        ↓
  HeaderComponent
```

Il contratto `HeaderConfig` contiene solo:

- `logoUrl`;
- `logoAlt`;
- `defaultAvatarUrl`.

## Comportamento preservato

ComeMiVesto continua a usare:

- `assets/images/logo.jpg` come logo;
- `Logo` come testo alternativo;
- `https://ionicframework.com/docs/img/demos/avatar.svg` come avatar di fallback.

La struttura HTML dell'Header, il menu hamburger, il profilo, il dropdown, OverlayService e logout non cambiano.

## Test

Il test dell'Header mantiene la caratterizzazione precedente e aggiunge la verifica che logo e avatar di fallback arrivino da `HEADER_CONFIG`.

## Non-goals

E.3.1 non modifica:

- `UserProfile`;
- `UserService`;
- `AuthService`;
- logout;
- `OverlayService`;
- `MenuService`;
- responsive e CSS;
- routes;
- RBAC;
- Font Awesome;
- `showProfileInfo` / `checkRoute`;
- struttura generale del template.

## Passo successivo

E.3.2 separerà il profilo utente e il logout dal Core attraverso un piccolo provider/adapter, mantenendo invariato il comportamento visibile dell'Header.

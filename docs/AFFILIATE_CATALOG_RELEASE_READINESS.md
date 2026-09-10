# Affiliate Catalog — Phase J Release Readiness

## Obiettivo

Phase J non introduce nuove funzionalità. Chiude il Catalogo Affiliati con una verifica ripetibile dei contratti frontend, dei ruoli backoffice, dei flussi di lettura/scrittura e con una checklist E2E da eseguire contro `apiDev` prima del rilascio.

Baseline di avvio: `develop@86b2758704f608bdad7700238b3a7eaa8fd88c48`.

## Gate automatici

La release è tecnicamente pronta quando risultano verdi:

- Affiliate Catalog unit tests.
- `AffiliateCatalogService` contract tests per tutti gli endpoint frontend supportati.
- `authGuard` release tests: admin/editor ammessi, creator negato, anonimo reindirizzato al login, `401` con pulizia sessione.
- Angular development build.
- Starter Kit Core dependency boundary e DataGrid tests quando attivati dai path del cambiamento.

Il deploy del Firebase Hosting preview non è un gate applicativo finché permane il noto errore infrastrutturale `429 RESOURCE_EXHAUSTED` per quota preview channels, purché lo step di build precedente sia verde.

## Contratti frontend da preservare

Base: `${environment.apiBaseUrl}/admin/affiliate`.

### Programmi

- `GET /programs`
- `GET /programs/:id`
- `POST /programs`
- `PUT /programs/:id`

Admin: lettura + create/update.
Editor: sola lettura dalla UI.

### Feed

- `GET /feeds`
- `GET /feeds/:id`
- `POST /feeds`
- `PUT /feeds/:id`
- `POST /feeds/:id/sync`

Admin: lettura + create/update + sync manuale.
Editor: sola lettura dalla UI.
Non esiste delete Feed nel contratto corrente.

### Prodotti

- `GET /products?limit=&cursor=`
- `GET /products/:id`

Sola lettura. La paginazione è cursor-based e il frontend non deve inventare search/filter/sort server-side non supportati.

### Sync Runs

- `GET /sync-runs?limit=&cursor=`
- `GET /sync-runs/:id`

Sola lettura. L'ordine è quello restituito dal backend; il frontend non deve riordinare localmente come fonte autorevole.

## Smoke test E2E su apiDev — Admin

Usare un account con claim `admin` e backoffice abilitato.

1. Login e accesso a `/affiliate-catalog`.
   - Atteso: accesso consentito e redirect iniziale a `programs`.
2. Programmi.
   - Verificare caricamento lista.
   - Creare un programma di test o modificare un programma già predisposto.
   - Atteso: risposta coerente e refresh UI senza errori.
3. Feed.
   - Verificare caricamento lista e lookup programma.
   - Creare/modificare un feed di test.
   - Atteso: campi immutabili non modificabili in edit.
4. Sync manuale.
   - Usare un feed enabled associato a un programma enabled con network status `ACTIVE`.
   - Confermare la sync.
   - Atteso: richiesta accodata, risposta `202`, run iniziale `QUEUED` e messaggio UI “Sincronizzazione accodata”.
   - Ripetere mentre la stessa sync è attiva.
   - Atteso: `409` gestito come conflitto/sincronizzazione già attiva.
5. Sync Runs.
   - Verificare che la run appena accodata compaia secondo l'ordine backend.
   - Aprire il dettaglio e verificare stato, contatori, date, programma/feed ed eventuali errori.
6. Prodotti.
   - Verificare prima pagina.
   - Se `hasMore=true`, usare “Carica altri” e verificare append senza duplicati.
   - Aprire un dettaglio e verificare immagini, brand/nome, categorie, materiali, source feed e date.
7. Responsive.
   - Ripetere almeno Programmi, Feed, Prodotti e Sync Runs a larghezza smartphone.
   - Atteso: card/mobile layout fruibile, pulsanti >= 44px, nessuna regressione di navigazione.

## Smoke test E2E su apiDev — Editor

Usare un account con claim `editor` e backoffice abilitato.

1. Login e accesso a `/affiliate-catalog`.
   - Atteso: accesso consentito.
2. Programmi.
   - Atteso: lista visibile; nessuna azione create/edit.
3. Feed.
   - Atteso: lista visibile; nessuna azione create/edit/sync.
4. Prodotti e Sync Runs.
   - Atteso: liste e dettagli consultabili in sola lettura.

## Smoke test autorizzazione — Creator / anonimo

- `creator`: accesso backoffice negato e redirect a `/access-denied`.
- utente non autenticato: redirect a `/login`.
- risposta `401` dal role endpoint: logout sessione locale e redirect a `/login`.

## Checklist di chiusura

- [ ] CI Affiliate Catalog verde.
- [ ] Angular development build verde.
- [ ] Smoke Admin completato su `apiDev`.
- [ ] Smoke Editor completato su `apiDev`.
- [ ] Creator/anonimo verificati.
- [ ] Responsive smartphone verificato.
- [ ] Vecchi entry point Tradedoubler non presenti nel tree corrente.
- [ ] Vecchia credenziale Tradedoubler revocata/ruotata lato provider.

Quando tutti gli elementi sopra sono completati, il Catalogo Affiliati può essere considerato release-ready senza ulteriori feature obbligatorie.

## Debito tecnico non bloccante

Da gestire separatamente dal Catalogo Affiliati:

- quota Firebase Hosting preview channels (`429 RESOURCE_EXHAUSTED`);
- dipendenze segnalate da `npm audit`;
- migrazione delle GitHub Actions che ancora dichiarano runtime Node 20 verso action/runtime supportati.

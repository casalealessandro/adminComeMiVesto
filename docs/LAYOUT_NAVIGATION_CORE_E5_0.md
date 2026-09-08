# Layout & Navigation Core — Phase E.5.0

## Obiettivo

Creare la baseline di caratterizzazione responsive finale della shell prima di qualunque correzione E.5.

Base di lavoro: `develop` @ `e6e1a0f209d8d97d65679318edf35b42eb0ed6d6`.

E.5.0 modifica esclusivamente test e documentazione. Nessun TypeScript/HTML/SCSS di produzione viene modificato.

## Contratto responsive corrente

La policy runtime di `ContainerComponent` usa Angular CDK `BreakpointObserver`:

```text
XSmall -> mode=over  + menu closed
Small  -> mode=over  + menu closed
Medium -> mode=side  + menu open
Large  -> mode=push  + menu open
other/unmatched observed desktop -> mode=push + menu open
```

Prima della subscription ai breakpoint, `ngOnInit()` applica anche la soglia storica:

```text
window.innerWidth > 1024 -> menu open
window.innerWidth <= 1024 -> menu closed
```

La subscription CDK resta quindi la policy principale osservata durante il runtime, ma esistono due meccanismi responsive sovrapposti.

## Contratto DOM corrente

Quando l'utente è autenticato la shell monta sempre:

```text
HeaderComponent
verticalMenucontainer
  -> MenuComponent
RouterOutlet
```

Lo stato aperto/chiuso è rappresentato dalla classe `open` su `.verticalMenucontainer`.

In modalità `over`, quando il menu è aperto, viene inoltre renderizzato `.menu-backdrop`.

Le classi applicate al root `.mi-container` sono:

```text
menu-over
menu-side
menu-push
```

## Contratto CSS corrente

### Header

L'header ha altezza corrente di `65px`.

### Menu shell

`.verticalMenucontainer` è fixed e parte da `top: 65px`.

### Content area

In `side`:

```text
margin-left: 100px
width: calc(100% - 100px)
```

In `push`:

```text
margin-left: 250px
width: calc(100% - 250px)
```

### Mobile transform

La regola che sposta realmente `.verticalMenucontainer` fuori schermo è oggi limitata a:

```text
@media (max-width: 767px)
```

Quando `open` viene applicata, la trasformazione torna a `translateX(0)`.

## Finding E.5.0 — da verificare, non correggere qui

### R1 — CDK Small vs media query 767px

Il CDK classifica `Small` come modalità `over`, ma il transform CSS della shell menu è applicato solo fino a `767px`.

Esiste quindi una fascia critica approssimativa:

```text
768px .. 959px
```

nella quale il runtime richiede `over + closed`, ma la regola CSS che nasconde `.verticalMenucontainer` non è applicata.

Questo è il principale candidato a regressione responsive da verificare in browser nella fase successiva.

### R2 — selector parent verso internals di MenuComponent

`container.component.scss` contiene anche:

```text
.menu-over .menu-container { ... }
```

ma `.menu-container` appartiene al template interno di `MenuComponent`.

Con l'emulated view encapsulation di Angular, il selector del parent non deve essere considerato affidabile per pilotare gli internals del child senza una verifica runtime esplicita.

E.5.0 lo registra come finding; non cambia l'encapsulation e non introduce `::ng-deep` o altre scorciatoie.

### R3 — Medium side width da verificare

In modalità `side` il contenuto viene spostato di `100px`, mentre `MenuComponent` non dichiara nel proprio SCSS una larghezza esplicita di 100px né una regola responsive che nasconda le label.

Va verificato a viewport Medium che il menu reale non sovrapponga la content area.

### R4 — doppia ownership responsive

`updateMenuVisibility(window.innerWidth)` usa la soglia 1024px, mentre `BreakpointObserver` usa i breakpoint CDK XSmall/Small/Medium/Large.

Il codice corrente chiama prima `updateMenuVisibility()` e poi sottoscrive il BreakpointObserver. Non viene modificato in E.5.0.

Una semplificazione può essere valutata soltanto dopo aver verificato il comportamento reale e l'ordine effettivo degli eventi.

### R5 — XLarge/fallback

`BreakpointObserver` osserva XSmall, Small, Medium e Large, ma non XLarge. Quando nessuno dei breakpoint osservati è attivo il codice cade nell'`else` e mantiene:

```text
mode=push
menu=open
```

Questo comportamento è ora caratterizzato esplicitamente come fallback desktop/ultrawide.

## Test aggiunti in E.5.0

Nuovo file:

```text
src/app/layout/container/container.responsive.spec.ts
```

Copertura:

- mapping XSmall/Small/Medium/Large -> classi `menu-over/menu-side/menu-push`;
- shell autenticata Small montata ma senza classe `open` e senza backdrop;
- apertura esplicita in `over` -> classe `open` + backdrop;
- soglia storica 1024/1025 di `updateMenuVisibility()`;
- fallback senza breakpoint osservato -> `push + open`.

Questi test proteggono il contratto TypeScript/DOM, non sostituiscono una verifica visuale/computed-style a viewport reale.

## Matrice runtime da usare nella fase successiva

La verifica responsive reale deve coprire almeno:

```text
375px   telefono piccolo
430px   telefono grande
600px   ingresso Small
767px   ultimo pixel della media query mobile corrente
768px   primo pixel fuori dalla media query mobile corrente
820px   tablet portrait
959px   fine fascia Small
960px   ingresso Medium
1024px  soglia storica updateMenuVisibility
1279px  fine fascia Medium
1280px  ingresso Large
1440px  desktop
1920px  desktop wide
2560px  ultrawide
```

Per ogni fascia verificare:

- header visibile e non sovrapposto;
- hamburger utilizzabile;
- menu realmente nascosto quando `closed`;
- menu realmente visibile quando `open`;
- backdrop presente solo in `over + open`;
- click backdrop chiude il menu;
- content area non coperta dal menu;
- nessun overflow orizzontale inatteso;
- navigazione chiude il menu dove previsto;
- layout utilizzabile touch/mobile;
- comportamento desktop e ultrawide invariato.

## Non obiettivi

E.5.0 non include:

- fix CSS;
- modifica breakpoint;
- rimozione di `updateMenuVisibility()`;
- modifica MenuService;
- modifica Header/Menu/Container runtime;
- redesign visuale;
- nuove animazioni;
- refactor dell'encapsulation;
- modifiche routes/RBAC/Auth;
- modifiche Popup/Overlay;
- modifiche DataGrid/Form/feature ComeMiVesto.

## Criterio di chiusura E.5.0

E.5.0 è chiusa quando:

1. la policy responsive corrente è protetta da characterization automatica;
2. i gap tra policy CDK e CSS sono documentati;
3. esiste una matrice viewport precisa per la verifica runtime;
4. nessun comportamento di produzione è stato modificato.

La fase successiva deve intervenire solo sui difetti responsive confermati dalla verifica runtime.

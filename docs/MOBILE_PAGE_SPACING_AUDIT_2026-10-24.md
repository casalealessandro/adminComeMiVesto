# Mobile page spacing audit — 24 October 2026

## Scope and evidence

Target: `adminComeMiVesto/main`; mobile viewports up to 767.98 CSS pixels.
An iPhone screenshot of Affiliate Catalog > Intelligenza Fashion showed excessive nested
horizontal whitespace. Static code inspection found cumulative gutters from
`ContainerComponent`, `AnagraficaWrapperComponent`, `AffiliateCatalogComponent`,
and Bootstrap `container-fluid`, as well as a second nested card border in `.wrapForm`.
Standalone screens (Users, Reports, Notifications and Colors) use their own page spacing.

## Implementation contract

- Host theme owns `--cmv-mobile-page-gutter` and `--cmv-mobile-content-inset` (both 0.75rem).
- Core Container owns the outer mobile gutter.
- Core AnagraficaWrapper keeps one outer surface plus a single mobile inset.
  Its nested `.wrapForm` drops redundant padding and border on regular admin pages.
- Login retains its original form spacing.
- Affiliate Catalog drops its extra mobile shell inset; Fashion Enrichment and
  Catalog Audit cancel the additional Bootstrap `container-fluid` gutter.
- Standalone admin pages align with the same mobile inset contract.
- DynamicForm, DataGrid, Header, popups/overlays, card contents and desktop
  styling are intentionally unchanged.
- Avoid global element overrides or blanket `overflow-x: hidden` rules.

## Expected effect (browser validation required)

At a 390px CSS viewport, the original stacked declarations contributed roughly
58px per side on Fashion Enrichment. The revised layout targets about 24px per side,
plus borders. These figures are from source CSS, **not measured browser pixels**.

## Regression checklist

- Compare before/after at 320, 375, 390, 430, 768 and 1024 CSS pixels.
- Check Dashboard, Affiliate Catalog (Programmi, Feed, Prodotti, Fashion,
  Analisi, Preview AI), Utenti, Outfit, Segnalazioni, Notifiche, Colori,
  Form Builder and Login.
- Verify no unintended page-wide horizontal scrolling. Horizontal tab navigation
  and DataGrid scrolling must continue to work when intended.
- Check long titles, wrapping notices, button rows, searches, selects, card
  readability and minimum 44px touch targets.
- Confirm Login spacing, popup sizes, overlays and focus appearance are unchanged.
- Desktop (>767.98px) should remain visually unchanged.
- Run `npm run build -- --configuration production`,
  `npm run test:core-boundaries` and relevant Karma suites.

## Rollback

Revert this PR/commit. No data migrations or changes to Firebase rules,
backend, API, auth or catalog workflows are included.

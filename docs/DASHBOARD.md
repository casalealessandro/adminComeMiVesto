# Dashboard operativa

La dashboard V1 usa esclusivamente il backend HTTP e non introduce nuove letture Firestore dirette.

## Contratto

Il frontend chiama:

```http
GET /admin/dashboard/summary
```

tramite `DashboardService`. Il bearer token viene aggiunto dal normale interceptor HTTP dell'admin.

## Widget V1

- KPI utenti totali + nuovi negli ultimi 7 giorni;
- KPI outfit totali + nuovi negli ultimi 7 giorni;
- KPI elementi da controllare;
- KPI outfit approvati;
- pannello `Richiede attenzione` per outfit pending e report aperti;
- stato outfit con barre percentuali leggere, senza librerie chart aggiuntive;
- attività recente aggregata da utenti, outfit e report;
- azioni rapide verso utenti, outfit, report e categorie.

## Responsive

Le card passano da quattro colonne su desktop a due su tablet e una su smartphone. I pannelli principali diventano a colonna sotto i 992px e la timeline riorganizza timestamp e contenuto sui display piccoli.

## Evoluzione

Chart.js non viene introdotto nella V1. Verrà valutato quando saranno disponibili serie temporali reali (ad esempio registrazioni 30 giorni) e metriche Affiliate Catalog. La dashboard non deve mostrare dati fittizi per funzionalità non ancora implementate.

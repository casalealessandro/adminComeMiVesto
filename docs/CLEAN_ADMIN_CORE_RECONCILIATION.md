# Clean Admin Core reconciliation

## Scope

This phase reconciles the still-divergent `refactor/clean-admin-core` branch with the current `develop` baseline after Phase F closure.

Current baseline:

- `develop` @ `2f0be457b72e18bc0a530325f305f0c405ecd104`;
- `refactor/clean-admin-core` remains divergent and must not be merged wholesale;
- reconciliation is selective: recover still-valid reusable Core work, preserve current stabilized runtime, and discard stale application-specific changes.

## 1. Why reconciliation is required

The old clean branch was not fully absorbed by `develop`.

The branch comparison showed two independent histories:

- current `develop` contains the later stabilization work for Forms, Popup, Layout/Navigation and UI Infrastructure;
- `refactor/clean-admin-core` still contains exclusive DataGrid Core abstractions/tests and repository cleanup work.

A direct merge would mix valuable reusable work with stale application changes and old generated-artifact deletions. Therefore this phase uses review-and-port, not branch merge.

## 2. Classification

### A — recover / verify first

High-value reusable Core work from the clean branch:

- `DataGridEngine` provider-neutral orchestration;
- `GridDataProvider` contracts;
- typed filter/search/sort model;
- detail provider contract;
- lookup provider/registry;
- CRUD event contracts;
- `DataGridUtils` pure helpers;
- focused DataGrid regression suites;
- dedicated DataGrid CI workflow and test script;
- DataGrid architecture/public-API documentation.

These pieces match the Starter Kit direction but must be replayed against the current stabilized `develop` implementation, not copied blindly.

### B — recover as repository hygiene

Safe cleanup intent from the clean branch:

- ignore `.firebase/` generated state;
- ignore `dist/` build output;
- ignore generated `documentation/`;
- ignore `*.log`;
- ignore `src/app.zip`;
- ignore component zip artifacts.

The ignore rules are restored first. Removal of already-tracked generated files will be handled as a dedicated cleanup slice so functional reconciliation remains reviewable.

### C — review individually, do not import automatically

Application/domain changes present on the old branch:

- product-feed removals;
- outfit-related service/view changes;
- user remote examples/views;
- route changes;
- service removals or replacements tied to ComeMiVesto behavior.

These may represent old experiments or obsolete assumptions. They are not part of Core reconciliation unless current `develop` analysis proves they are still required.

## 3. DataGrid reconciliation strategy

The clean branch architecture describes one real Angular grid component:

```text
DataGridComponent<T>
  Angular / UX / DOM / public runtime facade
        |
        v
DataGridEngine<T>
  provider-neutral state and orchestration
        |
        v
GridDataProvider<T>

DataGridUtils
  pure/stateless helpers

GridLookupRegistry
  provider registration/cache/dedup/resolution
```

Important compatibility rule from the old work:

- keep `<app-data-grid>` as the single runtime selector;
- preserve the historical `AnagraficaService` path as fallback;
- do not introduce backend-specific Firebase/REST/OData syntax into the reusable grid core;
- preserve public methods and UI behavior while moving provider-neutral state/orchestration out of the component.

The reconciliation therefore starts with characterization of current `develop` DataGrid APIs and consumers, followed by small porting slices. No wholesale replacement of `data-grid.component.ts` is allowed.

## 4. Planned slices

1. **R.0 — reconciliation map + hygiene baseline**
   - restore ignore rules;
   - document branch divergence and recovery categories;
   - no production runtime change.

2. **R.1 — DataGrid contracts and pure helpers**
   - compare current DataGrid public API against clean-branch contracts;
   - port provider/filter/detail/lookup/CRUD contracts and pure utilities only where still compatible;
   - add focused tests before wiring runtime behavior.

3. **R.2 — DataGrid Engine**
   - port provider-neutral orchestration incrementally;
   - preserve current UI/component behavior and legacy fallback.

4. **R.3 — DataGrid runtime facade integration**
   - wire current `DataGridComponent` to the reconciled Engine/registry;
   - keep one `<app-data-grid>` runtime component;
   - migrate provider tests to the shared component.

5. **R.4 — DataGrid CI + documentation closure**
   - restore dedicated DataGrid test command/workflow if still appropriate;
   - restore/update architecture and public API documentation against the reconciled code.

6. **R.5 — tracked generated-artifact cleanup**
   - remove tracked `dist/`, generated `documentation/`, caches/logs/zips in a separate non-functional PR;
   - verify Firebase hosting/build workflow does not depend on committed build output.

7. **R.6 — stale application delta review**
   - inspect remaining old-branch application changes one by one;
   - recover only changes still justified by current ComeMiVesto requirements.

## 5. Non-goals

This reconciliation does not:

- merge `refactor/clean-admin-core` wholesale;
- reset `develop` to the old branch;
- remove current Forms/Popup/Layout/UI Infrastructure work;
- redesign DataGrid UX;
- remove legacy compatibility paths without characterization;
- split the repository into a Starter Kit repo yet;
- import old ComeMiVesto feature removals automatically.

## 6. Exit criterion

Reconciliation is complete when all still-valid reusable Core work from `refactor/clean-admin-core` has either been selectively ported or explicitly rejected, repository hygiene is normalized, and the old branch no longer contains unclassified work required for the future Starter Kit.

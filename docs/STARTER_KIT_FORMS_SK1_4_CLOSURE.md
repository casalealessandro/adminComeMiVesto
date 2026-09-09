# Starter Kit Forms — SK.1.4 Closure

## Baseline

- Repository: `casalealessandro/adminComeMiVesto`
- Branch baseline: `develop`
- Commit: `b923a11d33c396c677e2dae5ba3d98a3e6cdea0d`
- Previous phase: SK.1.3 Forms Contract Decoupling, merged via PR #60

## Scope

This document closes the Starter Kit analysis for the Forms capability after the conservative contract decoupling completed in SK.1.3.

This phase does not change production code, routes, payloads, APIs, metadata, tests, UX or runtime behavior.

## Closure decision

**Forms can be considered a logical Starter Kit/Core capability.**

The current Forms area no longer requires direct knowledge of the ComeMiVesto backend implementation in its reusable components. The concrete HTTP knowledge remains in `FormService`, while reusable consumers depend on Core-facing contracts.

This is sufficient to close the Forms boundary work before any future physical extraction into a dedicated Core folder, Angular library, package or repository.

## Capability included in the Starter Kit

The following behavior remains part of the reusable Forms capability:

- DynamicForm renderer;
- DynamicFormField metadata model and normalization;
- validators already supported by DynamicForm;
- DynamicSelectBox;
- DynamicRadioBox;
- DynamicFileBox;
- local and remote option loading behavior already supported;
- cascade behavior already supported;
- FormBuilder;
- Element property editor;
- Form List / Form Manager;
- CRUD of form definitions;
- submit/cancel event contract used by DynamicForm consumers.

No new Forms feature is introduced by this classification.

## Dependency state after SK.1.3

### DynamicForm

`DynamicFormComponent` depends on:

- Angular Forms/Common;
- `DynamicFormField`;
- `FORM_DEFINITION_REPOSITORY`;
- Dynamic Select/Radio/File components;
- shared Starter Kit UI primitives such as dialogs and custom scrollbar.

It no longer imports or injects `FormService` directly.

It does not know:

- `environment.apiBaseUrl`;
- `/gen/forms`;
- Firebase/AngularFire;
- ComeMiVesto domain services;
- User/Outfit/Taxonomy/Report models or endpoints.

### Dynamic Select and Dynamic Radio

`DynamicSelectBoxComponent` and `DynamicRadioBoxComponent` depend on `FORM_OPTIONS_PROVIDER` for the existing `getData(api, queryString)` behavior.

They do not know how the host application translates that request into an HTTP URL.

The current ComeMiVesto translation to `/gen/{api}` remains entirely behind the existing `FormService` implementation.

### Dynamic File

`DynamicFileBoxComponent` is browser-side UI logic based on Angular Forms and browser file/image APIs.

It has no ComeMiVesto service, environment, Firebase or backend dependency.

### FormBuilder

`FormBuilderComponent` now depends on `FORM_DEFINITION_REPOSITORY` for definition persistence.

Its other dependencies are Angular Router and already-existing shared UI infrastructure (`PopUpService`, dialogs, layout wrapper).

The builder does not know the current `/gen/forms` endpoint or HTTP implementation.

### Form List / Form Manager

`AppFormListComponent` now depends on `FORM_DEFINITION_REPOSITORY` for list/delete behavior.

Navigation to `form-builder` remains part of the Forms utility hosting flow and does not contain ComeMiVesto domain knowledge.

### Element property editor

`ElementComponent` works on `DynamicFormField` metadata and shared UI primitives.

It has no backend, Firebase, environment or ComeMiVesto domain dependency.

The historical `DataGridComponent` import currently present in the TypeScript file is not used by the standalone component imports and is treated as repository/code hygiene only. It is not a reason to perform a Forms refactor in this phase.

## Core contracts

### Form definition persistence

`FORM_DEFINITION_REPOSITORY` exposes only the behavior already required by the current Forms feature:

- `getForms()`;
- `getFormById(formId)`;
- `getFormFields(formId)`;
- `saveForm(formId, form)`;
- `deleteForm(formId)`.

The contract contains no endpoint, Firebase or ComeMiVesto-specific knowledge.

### Remote field options

`FORM_OPTIONS_PROVIDER` exposes the existing:

- `getData(api, queryString?)`.

The naming and method shape are intentionally retained from the historical code to avoid redesign during the conservative decoupling.

A future redesign of datasource metadata is explicitly outside SK.1.

## Application adapter and composition root

`FormService` remains the concrete ComeMiVesto implementation.

It still owns the existing HTTP behavior, including:

- `environment.apiBaseUrl`;
- `/gen/forms`;
- `/gen/{api}`;
- current GET/POST/PUT/DELETE behavior;
- current response parsing and metadata normalization.

`app.config.ts` is the composition root that binds:

```ts
{ provide: FORM_DEFINITION_REPOSITORY, useExisting: FormService }
{ provide: FORM_OPTIONS_PROVIDER, useExisting: FormService }
```

This produces the intended dependency direction:

```text
Forms Starter Kit/Core
        |
        v
Core contracts
        ^
        |
FormService (ComeMiVesto adapter)
        |
        v
ComeMiVesto backend
```

The reusable Forms components do not depend back on the application adapter.

## Routing boundary

The application currently registers:

- `form-list`;
- `form-builder/:id`.

The host application also applies its current `authGuard` to those routes.

This is considered a valid hosting boundary:

- Forms owns the utility screens and their internal navigation;
- the application owns route registration and access-control policy.

The literal Forms route names are not ComeMiVesto domain routes and are not considered a blocker for logical Core closure.

If Forms is physically extracted in a later phase, route packaging/configuration can be reconsidered then. It must not be refactored pre-emptively in SK.1.4.

## Forbidden dependency check

No current reusable Forms component requires direct knowledge of:

- `environment`;
- AngularFire/Firebase;
- `AuthService`;
- `UserService`;
- `OutfitService`;
- taxonomy/report/product services;
- ComeMiVesto domain models;
- `/gen/forms` or `/gen/{api}` URL construction.

The concrete HTTP/API knowledge is confined to the host-side `FormService` and composition root wiring.

## Compatibility constraints retained

The following must remain unchanged unless a dedicated future feature/refactor is explicitly approved:

- current DynamicForm inputs/outputs;
- current metadata shape;
- field type names;
- validator behavior;
- false/zero/null handling already characterized by tests;
- radio/select cascade semantics;
- remote option `api` and parent path behavior;
- FormBuilder create/update behavior;
- generated technical form IDs;
- `/form-list` and `/form-builder/:id` current user flow;
- `/gen/forms` backend contract;
- `/gen/{api}` current ComeMiVesto adapter behavior.

## Verification evidence

PR #60 completed the Firebase Hosting PR workflow successfully, including dependency installation and Angular development preview build.

The existing Forms characterization and integration specs were updated only for DI wiring so that their behavioral assertions remain unchanged.

Important limitation: the current PR workflow performs build/deploy but does not execute the full `ng test` Karma suite. Therefore SK.1.4 records successful compile/build evidence and preservation of the existing test suite, but does not claim that the full Karma suite was executed by CI during PR #60.

## Non-blocking historical/hygiene items

The following are deliberately not addressed here:

- historical variable names such as `formService` / `templateService` when the injected object is now a contract;
- unused imports in older Forms files;
- physical location under `views/`, `components/`, `services/`;
- duplication/renaming opportunities between historical `StoredForm` and the new Core-facing `FormDefinition` type;
- generated Compodoc documentation that may describe an older repository state;
- route packaging for a future Angular library;
- datasource API redesign;
- stronger typing of historical `any` values.

Cleaning these items now would be a separate refactor and would violate the conservative scope of SK.1.

## Final status

| Area | Status | Notes |
| --- | --- | --- |
| DynamicForm | ✅ Core-ready logically | Uses definition contract |
| DynamicSelectBox | ✅ Core-ready logically | Uses options contract |
| DynamicRadioBox | ✅ Core-ready logically | Uses options contract |
| DynamicFileBox | ✅ Core-ready logically | Browser/UI only |
| FormBuilder | ✅ Core-ready logically | Persistence decoupled; host routing retained |
| Element editor | ✅ Core-ready logically | Metadata/UI only |
| Form List | ✅ Core-ready logically | Persistence decoupled; Forms navigation retained |
| Form definition CRUD | ✅ Starter Kit capability | Transport is replaceable through contract |
| Remote options | ✅ Starter Kit capability | Transport is replaceable through contract |
| FormService | 🔵 Application adapter | Keeps current ComeMiVesto HTTP behavior |
| app.config.ts | 🔵 Composition root | Binds Core contracts to FormService |
| app.routes.ts / authGuard | 🔵 Host responsibility | Registers/protects Forms utility routes |

## SK.1 Forms closure

**SK.1 Forms is closed.**

No additional Forms code change is required before moving to the next Starter Kit area.

Physical extraction/reorganization belongs to a later Starter Kit phase and must only happen after the other candidate Core areas have been mapped and stabilized with the same conservative approach.

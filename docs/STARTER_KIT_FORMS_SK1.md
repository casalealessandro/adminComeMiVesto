# Starter Kit Forms — SK.1 Core/Application Boundary

## Scope

This document closes the **SK.1 analysis for Forms** against:

- repository: `casalealessandro/adminComeMiVesto`;
- baseline: `develop` @ `f60d7d02aa5d18d822a2967c415a4864d2837705`;
- reconciliation PR #58 already closed and not reopened by this phase.

SK.1 is intentionally **analysis-only**. It does not move production files, rename services, introduce new runtime abstractions, change routes, change APIs, change persistence, or alter Forms behavior.

The goal is to determine whether the existing Forms architecture is coherent with the Starter Kit direction and identify the exact boundary between reusable Forms capability and ComeMiVesto-specific infrastructure.

---

## 1. Product intent

The intended Forms capability of the Starter Kit is not only a renderer.

The reusable feature is the complete workflow that allows an administrator/developer to avoid writing every form manually:

1. list the available form definitions;
2. create a new form definition;
3. edit an existing form definition;
4. configure field properties;
5. save/delete form definitions;
6. render a saved definition as a runtime dynamic form;
7. emit the compiled business data to the consuming application.

Therefore the following concepts belong to the Starter Kit capability:

- `DynamicFormComponent`;
- `FormBuilderComponent`;
- the form-definition management/list screen;
- `DynamicFormField` and related field metadata;
- normalization and legacy metadata compatibility;
- field editors and supported field types;
- validation behavior;
- local/remote select and radio behavior;
- cascade behavior;
- CRUD semantics for **form definitions**.

The persistence of the **business entity produced by a form** remains the responsibility of the consuming application.

---

## 2. Current Forms architecture

### 2.1 Form model

`src/app/interface/dynamic-form-field.ts`

Defines the reusable metadata contract for:

- textBox;
- textArea;
- selectBox;
- radio;
- checkBox;
- fileBox;
- hiddenBox;
- validators and bounds;
- select/radio source metadata;
- cascade parent metadata;
- file constraints;
- canonical camelCase normalization of supported legacy spellings.

This file has no dependency on Firebase, `environment`, ComeMiVesto domain models, or backend endpoints.

**Classification: Core.**

### 2.2 Runtime renderer

`src/app/components/dynamic-form/dynamic-form.component.ts`

Responsibilities currently include:

- load a form definition by the `service` input;
- build Angular reactive controls;
- apply validators;
- initialize edit/insert state;
- manage parent values for cascade fields;
- emit submit/cancel and functional-button events.

The business DTO is not persisted directly by the component: submission is emitted to the consumer.

Reusable runtime behavior is therefore already aligned with the Starter Kit intent.

Current boundary dependency:

- directly injects concrete `FormService` to load form metadata.

**Classification: Core behavior with a concrete infrastructure dependency.**

### 2.3 FormBuilder

`src/app/views/form-builder/form-builder.component.ts`

Reusable responsibilities:

- field palette;
- add/remove fields;
- move/reorder fields;
- duplicate fields;
- open the property editor through Popup Core;
- validate the form name;
- reject duplicate field names;
- normalize field metadata;
- build the stored form payload.

Current boundary dependencies:

- directly injects `FormService` for load/save;
- reads `formId` from `ActivatedRoute`;
- directly navigates to `/form-list`.

The editing mechanics are Starter Kit capability. Persistence and route hosting are boundary concerns.

**Classification: Core feature hosted by the application, with persistence/navigation coupling.**

### 2.4 Form definition manager

`src/app/views/app-views/app-form-list.component.ts`

Responsibilities:

- list stored form definitions;
- open creation;
- open editing;
- delete a definition;
- update the local list after deletion.

These are the management CRUD semantics required by the FormBuilder utility.

Current boundary dependencies:

- directly injects `FormService`;
- directly navigates to `/form-builder/:id`.

**Classification: Core management feature hosted by the application, with persistence/navigation coupling.**

### 2.5 FormService

`src/app/services/form.service.ts`

The current service contains multiple distinct responsibilities:

#### Reusable form-definition semantics

- `StoredForm` model;
- `parseFields()` normalization/parsing;
- `getForms()`;
- `getFormById()`;
- `getFormFields()`;
- `saveForm()`;
- `deleteForm()`.

The CRUD semantics themselves are required by the Starter Kit Forms capability.

#### ComeMiVesto HTTP implementation

The service also directly knows:

- `environment.apiBaseUrl`;
- `/gen/forms`;
- response mapping for the current backend;
- POST/PUT/DELETE HTTP behavior;
- `/gen/{api}{queryString}` for remote field data.

Those details describe the current host application/backend protocol, not a portable Forms contract.

**Classification: mixed boundary. The CRUD capability is Core; the current HTTP transport and endpoint knowledge are Application/Adapter concerns.**

### 2.6 Remote Select/Radio data

`DynamicSelectBoxComponent` and `DynamicRadioBoxComponent` support local and remote options and cascade behavior.

Their reusable runtime behavior belongs to Forms Core.

Current boundary dependency:

- both inject concrete `FormService`;
- remote options are loaded through `FormService.getData()`;
- `getData()` translates metadata `api` into the ComeMiVesto `/gen/{api}` convention.

**Classification: Core behavior with a concrete application datasource dependency.**

---

## 3. Two different CRUD responsibilities

To avoid mixing concerns, Forms must distinguish two different persistence concepts.

### 3.1 CRUD of form definitions

Example entity:

```json
{
  "id": "user-form",
  "nameForm": "Utente",
  "json": [
    {
      "name": "email",
      "type": "textBox",
      "required": true
    }
  ]
}
```

Create/read/update/delete of this entity is part of the Starter Kit Forms capability because FormBuilder needs persistent definitions.

### 3.2 CRUD of business data

Example data emitted by the rendered form:

```json
{
  "nome": "Mario",
  "email": "mario@example.test"
}
```

The Starter Kit renderer emits this data. It does not decide whether the consumer stores it in Firebase, REST, PostgreSQL, another service, or does not persist it at all.

**Boundary rule:** form-definition persistence is part of the Forms capability; business-entity persistence is application responsibility.

---

## 4. Dependency map

### Current form-definition path

```text
FormBuilderComponent --------┐
                             |
AppFormListComponent --------+--> FormService
                             |        |
DynamicFormComponent --------┘        +--> environment.apiBaseUrl
                                      +--> /gen/forms
```

### Current remote-option path

```text
DynamicSelectBoxComponent ---┐
                             +--> FormService.getData()
DynamicRadioBoxComponent ----┘        |
                                      +--> environment.apiBaseUrl
                                      +--> /gen/{api}{queryString}
```

### Current navigation hosting

```text
AppFormListComponent --> /form-builder/:id
FormBuilderComponent   --> /form-list
app.routes.ts           --> exposes both routes and protects them with authGuard
```

---

## 5. Current architecture assessment

### Already aligned with Starter Kit

The following decisions are already correct and should be preserved:

- forms are metadata-driven;
- canonical field metadata is centralized;
- legacy metadata is normalized at a compatibility boundary;
- FormBuilder builds the same metadata consumed by DynamicForm;
- DynamicForm emits business data rather than persisting the business entity itself;
- form-definition CRUD is centralized;
- select/radio support local and remote sources;
- cascade logic is reusable and characterized;
- FormBuilder uses the reusable Popup mechanism for property editing;
- existing tests characterize Forms behavior and current backend contract.

### Boundary leaks to resolve before physical extraction

1. `DynamicFormComponent -> FormService`;
2. `FormBuilderComponent -> FormService`;
3. `AppFormListComponent -> FormService`;
4. `DynamicSelectBoxComponent -> FormService.getData()`;
5. `DynamicRadioBoxComponent -> FormService.getData()`;
6. `FormService -> environment.apiBaseUrl`;
7. `FormService -> /gen/forms`;
8. `FormService -> /gen/{api}`;
9. FormBuilder/FormList direct knowledge of application route paths.

The first eight are persistence/datasource boundaries. Route hosting is a secondary boundary and does not need to be solved before the persistence design is understood.

---

## 6. Target architectural boundary — design only

No implementation is introduced by SK.1.

The architectural direction is to preserve all current Forms behavior while separating reusable contracts from the ComeMiVesto HTTP implementation.

### Form-definition persistence boundary

```text
Starter Kit Forms

FormBuilder
Form Manager
DynamicForm
     |
     v
Form-definition persistence contract
     ^
     |
Host adapter
     |
     v
current ComeMiVesto /gen/forms behavior
```

The contract must express the already-existing operations only:

- list forms;
- get one form;
- obtain its fields;
- save/create/update;
- delete.

SK.1 does **not** introduce additional operations or new product functionality.

### Remote-options boundary

```text
DynamicSelectBox
DynamicRadioBox
      |
      v
Remote-options datasource contract
      ^
      |
Host adapter
      |
      v
current ComeMiVesto /gen/{api}{queryString} behavior
```

Again, this boundary represents only behavior already present in the repository.

---

## 7. Compatibility constraints for any later implementation

Any future Forms decoupling must preserve:

- current field metadata shape;
- canonical camelCase normalization behavior;
- supported legacy spellings exactly as characterized;
- current FormBuilder field types and editing behavior;
- duplicate-name validation;
- current create/update/delete semantics;
- current ComeMiVesto `/gen/forms` requests through the host adapter;
- encoded form IDs;
- current response-shape mapping;
- current `/gen/{api}{queryString}` behavior for remote options;
- empty/error handling of remote select/radio sources;
- typed select/radio values;
- multiple select behavior;
- cascade behavior, including `0` and `false` parents;
- submit/cancel/functional-button events;
- application-controlled business persistence;
- mobile usability requirements.

No backend API change is required by this architectural separation.

---

## 8. Explicit non-goals

SK.1 does not authorize or propose:

- moving Forms into a new directory;
- creating an Angular library;
- creating a separate Starter Kit repository;
- rewriting FormBuilder;
- redesigning FormBuilder UX;
- adding drag and drop;
- adding field types;
- adding preview;
- changing JSON metadata;
- replacing Popup/Dialog;
- changing route names;
- changing auth/RBAC;
- changing firebase-api;
- replacing HTTP with Firebase or another transport;
- changing Forms CRUD behavior;
- changing remote select/radio semantics;
- removing legacy compatibility;
- performing unrelated repository cleanup.

---

## 9. Safe implementation order after SK.1

This is a sequencing recommendation only; no implementation is performed here.

### SK.1.3A — characterize abstract responsibilities

Use existing tests as the source of truth for the current FormService CRUD and datasource behavior. No behavior change.

### SK.1.3B — introduce the smallest persistence boundary

If implementation is approved, introduce only the minimum contracts required by current callers and bind the current ComeMiVesto HTTP behavior behind them.

No endpoint or payload change.

### SK.1.3C — migrate one caller at a time

Recommended conservative order:

1. FormBuilder/Form Manager definition persistence;
2. DynamicForm definition loading;
3. Select/Radio remote option loading.

Keep compatibility tests green after each slice.

### SK.1.4 — characterization closure

Before any physical Core/Application move, verify that current Forms tests and application build still pass and that ComeMiVesto runtime behavior is unchanged.

### SK.2 — physical separation only after dependency inversion is proven

Folder/library/repository extraction is intentionally deferred. Physical movement before boundary cleanup would only relocate existing coupling.

---

## 10. SK.1 conclusion

The current Forms architecture is **functionally compatible with the Starter Kit vision**.

The FormBuilder is not an application-specific screen to remove from the Core. It is a reusable utility/capability whose purpose is to create and maintain metadata-driven forms without hand-writing each form.

The existing CRUD of form definitions is also part of that capability.

The main architectural limitation is narrower: the current concrete `FormService` combines reusable form-definition semantics with ComeMiVesto-specific HTTP endpoint and remote-datasource knowledge.

Therefore the correct next step, if approved, is not a rewrite or feature redesign. It is a small, behavior-preserving boundary extraction around the persistence and remote-option responsibilities already present.

Until that implementation is explicitly approved, the production code remains unchanged.

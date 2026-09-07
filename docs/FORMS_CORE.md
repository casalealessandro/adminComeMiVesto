# Forms Core: Phase 0 characterization

This document records the observed Forms Core behavior. It is a safety-net inventory, not a proposal for a new form engine. Form metadata continues to be loaded by `FormService`, rendered by `DynamicFormComponent`, and returned to the business consumer for final DTO construction and persistence.

## Capability matrix

| Capability | Metadata | Runtime support | Builder support | Test coverage | Note |
| --- | --- | --- | --- | --- | --- |
| textBox | `type`, `typeInput` | Supported | Supported | Lifecycle, validators | Native reactive-form control. |
| textArea | `type` | Supported | Supported | Builder configuration matrix | Uses the generic control lifecycle. |
| hiddenBox | `type: hiddenBox` | Supported | Supported | Builder defaults | Builder forces `typeInput: hidden`. |
| checkBox | `checkBoxOptions` | Supported | Supported | Defaults and preservation | Link metadata defaults to false/empty strings. |
| selectBox local | `selectOptions.options`, expressions | Supported | Supported | Local load and option management | Empty local options make builder validation fail. |
| selectBox remote | `remote`, `api` | Partial | Supported | Success, empty, error | Empty/error responses leave the control disabled and `isLoading` true. Errors are swallowed. |
| select cascade | `parent`, option `parent` | Partial | Supported | Local filtering and remote path | Remote parent is appended as `/{parentValue}`. Initial local filtering contains a function/value comparison; reactive filtering works. |
| fileBox | `fileBoxOptions.maxWidth`, `maxHeight`, `maxSize` | Supported | Supported | MIME, size, metadata, resize | Both dimension limits are applied without cropping, distortion, or upscaling; `maxSize` is enforced. |
| required | `required` | Supported | Supported | Validator and invalid submit | Uses Angular `Validators.required`. |
| minLength | `minLength`; legacy `minlength` | Supported / legacy | Supported | Normalization and validator | Canonical value wins. `max_length`-style snake case is not supported. |
| maxLength | `maxLength`; legacy `maxlength` | Supported / legacy | Supported | Normalization and validator | Canonical value wins. |
| min/max number | `min`, `max`, `typeInput: number` | Supported | Supported | Both bounds | Bounds only apply to number inputs. |
| email | `typeInput: email` | Supported | Supported | Email validity | Uses Angular `Validators.email`. |
| multiple select | `selectOptions.multiple` | Supported | Supported | Initial array value | Initial selection comes from the component's `values` input. |
| functional button | `funcButton` | Supported | Supported | Event payload | Emits `functionalInputClick` with `nomeCampo` and the original field object. |

## Stable contracts captured by tests

* Known legacy spellings are normalized before saving/reloading, while canonical values take precedence and unrelated metadata survives.
* `GET /gen/forms/:id` supplies only `form.json` to `DynamicFormComponent`; the consumer remains responsible for business persistence.
* Submit, cancel, functional-button, loading guard, refresh, edit/insert, legacy `idData`, validators, and invalid-label behavior are characterized.
* Form-service GET/POST/PUT/DELETE URLs, response mappings, payload shapes, encoding, and generic `/gen/{api}{queryString}` composition are characterized.
* A legacy-metadata round trip through normalization, builder payload creation, serialization, and reload parsing is covered.

## Findings intentionally not corrected in Phase 0

1. **Falsy edit values — resolved in Forms Core Phase 1.1:** previously, `false`, `0`, and `''` became `null` in controls because initialization used logical OR. Explicit falsy values are now preserved; only `null`, `undefined`, and absent values resolve to `null`. The parallel `formValues` map continues to retain explicit values.
2. **Remote empty/error state — resolved in Forms Core Phase 1.2:** local selects now leave the loading state after initialization; remote selects restore their loading/enabled state after successful, empty, and error responses.
3. **File metadata — resolved in Forms Core Phase 1.3:** `maxHeight` is now applied together with `maxWidth` during runtime image processing. `isBase64` was removed from the active Forms Core contract in Phase 1.3. Legacy `isBase64`/`isbase64` metadata is tolerated only at the normalization boundary and stripped from canonical serialization. File selection retains the historical 600-pixel `maxWidth` fallback when no positive metadata limit is supplied; absent, null, or non-positive `maxHeight` remains unbounded rather than introducing a new limit.
4. **Legacy naming boundary:** `minlength`, `maxlength`, and nested `maxheight` are normalized. Legacy nested `isBase64`/`isbase64` is recognized only so it can be discarded. `max_length` is not supported.
5. **Cascade initialization — resolved in Forms Core Phase 1.2:** parent signal values are now read correctly during initial filtering, and explicit falsy parent values are no longer collapsed by initialization.
6. **Service absence:** without a `service` input, `DynamicFormComponent` returns before insert/edit initialization and creates no metadata controls.

At the time of Phase 0, no action was taken on these findings. Subsequent resolution status is recorded above; unresolved behavior corrections belong to later, explicitly scoped phases.

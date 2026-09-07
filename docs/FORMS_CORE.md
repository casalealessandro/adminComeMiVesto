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
| fileBox | `fileBoxOptions` | Partial | Supported | MIME, size, metadata, resize | `maxWidth` is consulted during file selection; `maxSize` is enforced. `maxHeight` and `isBase64` are declared but currently not applied by runtime processing. |
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
2. **Remote empty/error state:** a remote select is re-enabled only for a non-empty response. Empty results and swallowed errors leave it disabled and loading.
3. **File metadata:** `maxHeight` and `isBase64` are declared and builder-supported but currently not applied by runtime image processing. Component `maxWidth`/`maxHeight` inputs are also separate from copied metadata; file selection directly reads metadata `maxWidth` with a 600-pixel fallback.
4. **Legacy naming boundary:** `minlength`, `maxlength`, nested `maxheight`, and nested `isbase64` are supported. `max_length` is not supported.
5. **Cascade initialization:** the local initialization branch compares `option.parent` with the signal function rather than its current value. Subsequent reactive filtering calls the signal and works.
6. **Service absence:** without a `service` input, `DynamicFormComponent` returns before insert/edit initialization and creates no metadata controls.

At the time of Phase 0, no action was taken on these findings. Subsequent resolution status is recorded above; unresolved behavior corrections belong to later, explicitly scoped phases.

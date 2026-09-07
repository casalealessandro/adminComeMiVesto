# Forms Core v1 — stabilized characterization

This document started as the Phase 0 safety-net inventory and now records the stabilized Forms Core v1 contract after Phases 1.x and 2.x. Form metadata continues to be loaded by `FormService`, rendered by `DynamicFormComponent`, and returned to the business consumer for final DTO construction and persistence.

## Capability matrix

| Capability | Metadata | Runtime support | Builder support | Test coverage | Note |
| --- | --- | --- | --- | --- | --- |
| textBox | `type`, `typeInput` | Supported | Supported | Lifecycle, validators | Native reactive-form control. |
| textArea | `type` | Supported | Supported | Builder configuration matrix | Uses the generic control lifecycle. |
| hiddenBox | `type: hiddenBox` | Supported | Supported | Builder defaults | Builder forces `typeInput: hidden`. |
| checkBox | `checkBoxOptions` | Supported | Supported | Defaults and preservation | Link metadata defaults to false/empty strings. |
| selectBox local | `selectOptions.options`, expressions | Supported | Supported | Local load, option management, typed values | Option values keep their original type through the Angular `FormControl`. |
| selectBox remote | `remote`, `api` | Supported | Supported | Success, empty, error | Empty/error responses restore the enabled control and complete loading. Errors are swallowed. |
| select cascade | `parent`, option `parent` | Supported | Supported | Initial/reactive filtering, falsy/empty parents, remote path, chained cascade | `0`/`false` are valid parents; an empty parent clears child options and child selection. |
| radio | `radioOptions` | Supported | Supported | Static / remote / cascade / edit / required / typed values / chained cascade | Native single-choice control; metadata is separate from `selectOptions`. |
| fileBox | `fileBoxOptions.maxWidth`, `maxHeight`, `maxSize` | Supported | Supported | MIME, size, metadata, resize, round trip | Both dimension limits are applied without cropping, distortion, or upscaling; `maxSize` is enforced. |
| required | `required` | Supported | Supported | Validator and invalid submit | Uses Angular `Validators.required`. |
| minLength | `minLength`; legacy `minlength` | Supported / legacy | Supported | Normalization and validator | Canonical value wins. |
| maxLength | `maxLength`; legacy `maxlength` | Supported / legacy | Supported | Normalization and validator | Canonical value wins. |
| min/max number | `min`, `max`, `typeInput: number` | Supported | Supported | Both bounds | Bounds only apply to number inputs. |
| email | `typeInput: email` | Supported | Supported | Email validity | Uses Angular `Validators.email`. |
| multiple select | `selectOptions.multiple` | Supported | Supported | Initial/change array, typed values | User changes keep the complete selected array rather than collapsing to a single DOM value. |
| functional button | `funcButton` | Supported | Supported | Event payload | Emits `functionalInputClick` with `nomeCampo` and the original field object. |

## Stable contracts captured by tests

* Known legacy spellings are normalized before saving/reloading, while canonical values take precedence and unrelated metadata survives.
* `GET /gen/forms/:id` supplies only `form.json` to `DynamicFormComponent`; the consumer remains responsible for business persistence.
* Submit, cancel, functional-button, loading guard, refresh, edit/insert, legacy `idData`, validators, and invalid-label behavior are characterized.
* Form-service GET/POST/PUT/DELETE URLs, response mappings, payload shapes, encoding, and generic `/gen/{api}{queryString}` composition are characterized.
* Legacy metadata round-trips through normalization, builder payload creation, serialization, and reload parsing.
* Canonical metadata containing SelectBox, RadioBox and FileBox round-trips through `buildFormPayload()` → serialization → `parseFields()` → `DynamicFormComponent` → submit without changing the supported contracts.
* Select/radio option values preserve explicit numeric and boolean values instead of coercing them through the raw DOM string value.
* Multiple select changes preserve the complete selected array.
* Cascade children with a configured but empty parent expose no options, clear their current value, and do not invoke a remote child API until the parent has a value. Explicit `0` and `false` parents remain valid.
* A chained static `radio → select → radio` cascade is characterized, including propagation of an empty parent through every downstream child.

## Phase 0 findings — final disposition

1. **Falsy edit values — resolved in Forms Core Phase 1.1.** `false`, `0`, and `''` are preserved. Only `null`, `undefined`, and absent values resolve to `null` during control initialization.
2. **Remote empty/error state — resolved in Forms Core Phase 1.2.** Local selects leave loading after initialization; remote selects restore loading/enabled state after successful, empty, and error responses.
3. **File metadata — resolved in Forms Core Phase 1.3.** `maxHeight` is applied together with `maxWidth`. `isBase64` was removed from the active contract; legacy `isBase64`/`isbase64` is tolerated only at normalization and stripped from canonical serialization.
4. **Legacy naming boundary — intentional compatibility boundary.** `minlength`, `maxlength`, and nested `maxheight` are normalized. Legacy `isBase64`/`isbase64` is recognized only to be discarded. `max_length` is intentionally unsupported because no active repository contract requires it; `form.service.spec.ts` explicitly protects this boundary.
5. **Cascade initialization — resolved in Phase 1.2 and completed in Phase 2.2.** Initial/reactive filtering works, explicit falsy parents survive, and clearing a parent clears downstream options/value consistently for select and radio fields.
6. **Service absence — intentional contract.** `service` is required for metadata-driven `DynamicFormComponent`. Without it the component does not request metadata and does not create controls. This behavior is explicitly covered by tests and documented in `DYNAMIC_FORM.md`.

There are no unresolved Phase 0 correctness findings after Phase 2.3.

## Corrective phases

* **Phase 1.1 — falsy edit values:** preserve explicit falsy values during control initialization.
* **Phase 1.2 — select lifecycle and cascade initialization:** close loading/error lifecycle gaps and fix parent handling.
* **Phase 1.3 — FileBox dimensions and Base64 cleanup:** support both dimension bounds and remove Base64 persistence metadata from the active contract.
* **Phase 2.0 — DynamicRadioBox:** add native static/remote/cascade radio support with dedicated `radioOptions`.
* **Phase 2.1 — option value contract:** preserve typed select/radio values and complete multiple-select array handling.
* **Phase 2.2 — cascade consistency:** empty parent clears child options/value and skips unnecessary remote calls.
* **Phase 2.3 — finding closure:** classify `service` absence and legacy `max_length` as intentional contracts rather than open defects.
* **Phase 2.4 — final characterization:** add canonical end-to-end round-trip coverage and chained-cascade characterization without changing production behavior.

## Forms Core v1 stabilization status

Forms Core v1 is considered stabilized when the Phase 2.4 characterization suite is green together with the existing test suite and application build. Further work should be treated as a new capability or FormBuilder UX evolution, not as completion of the original Forms Core safety-net findings.

# App selectors and structure (source of truth)

E2E tests must use these selectors so they match the actual DOM/ARIA from the app. Do not guess; refer to the components below.

**Components:** `src/components/FlagSelector.tsx`, `PresentationModeSelector.tsx`, `AdjustControls.tsx`, `ImageUploadZone.tsx`, `src/pages/AppStepWorkflow.tsx`.

---

## data-testid contract (stable; prefer for nav and main actions)

The app exposes these `data-testid` values in `AppStepWorkflow`. Use constants from `test/e2e/helpers/test-ids.ts` so copy or ARIA changes don't break tests.

| testid        | Element                          | When visible   |
|---------------|----------------------------------|----------------|
| `step-1`      | Step 1 container                 | currentStep 1  |
| `step-2`      | Step 2 container                 | currentStep 2  |
| `step-3`      | Step 3 container                 | currentStep 3  |
| `step1-next`  | Button: step 1 → step 2          | Step 1 only    |
| `step2-next`  | Button: step 2 → step 3          | Step 2 only    |
| `nav-back`    | Back button                      | Step 2 and 3   |
| `save-avatar` | Save/download avatar button      | Step 3 only    |

Use `page.getByTestId(TEST_IDS.SAVE_AVATAR)` etc. in tests. Prefer testids for the two "Go to next step" buttons (so you don't rely on duplicate labels) and for the save button.

---

## Step 1 (Image upload)

| Element             | How to target                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| File input          | `input[type="file"]` or `getByLabelText('Choose image file (JPG or PNG)')`; id is `step1-file-upload`    |
| Step 1 container    | `getByTestId('step-1')`                                                                                  |
| Step 1 prompt text  | Visible text: "Choose your profile picture"                                                              |
| Next (go to step 2) | `getByTestId('step1-next')` or `getByRole('button', { name: 'Go to next step' })` — disabled until image set |

**Flow:** Upload file → wait for Next to be enabled → click Next → step 2.

---

## Step 2 (Flag selection)

| Element               | How to target                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Step 2 container      | `getByTestId('step-2')`                                                                                                                                                        |
| Flag dropdown trigger | `getByRole('combobox', { name: 'Choose a flag' })` — Radix Select trigger, **not** `#flag-select-label` (that is a **class** on category labels inside the dropdown)           |
| Flag option           | `getByRole('option', { name: '<displayName>' })` — name must match `flag.displayName` from `src/flags/flags.ts` / `data/flag-data.yaml` (e.g. "Palestine", "Pride", "Ukraine") |
| Next (go to step 3)   | `getByTestId('step2-next')` or `getByRole('button', { name: 'Go to next step' })` — disabled until a flag is selected                                                          |
| Back                  | `getByTestId('nav-back')` or `getByRole('button', { name: 'Go to previous step' })`                                                                                            |

**Flow:** Click combobox → click option by displayName → click Next → step 3. Helper: `goToStep3(page)` clicks step2-next and waits for step 3 ready.

---

## Step 3 (Adjust and download)

| Element                 | How to target                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 3 container        | `getByTestId('step-3')`                                                                                                                                                                                                                                                                                                                                                                                                       |
| Presentation mode group | `getByRole('radiogroup', { name: 'Presentation style' })`                                                                                                                                                                                                                                                                                                                                                                    |
| Ring / Segment / Cutout | Buttons with `aria-pressed`, **not** `<input type="radio">`. Use `getByRole('button', { name: /^Ring/ })` etc. — accessible name is aria-label (e.g. "Ring - Full circular border...")                                                                                                                                                                                                                                       |
| Sliders                 | Radix Slider: **aria-label** on the Root; the thumb has **role="slider"** and may not inherit the name. Find the root with `locator('[aria-label="Border thickness"]')` (etc.), then `root.getByRole('slider')`. Labels in app: **"Border thickness"**, **"Segment rotation"** (segment mode only), **"Flag horizontal offset"** (cutout mode only when flag has offsetEnabled). **No** "Border Width" / "Inset" / "Outset". |
| Save / Download button  | `getByTestId('save-avatar')` or `getByRole('button', { name: 'Save avatar' })` — aria-label "Save avatar"                                                                                                                                                                                                                                                                                                                   |
| Back                    | `getByTestId('nav-back')` or `getByRole('button', { name: 'Go to previous step' })`                                                                                                                                                                                                                                                                                                                                           |

**Flow:** After navigating to step 3, use `waitForStep3Ready(page)` (waits for `__BB_UPLOAD_DONE__`, then sanity-checks Save avatar visible and enabled). Then interact with presentation mode and sliders → click Save avatar for download.

---

## Flag displayNames (must match app)

Use **exact** `displayName` from `src/flags/flags.ts` (generated from `data/flag-data.yaml`). Examples:

- Palestine, Venezuela, Tibet, Western Sahara, Ukraine, Romani, Pride, Trans Pride, Non-Binary Pride, etc.
- Do **not** use "Palestine — Palestinian flag" or "Pride — Rainbow Flag" unless that is the actual displayName in the app.

---

## E2E contracts (implementation details tests may rely on)

- **Step 3 ready:** Use `waitForStep3Ready(page)` when you need "step 3 is usable". It waits for the app signal `__BB_UPLOAD_DONE__` (not the Save button; the button was unreliable). Prefer it over `waitForRenderComplete(page)` when you only need step 3 usable.
- **Dimensions-ready signal:** The app sets `window.__BB_DIMENSIONS_READY__` to `true` when image dimensions have been detected (in `useStepTransitions`). `goToStep3(page)` waits for this before clicking Step 2 Next so step 3 render runs immediately; keeps tests deterministic. Do not remove `__BB_DIMENSIONS_READY__` without updating `goToStep3`.
- **Legacy render signal:** The app sets `window.__BB_UPLOAD_DONE__` when the step-3 overlay render is done. `waitForRenderComplete(page)` waits on this. Do not remove `__BB_UPLOAD_DONE__` without updating or retiring `waitForRenderComplete` and any specs that depend on it.
- **Test IDs:** The `data-testid` values in `AppStepWorkflow` are a contract. Changing or removing them will break tests that use `test-ids.ts`.

---

## Test helpers

- `test-ids.ts`: `TEST_IDS` constants for all `data-testid` values; use in tests.
- `page-helpers.ts`: `uploadImage` (uses `step1-next`), `selectFlag`, `selectPresentationMode`, `setSliderValue`, `goToStep3`, `waitForStep3Ready`, `waitForRenderComplete` match the structure above.
- `test-data.ts`: `TEST_FLAGS` values must equal `displayName` from the app (see `src/flags/flags.ts`).

# App selectors and structure (source of truth)

E2E tests must use these selectors so they match the actual DOM/ARIA from the app. Do not guess; refer to the components below.

**Components:** `src/components/FlagSelector.tsx`, `PresentationModeSelector.tsx`, `AdjustControls.tsx`, `ImageUploadZone.tsx`, `src/pages/AppStepWorkflow.tsx`.

---

## Step 1 (Image upload)

| Element             | How to target                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| File input          | `input[type="file"]` or `getByLabelText('Choose image file (JPG or PNG)')`; id is `step1-file-upload`    |
| Step 1 prompt text  | Visible text: "Choose your profile picture"                                                              |
| Next (go to step 2) | `getByRole('button', { name: 'Go to next step' })` — only visible on step 1; disabled until image is set |

**Flow:** Upload file → wait for Next to be enabled → click Next → step 2.

---

## Step 2 (Flag selection)

| Element               | How to target                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Flag dropdown trigger | `getByRole('combobox', { name: 'Choose a flag' })` — Radix Select trigger, **not** `#flag-select-label` (that is a **class** on category labels inside the dropdown)           |
| Flag option           | `getByRole('option', { name: '<displayName>' })` — name must match `flag.displayName` from `src/flags/flags.ts` / `data/flag-data.yaml` (e.g. "Palestine", "Pride", "Ukraine") |
| Next (go to step 3)   | `getByRole('button', { name: 'Go to next step' })` — visible on step 2; disabled until a flag is selected                                                                      |
| Back                  | `getByRole('button', { name: 'Go to previous step' })`                                                                                                                         |

**Flow:** Click combobox → click option by displayName → click Next → step 3.

---

## Step 3 (Adjust and download)

| Element                 | How to target                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Presentation mode group | `getByRole('radiogroup', { name: 'Presentation style' })`                                                                                                                                                                                                                                                                                                                                                                    |
| Ring / Segment / Cutout | Buttons with `aria-pressed`, **not** `<input type="radio">`. Use `getByRole('button', { name: /^Ring/ })` etc. — accessible name is aria-label (e.g. "Ring - Full circular border...")                                                                                                                                                                                                                                       |
| Sliders                 | Radix Slider: **aria-label** on the Root; the thumb has **role="slider"** and may not inherit the name. Find the root with `locator('[aria-label="Border thickness"]')` (etc.), then `root.getByRole('slider')`. Labels in app: **"Border thickness"**, **"Segment rotation"** (segment mode only), **"Flag horizontal offset"** (cutout mode only when flag has offsetEnabled). **No** "Border Width" / "Inset" / "Outset". |
| Save / Download button  | `getByRole('button', { name: 'Save avatar' })` — aria-label is "Save avatar", not "download" or "export"                                                                                                                                                                                                                                                                                                                     |
| Back                    | `getByRole('button', { name: 'Go to previous step' })`                                                                                                                                                                                                                                                                                                                                                                       |

**Flow:** Wait for render (`__BB_UPLOAD_DONE__`) → interact with presentation mode and sliders → click "Save avatar" for download.

---

## Flag displayNames (must match app)

Use **exact** `displayName` from `src/flags/flags.ts` (generated from `data/flag-data.yaml`). Examples:

- Palestine, Venezuela, Tibet, Western Sahara, Ukraine, Romani, Pride, Trans Pride, Non-Binary Pride, etc.
- Do **not** use "Palestine — Palestinian flag" or "Pride — Rainbow Flag" unless that is the actual displayName in the app.

---

## Test helpers

- `page-helpers.ts`: `uploadImage`, `selectFlag`, `selectPresentationMode`, `setSliderValue`, `waitForRenderComplete` are written to match the structure above.
- `test-data.ts`: `TEST_FLAGS` values must equal `displayName` from the app (see `src/flags/flags.ts`).

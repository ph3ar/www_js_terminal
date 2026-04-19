## 2024-05-24 - Accessibility on dynamically generated list items
**Learning:** In legacy javascript apps where DOM elements are created dynamically from strings (like in `jutty.js`), accessibility attributes like `aria-label` and `title` are often missed on icon-only action buttons.
**Action:** Always scan string concatenation blocks that generate HTML buttons in legacy apps to ensure they include proper `aria-label` and `title` attributes, especially if they only contain an icon (e.g. `glyphicon`).
## 2024-05-24 - Accessibility on Bootstrap 3 Input Groups
**Learning:** Older Bootstrap 3 layouts often use `input-group-addon` spans instead of native `<label>` elements for form inputs, which causes screen readers to miss the input's purpose.
**Action:** When working with legacy Bootstrap forms, always link the `input` to its `input-group-addon` using `aria-describedby` (or `aria-labelledby`) to ensure the field has a programmatic name/description.
## $(date +%Y-%m-%d) - Adding Empty States for Improved First-Time UX
**Learning:** Adding a helpful empty state when a list (like saved connections) is empty significantly improves the intuitive feel of the application for first-time users. It prevents the UI from looking broken and guides the user on what to do next. Ensure that the empty state uses existing design system classes (like Bootstrap 3's `list-group-item`, `text-muted`, `text-center`) rather than custom CSS to maintain visual consistency.
**Action:** When working on lists or tables, always consider what happens when there is no data. Implement a clear, friendly empty state with an icon and simple instructions to guide the user. Verify its rendering and ensure it adheres to the existing UI framework.

## 2024-05-15 - [Add Delete Confirmation Dialog]
**Learning:** Destructive actions without confirmation can lead to accidental data loss and degrade user trust, especially in list views where users might accidentally click the delete icon.
**Action:** Always wrap delete/destructive actions in a confirmation dialog (`confirm()`) or modal before proceeding with the data removal.

## 2024-05-24 - Enter Key Support for Non-Native Forms
**Learning:** Legacy jQuery apps often rely on `<div>` containers instead of native `<form>` tags, which breaks the native "press Enter to submit" behavior. This forces keyboard-only or screen-reader users to navigate all the way to the submit button, degrading accessibility and UX.
**Action:** When working with form-like input containers in legacy applications, always bind a `keypress` event on the inputs to explicitly trigger the submission action when the Enter key (`e.which === 13`) is pressed.
## 2024-05-19 - Temporary visual feedback state on Save button
**Learning:** Added a "Saved!" feedback state to the connection Save button. When implementing temporary visual feedback states on UI elements, always guard against race conditions and duplicate actions by checking a state flag (like `$el.data('saving')`) or checking if the button is disabled during the active timeout period. Caching the original HTML before modifying it and restoring it afterwards is an effective way to handle the transition safely.
**Action:** When adding similar temporary feedback to other interactive elements, apply the pattern of guarding against redundant clicks, caching state, and cleanly restoring it via a timeout, while updating any dependent UI state using the existing validation functions (like `checkButtons()`).

## 2025-04-17 - Visual Feedback on Save Button
**Learning:** Adding temporary visual feedback (like changing a "Save" button to "Saved!" with a checkmark) greatly improves user confidence, but doing so naively can cause race conditions if the user double-clicks, leading to broken UI states or duplicate saves.
**Action:** Always guard temporary UI states with a flag (e.g., `$el.data('saving')` or `isSaving` state) and ignore subsequent actions until the timeout completes and the state is reset.

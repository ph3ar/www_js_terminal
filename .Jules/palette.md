## 2024-05-24 - Accessibility on dynamically generated list items
**Learning:** In legacy javascript apps where DOM elements are created dynamically from strings (like in `jutty.js`), accessibility attributes like `aria-label` and `title` are often missed on icon-only action buttons.
**Action:** Always scan string concatenation blocks that generate HTML buttons in legacy apps to ensure they include proper `aria-label` and `title` attributes, especially if they only contain an icon (e.g. `glyphicon`).
## 2024-05-24 - Accessibility on Bootstrap 3 Input Groups
**Learning:** Older Bootstrap 3 layouts often use `input-group-addon` spans instead of native `<label>` elements for form inputs, which causes screen readers to miss the input's purpose.
**Action:** When working with legacy Bootstrap forms, always link the `input` to its `input-group-addon` using `aria-describedby` (or `aria-labelledby`) to ensure the field has a programmatic name/description.

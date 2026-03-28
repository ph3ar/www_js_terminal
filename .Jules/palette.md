## 2024-05-24 - Accessibility on dynamically generated list items
**Learning:** In legacy javascript apps where DOM elements are created dynamically from strings (like in `jutty.js`), accessibility attributes like `aria-label` and `title` are often missed on icon-only action buttons.
**Action:** Always scan string concatenation blocks that generate HTML buttons in legacy apps to ensure they include proper `aria-label` and `title` attributes, especially if they only contain an icon (e.g. `glyphicon`).
## 2024-05-24 - Accessibility on Bootstrap 3 Input Groups
**Learning:** Older Bootstrap 3 layouts often use `input-group-addon` spans instead of native `<label>` elements for form inputs, which causes screen readers to miss the input's purpose.
**Action:** When working with legacy Bootstrap forms, always link the `input` to its `input-group-addon` using `aria-describedby` (or `aria-labelledby`) to ensure the field has a programmatic name/description.

## 2024-05-24 - Valid HTML with Bootstrap 3 list groups
**Learning:** If a Bootstrap 3 list group container dynamically generates elements, using a `<ul>` tag and filling it with `<a>` anchor tags creates invalid HTML (anchors cannot be direct children of unordered lists). This breaks screen reader expectations.
**Action:** Use `<div class="list-group">` instead of `<ul class="list-group">` for list groups containing anchors, and ensure empty states are presented so users don't encounter completely empty elements.

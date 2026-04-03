## 2026-03-21 - DOM Append in Loop Anti-pattern
**Learning:** Found a DOM manipulation bottleneck in `public/jutty.js` where connections were appended to the DOM one by one inside a loop. This is a common anti-pattern that causes multiple reflows/repaints.
**Action:** Always batch DOM updates by building an HTML string or DocumentFragment first, then appending it once to the DOM.

## 2025-05-18 - jQuery Event Binding Bottleneck in Render Loops
**Learning:** In `public/jutty.js`, click handlers for dynamically generated list items were bound using `$('a.load').click(...)` *inside* the render function. This causes $O(n)$ bindings per render, leaking memory and slowing down repaints as the number of elements grows.
**Action:** When working with jQuery and dynamically rendering lists, always place event handlers outside the render function using event delegation on the parent container (e.g., `$('#parent').on('click', '.child', ...)`). This ensures $O(1)$ event bindings regardless of the number of rendered items.

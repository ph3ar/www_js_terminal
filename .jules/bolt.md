## 2026-03-21 - DOM Append in Loop Anti-pattern
**Learning:** Found a DOM manipulation bottleneck in `public/jutty.js` where connections were appended to the DOM one by one inside a loop. This is a common anti-pattern that causes multiple reflows/repaints.
**Action:** Always batch DOM updates by building an HTML string or DocumentFragment first, then appending it once to the DOM.

## 2026-03-21 - Event Binding Inside Loops Anti-pattern
**Learning:** Found a memory leak and performance bottleneck in `public/jutty.js` where event listeners were bound to individual dynamically created elements inside a loop (`$('a.load').click(...)` inside `listConnections()`). Every time the list re-rendered, new listeners were attached, leading to un-garbage-collected closures and O(N) event binding complexity.
**Action:** Use event delegation on a static parent container (e.g., `$connections.on('click', 'a.load', ...)`) outside the render function. This reduces event binding to O(1) and prevents memory leaks from accumulating closures on dynamic elements.

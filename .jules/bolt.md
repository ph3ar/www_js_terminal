## 2026-03-21 - DOM Append in Loop Anti-pattern
**Learning:** Found a DOM manipulation bottleneck in `public/jutty.js` where connections were appended to the DOM one by one inside a loop. This is a common anti-pattern that causes multiple reflows/repaints.
**Action:** Always batch DOM updates by building an HTML string or DocumentFragment first, then appending it once to the DOM.

## 2026-03-21 - Event Listener Accumulation in Rendering Loops
**Learning:** In `public/jutty.js`, attaching event listeners (`.click()`, `.dblclick()`) inside a loop during every re-render (like `listConnections()`) causes memory leaks (from un-garbage-collected closures) and scales execution time $O(N)$ with the number of elements.
**Action:** Always use event delegation for dynamically rendered lists. Bind the listener once to the parent container (e.g. `$container.on('click', '.child', handler)`), reducing binding time to $O(1)$ and significantly reducing memory usage.

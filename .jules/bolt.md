## 2026-03-21 - DOM Append in Loop Anti-pattern
**Learning:** Found a DOM manipulation bottleneck in `public/jutty.js` where connections were appended to the DOM one by one inside a loop. This is a common anti-pattern that causes multiple reflows/repaints.
**Action:** Always batch DOM updates by building an HTML string or DocumentFragment first, then appending it once to the DOM.

## 2026-03-21 - Event Binding Inside Loops Anti-pattern
**Learning:** Found a memory leak and performance bottleneck in `public/jutty.js` where event listeners were bound to individual dynamically created elements inside a loop (`$('a.load').click(...)` inside `listConnections()`). Every time the list re-rendered, new listeners were attached, leading to un-garbage-collected closures and O(N) event binding complexity.
**Action:** Use event delegation on a static parent container (e.g., `$connections.on('click', 'a.load', ...)`) outside the render function. This reduces event binding to O(1) and prevents memory leaks from accumulating closures on dynamic elements.

## 2026-03-21 - Rate Limiting Static Assets Anti-pattern
**Learning:** Found a performance bottleneck where `express-rate-limit` was applied globally to the `express.static` route. This meant every request for CSS, JS, and image assets invoked the rate limiter, wasting CPU/memory resources and rapidly depleting the user's limit.
**Action:** Only apply rate limiters to main entry points (e.g., `app.get('/')` and `app.post('/')`) or API routes, and explicitly bypass rate limiting for static assets.
## 2026-04-08 - Debounce Event Handlers and Race Conditions
**Learning:** When debouncing input event handlers (like checking form validity on `keyup`), applying the debounce uniformly can break immediate-action workflows. For instance, if a user finishes typing and immediately presses the 'Enter' key to submit, the debounced logic has not yet executed to enable the submit action. This causes the UI to ignore the submission attempt, frustrating fast typists.
**Action:** When debouncing form or input handlers, always include a fast-path for immediate execution on critical events like the 'Enter' key (`e.which === 13`) to prevent race conditions.

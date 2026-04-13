## 2024-03-26 - [Unsanitized inputs to pty.spawn]
**Vulnerability:** Command/Argument Injection via unsanitized `data.host` and `data.port` parameters in `socket.on('start')` which were directly passed to `pty.spawn`. An attacker could inject arguments starting with `-` like `-oProxyCommand`.
**Learning:** Even though `pty.spawn` doesn't execute a shell directly, passing completely arbitrary arguments starting with hyphens can invoke dangerous features of the underlying program (e.g. telnet).
**Prevention:** Always sanitize and validate socket inputs using strict regex (e.g., ensuring hostnames start with alphanumeric characters `^[a-zA-Z0-9]`) and explicitly parsing/bounding numbers before passing them to OS-level spawn commands.

## 2024-03-26 - [DOM-based XSS via jQuery string concatenation]
**Vulnerability:** DOM-based XSS in `public/jutty.js` via the `listConnections` function. Connection names were directly concatenated into HTML strings and parsed by `$connections.html()`. If an attacker stored a payload like `<img src=x onerror=alert(1)>` in `localStorage`, it would execute.
**Learning:** Using string concatenation to build complex HTML elements (like `<a>` containing `<button>`) with user-supplied data in jQuery is extremely prone to injection, even for data not explicitly sent from a server.
**Prevention:** Always use jQuery's programmatic element creation with properties (e.g., `$('<a>', { text: name })`) to inherently sanitize and escape element contents and attributes.

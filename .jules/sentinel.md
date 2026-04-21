## 2024-03-26 - [Unsanitized inputs to pty.spawn]
**Vulnerability:** Command/Argument Injection via unsanitized `data.host` and `data.port` parameters in `socket.on('start')` which were directly passed to `pty.spawn`. An attacker could inject arguments starting with `-` like `-oProxyCommand`.
**Learning:** Even though `pty.spawn` doesn't execute a shell directly, passing completely arbitrary arguments starting with hyphens can invoke dangerous features of the underlying program (e.g. telnet).
**Prevention:** Always sanitize and validate socket inputs using strict regex (e.g., ensuring hostnames start with alphanumeric characters `^[a-zA-Z0-9]`) and explicitly parsing/bounding numbers before passing them to OS-level spawn commands.

## 2024-04-10 - [Duplicate terminal event listeners and unsanitized parameters causing command injection bypass]
**Vulnerability:** Double event listener registration for `term.on('data')` and `term.on('exit')` that was located outside `socket.on('start')`, combined with `safeHost` allowing leading hyphens, which could allow bypassing the regex check and injecting options to the telnet command spawned via `node-pty`.
**Learning:** `term` is declared outside of `socket.on('start')` but double registered outside of it while `term.pid` accessing caused crashes. By only having the listener inside `start`, and also ensuring `safeHost` doesn't begin with a hyphen.
**Prevention:** Remove duplicated code outside closures that depends on variables defined inside them, and add explicit prefix checks for arguments passed to `node-pty`.

## 2024-05-24 - [DOM-based XSS in jQuery HTML concatenation]
**Vulnerability:** DOM-based Cross-Site Scripting (XSS) via jQuery `html()` manipulation in `public/jutty.js`. The `listConnections` function iterates over user-controlled connection names and builds raw HTML strings containing those names (`'<a ... data-target="' + name + '">' + name + ...`). If a user creates a connection with a malicious name (like `<script>alert(1)</script>`), the script is executed when the connection list is rendered.
**Learning:** Concatenating user inputs directly into HTML strings and assigning them via `.html()`, `.append()`, or similar DOM injection points easily causes DOM-based XSS, even for seemingly innocuous "names".
**Prevention:** Avoid constructing HTML markup with user inputs using string concatenation. Instead, use jQuery's programmatic element creation (e.g., `$('<a>', { text: name, class: '...' })`), which safely escapes text content and attributes automatically.

## 2024-03-26 - [Unsanitized inputs to pty.spawn]
**Vulnerability:** Command/Argument Injection via unsanitized `data.host` and `data.port` parameters in `socket.on('start')` which were directly passed to `pty.spawn`. An attacker could inject arguments starting with `-` like `-oProxyCommand`.
**Learning:** Even though `pty.spawn` doesn't execute a shell directly, passing completely arbitrary arguments starting with hyphens can invoke dangerous features of the underlying program (e.g. telnet).
**Prevention:** Always sanitize and validate socket inputs using strict regex (e.g., ensuring hostnames start with alphanumeric characters `^[a-zA-Z0-9]`) and explicitly parsing/bounding numbers before passing them to OS-level spawn commands.

## 2025-02-25 - [DOM-based XSS via jQuery string concatenation]
**Vulnerability:** DOM-based Cross-Site Scripting (XSS) vulnerability via unsanitized `name` parameters in `public/jutty.js` `listConnections()` when generating HTML for the UI list.
**Learning:** Constructing HTML markup using string concatenation with unsanitized user inputs (`html += '<a...>' + name + '</a>'`) is inherently unsafe, especially with rendering engines like jQuery's `.html()`.
**Prevention:** Construct DOM elements directly using safe APIs like `$('<a>', { text: name })` which automatically escapes strings for you, preventing any injected scripts from executing.

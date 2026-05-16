## 2024-03-26 - [Unsanitized inputs to pty.spawn]
**Vulnerability:** Command/Argument Injection via unsanitized `data.host` and `data.port` parameters in `socket.on('start')` which were directly passed to `pty.spawn`. An attacker could inject arguments starting with `-` like `-oProxyCommand`.
**Learning:** Even though `pty.spawn` doesn't execute a shell directly, passing completely arbitrary arguments starting with hyphens can invoke dangerous features of the underlying program (e.g. telnet).
**Prevention:** Always sanitize and validate socket inputs using strict regex (e.g., ensuring hostnames start with alphanumeric characters `^[a-zA-Z0-9]`) and explicitly parsing/bounding numbers before passing them to OS-level spawn commands.

## 2026-04-17 - [Unhandled Promise/Undefined crash in Socket.io connection]
**Vulnerability:** Unauthenticated Denial of Service (DoS).
**Learning:** If event listeners and properties of a scoped variable (e.g., `term.pid` and `term.on('data')`) are accessed directly inside a `connection` event loop *before* that variable is safely initialized via an explicit client command (e.g., `start`), a client can crash the server merely by opening a connection. The event loop expects `term` to exist immediately.
**Prevention:** Always wrap listeners or initializations that depend on dynamically spawned external processes in null checks (`if (term) { ... }`) to gracefully fail or avoid dereferencing `undefined` when the object is uninitialized.

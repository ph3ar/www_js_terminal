# PH3AR Terminal

> Web-based SSH/Telnet client, useful in environments where only http(s) is allowed.

![PH3AR Terminal](/terminal.png?raw=true)

## Features & Enhancements

*   **Modern Node.js Compatibility:** Powered by `node-pty`, allowing compilation and execution on modern versions of Node.js (e.g., v18, v20, v22).
*   **UI/UX Upgrades:** Refined interface using modern Bootswatch themes (Darkly), with ARIA accessibility labels and improved focus management.
*   **SSH Key Authentication:** Full support for uploading and utilizing private SSH keys for secure authentication directly within your browser.
*   **.well-known Integration:** Enhanced endpoints supporting OpenClaw and Platphorm News network discovery via `ai-plugin.json` and `openapi.yaml` with permissive CORS.

## Install

```bash
git clone https://github.com/hobbyquaker/jutty
cd jutty
pnpm install
```

## Run on HTTP:

```bash
node app.js -p 3000
```

## Run on HTTPS:

Always use HTTPS in production! Generate a self-signed cert:

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 30000 -nodes
```

And then run:

```bash
node app.js --sslkey key.pem --sslcert cert.pem -p 3000
```

## Testing

```bash
pnpm test
```

## Credits

Forked from [wetty](https://github.com/krishnasrinivas/wetty) Copyright (c) 2014 Krishna Srinivas    

#### Software used in PH3AR Terminal

* [node-pty](https://github.com/microsoft/node-pty)
* [hterm](https://chromium.googlesource.com/apps/libapps/+/master/hterm/)
* [socket.io](http://socket.io/)
* [jquery](https://jquery.com/)
* [bootstrap](http://getbootstrap.com/)
* [bootswatch darkly theme](https://bootswatch.com/darkly/)
* [bootstrap file input](http://plugins.krajee.com/file-input)
* [store.js](https://github.com/marcuswestin/store.js/)
* [yalm](https://github.com/hobbyquaker/yalm)

## License

MIT

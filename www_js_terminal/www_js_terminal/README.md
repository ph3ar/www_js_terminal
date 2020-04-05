# JuTTY

[![License][mit-badge]][mit-url]
[![NPM version](https://badge.fury.io/js/jutty.svg)](http://badge.fury.io/js/jutty)
[![Dependency Status](https://img.shields.io/gemnasium/hobbyquaker/jutty.svg?maxAge=2592000)](https://gemnasium.com/github.com/hobbyquaker/jutty)

> Web-based SSH/Telnet client, useful in environments where only http(s) is allowed

![JuTTY Settings](/settings.png?raw=true)
![JuTTY](/terminal.png?raw=true)

## Install

*  `git clone https://github.com/hobbyquaker/jutty`

*  `cd jutty`

*  `npm install`

## Run on HTTP:

    node app.js -p 3000


## Run on HTTPS:

Always use HTTPS! If you don't have SSL certificates from a CA you can
create a self signed certificate using this command:

  `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 30000 -nodes`

And then run:

    node app.js --sslkey key.pem --sslcert cert.pem -p 3000


## Run jutty behind nginx:

Put the following configuration in nginx's conf:

    location /jutty {
	    proxy_pass http://127.0.0.1:3000;
	    proxy_http_version 1.1;
	    proxy_set_header Upgrade $http_upgrade;
	    proxy_set_header Connection "upgrade";
	    proxy_read_timeout 43200000;

	    proxy_set_header X-Real-IP $remote_addr;
	    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	    proxy_set_header Host $http_host;
	    proxy_set_header X-NginX-Proxy true;
    }



**Note that if your Nginx is configured for HTTPS you should run jutty without SSL.**

## Dockerized Version

This repo includes a Dockerfile you can use to create a Dockerized version of jutty. 
 


## Run jutty as a service daemon

Install jutty globally with -g option:

```bash
    $ sudo npm install jutty -g
    $ sudo cp /usr/local/lib/node_modules/jutty/bin/jutty.conf /etc/init
    $ sudo start jutty
```

This will start jutty on port 3000. If you want to change the port or redirect stdout/stderr you should change the last line in `jutty.conf` file, something like this:

    exec sudo -u root jutty -p 80 >> /var/log/jutty.log 2>&1

## Credits

Forked from [wetty](https://github.com/krishnasrinivas/wetty) Copyright (c) 2014 Krishna Srinivas    

#### Software used in JuTTY

* [hterm](https://chromium.googlesource.com/apps/libapps/+/master/hterm/)
* [pty.js](https://github.com/chjj/pty.js/)
* [socket.io](http://socket.io/)
* [jquery](https://jquery.com/)
* [bootstrap](http://getbootstrap.com/)
* [bootswatch darkly theme](https://bootswatch.com/darkly/)
* [bootstrap file input](http://plugins.krajee.com/file-input)
* [store.js](https://github.com/marcuswestin/store.js/)
* [yalm](https://github.com/hobbyquaker/yalm)
* [optimist](https://github.com/substack/node-optimist)

## License

MIT

Copyright (c) 2016 [Sebastian Raff](https://github.com/hobbyquaker)

[mit-badge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat
[mit-url]: LICENSE
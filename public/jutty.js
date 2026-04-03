$(document).ready(function () {


    var term;
    hterm.defaultStorage = new lib.Storage.Local();

    var socket = io(location.origin, {path: '/socket.io'});
    var buf = '';

    var $settings =     $('#settings');
    var $terminal =     $('#terminal');
    var $start =        $('#start');
    var $host =         $('#host');
    var $user =         $('#user');
    var $type =         $('#type');
    var $port =         $('#port');
    var $key =          $('#key');
    var $keyfile =      $("#keyfile");
    var $keyfilename =  $('#keyfilename');
    var $back =         $('#back');
    var $backbutton =   $('#backbutton');
    var $name =         $('#name');
    var $save =         $('#save');
    var $connections =  $('#connections');

    var $ssh =          $('#ssh');
    var $telnet =       $('#telnet');
    var $sshOptions =   $('.ssh');

    var savedConnections = store.get('connections') || {};
    listConnections();


    function Jutty(argv) {
        this.argv_ = argv;
        this.io = null;
        this.pid_ = -1;
    }

    Jutty.prototype.run = function () {
        this.io = this.argv_.io.push();

        this.io.onVTKeystroke = this.sendString_.bind(this);
        this.io.sendString = this.sendString_.bind(this);
        this.io.onTerminalResize = this.onTerminalResize.bind(this);
    };

    Jutty.prototype.sendString_ = function (str) {
        socket.emit('input', str);
    };

    Jutty.prototype.onTerminalResize = function (col, row) {
        socket.emit('resize', {col: col, row: row});
    };

    function htermInit(cb) {
        console.log('htermInit');
        lib.init(function () {
            term = new hterm.Terminal();
            window.term = term;
            term.decorate(document.getElementById('terminal'));

            term.setCursorPosition(0, 0);
            term.setCursorVisible(true);

            term.prefs_.set('ctrl-c-copy', true);
            term.prefs_.set('ctrl-v-paste', true);
            term.prefs_.set('use-default-window-copy', true);

            term.runCommandClass(Jutty, document.location.hash.substr(1));

            //socket.emit('start', {});

            /*
             socket.emit('resize', {
             col: term.screenSize.width,
             row: term.screenSize.height
             });
             */

            if (buf && buf != '') {
                term.io.writeUTF16(buf);
                buf = '';
            }
            cb();
        });
    }

    socket.on('connect', function () {
        $('#disconnect').hide();
    });

    socket.on('output', function (data) {
        if (!term) {
            buf += data;
            return;
        }
        term.io.writeUTF16(data);
    });

    socket.on('end', function () {
        console.log('process end');
        $back.show();
        $backbutton.focus();

    });

    socket.on('disconnect', function () {
        $('#disconnect').show();
    });

    $backbutton.click(function () {
        term.reset();
        $back.hide();
        $settings.show();
        $terminal.hide();
    });

    function getVals() {
        return {
            host:           $.trim($host.val()),
            user:           $.trim($user.val()),
            type:           $ssh.is(':checked') ? 'ssh' : 'telnet',
            port:           $.trim($port.val()),
            key:            $.trim($key.val()),
            keyfilename:    $.trim($keyfilename.val()),
            name:           $.trim($name.val())
        }
    }

    function setVals(obj) {
        console.log(obj);
        $host.val(obj.host || '');
        $user.val(obj.user || '');
        $type.val(obj.type || 'ssh');
        $port.val(obj.port || '22');
        $key.val(obj.key || '');
        $keyfilename.val(obj.keyfilename || '');

        if (obj.keyfilename) {
            $keyfile.fileinput('addToStack', new File([obj.key], obj.keyfilename));
            $keyfile.fileinput('refresh');
        } else {
            $keyfile.fileinput('reset');
        }

        $name.val('');
        checkButtons();
    }

    function listConnections() {
        var names = Object.keys(savedConnections).sort();
        var html = '';
        if (names.length === 0) {
            html = '<div class="list-group-item text-muted text-center p-3">' +
                   '<span class="glyphicon glyphicon-info-sign h2 d-block mb-3" aria-hidden="true"></span><br>' +
                   'No saved connections yet.<br>Fill out the form and click "Save" to add one.' +
                   '</div>';
        } else {
            names.forEach(function (name) {
                html += '<a class="list-group-item load" href="#" data-target="' + name + '">' + name +
                    '<button class="btn btn-xs btn-danger delete" data-name="' + name + '" aria-label="Delete ' + name + ' connection" title="Delete ' + name + ' connection">' +
                    '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>' +
                    '</button></a>';
            });
        }
        $connections.html(html);
        $('a.load').click(function (e) {
            e.stopPropagation();
            setVals(savedConnections[$(this).data('target')]);
            return false;
        });
        $('a.load').dblclick(function (e) {
            e.stopPropagation();
            start();
            return false;
        });
        $('button.delete').click(function (e) {
            e.stopPropagation();
            delete savedConnections[$(this).data('name')];
            store.set('connections', savedConnections);
            listConnections();
            return false;
        });
    }

    $start.click(start);

    function start() {
        var vals = getVals();
        htermInit(function () {
            vals.col = term.screenSize.width;
            vals.row = term.screenSize.height;
            socket.emit('start', vals);
            $settings.hide();
            $terminal.show().focus();
        });
    }

    $save.click(function () {
        var vals = getVals();
        savedConnections[vals.name] = vals;
        store.set('connections', savedConnections);

        listConnections();
    });



    $ssh.change(function () {
        $sshOptions.show();
    });
    $telnet.change(function () {
        $sshOptions.hide();
    });

    $keyfile.change(function () {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            $keyfilename.val(this.files[0].name);
            reader.onload = function (e) {
                $key.val(e.target.result);
            };
            reader.readAsText(this.files[0]);
        }
    });

    $keyfile.on('fileclear', function () {
        $key.val('');
        $keyfilename.val('');
    });

    function checkButtons() {
        var obj = getVals();
        if (obj.type === 'ssh') {
            if (obj.host && obj.user) {
                $start.removeAttr('disabled').removeAttr('title');
                if (obj.name) {
                    $save.removeAttr('disabled').removeAttr('title');
                } else {
                    $save.attr('disabled', true).attr('title', 'Connection name required to save');
                }
            } else {
                $start.attr('disabled', true).attr('title', 'Host and User required for SSH');
                $save.attr('disabled', true).attr('title', 'Host and User required for SSH');
            }
        } else {
            if (obj.host) {
                $start.removeAttr('disabled').removeAttr('title');
                if (obj.name) {
                    $save.removeAttr('disabled').removeAttr('title');
                } else {
                    $save.attr('disabled', true).attr('title', 'Connection name required to save');
                }
            } else {
                $start.attr('disabled', true).attr('title', 'Host required for Telnet');
                $save.attr('disabled', true).attr('title', 'Host required for Telnet');
            }
        }
    }

    $name.on('input propertychange', checkButtons);
    $host.on('input propertychange', checkButtons);
    $user.on('input propertychange', checkButtons);
    $ssh.change(checkButtons);
    $telnet.change(checkButtons);

    checkButtons();


});


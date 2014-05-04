var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs')

    app.listen(7777);
var clientNum = 0;

function handler(req, res) {
    fs.readFile(__dirname + '/index.html',
        function(err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

io.sockets.on('connection', function(socket) {
    clientNum++;
    socket.emit('news', {
        hello: clientNum
    });
    //user leave
    socket.on('disconnect', function() {
        clientNum--;
        // socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
    });
    socket.on("myClick", function(data) {
        /* Act on the event */
        console.log(data);
        socket.broadcast.emit("otherClick", data);
    });
});
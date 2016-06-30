// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('./')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('subscribe', function (room) {
        console.log('joining room', room);
        socket.join(room);
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        socket.broadcast.to(data.room).emit('new message', {
            name: socket.name,
            message: data.message
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (data) {
        if (addedUser) return;

        // we store the name in the socket session for this client
        socket.name = data.name;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        // socket.broadcast.to(data.room).emit('user joined', {
        //     name: socket.name,
        //     numUsers: numUsers
        // });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function (room) {
        socket.broadcast.to(room).emit('typing', {
            name: socket.name
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function (room) {
        socket.broadcast.to(room).emit('stop typing', {
            name: socket.name
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function (room) {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            // socket.broadcast.to(room).emit('user left', {
            //     name: socket.name,
            //     numUsers: numUsers
            // });
        }
    });
});

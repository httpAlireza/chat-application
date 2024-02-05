var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'chat'
    }
});

// Migrate the database
knex.migrate.latest({
    directory: __dirname + '/migrations'
})
    .then(() => console.log('Database migrated successfully'))
    .catch((err) => console.error('Error migrating database:', err));


var storeMessage = function (name, data) {
    messages.push({name: name, data: data});
    if (messages.length > prevChats) {
        messages.shift();
    }
};

//Setup the app with Express
app.use(express.static(__dirname + '/public'));

//Socket.io
io.on('connection', function (socket) {

    //Log activity
    socket.on('join', function (name) {
        socket.userName = name;
        socket.broadcast.emit('chat', name + ' has joined the chat');
        console.log(name + ' has joined the chat');

        //Log who has left
        socket.on('disconnect', function () {
            socket.broadcast.emit('chat', name + ' has left the chat');
            console.log(name + ' has left the chat');
        });
    });

    //Log chats
    socket.on('chat', function (message) {
        io.emit('chat', socket.userName + ': ' + message);

        // Save the message to the database
        knex('messages').insert({name: socket.userName, data: message})
            .then(() => console.log('Message saved to database'))
            .catch((err) => console.error('Error saving message to database:', err));
    });

    //Log previous chats for new users
    knex('messages').select('*')
        .then((messages) => {
            messages.forEach((message) => {
                socket.emit('chat', message.name + ': ' + message.data);
            });
        })
        .catch((err) => console.error('Error retrieving messages from database:', err));
});

//Listen at localhost:3000
server.listen(3000, function () {
    console.log('listening on *:3000');
});

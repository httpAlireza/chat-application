var express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
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


const secretKey = crypto.randomBytes(32).toString('hex');


app.use(bodyParser.json());
//Set up the app with Express
app.use(express.static(__dirname + '/public'));

// Authentication endpoint
app.post('/login', (req, res) => {
    const {username, password} = req.body;
    knex
        .select('*')
        .from('users')
        .where('username', username)
        .andWhere('password', password)
        .then(users => {
            if (users.length > 0) {
                console.log('User found:', username);
                const user = {username};
                const token = jwt.sign(user, secretKey, {expiresIn: '5m'});
                res.status(200).json({token});
            } else {
                console.log('User not found:', username);
                res.status(401).json({error: 'Authentication failed. Invalid username or password.'});
            }
        })
        .catch(error => {
            console.error('Error selecting user:', username, error);
            res.status(500).json({error: 'Internal server error.'});
        })
});

app.post('/signup', (req, res) => {
    const {username, nickname, password} = req.body;

    knex('users').insert({username: username, nickname: nickname, password: password})
        .then(() => {
            console.log('User created:', username);
            const user = {username};
            const token = jwt.sign(user, secretKey, {expiresIn: '5m'});
            res.status(201).json({token});
        })
        .catch(error => {
            console.error('Error inserting user:', username, error);
            res.status(500).json({error: 'Internal server error.'});
        })
});

io.on('connection', function (socket) {

    //Log activity
    socket.on('login', function (name, password) {
        socket.userName = name;
        socket.password = password;

        socket.broadcast.emit('chat', name + password + ' has joined the chat');
        console.log(name + ' has joined the chat');

        //Log who has left
        socket.on('disconnect', function () {
            socket.broadcast.emit('chat', name + ' has left the chat');
            console.log(name + ' has left the chat');
        });
    });

    //Log chats
    socket.on('chat', function (userName, message) {
        io.emit('chat', userName + ': ' + message);

        // Save the message to the database
        knex('messages').insert({name: userName, data: message})
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

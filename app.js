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

    knex
        .select('*')
        .from('users')
        .where('username', username)
        .then(users => {
            if (users.length > 0) {
                res.status(409).json({error: 'Username is already taken.'});
            } else {
                knex('users').insert({username: username, nickname: nickname, password: password})
                    .then(() => {
                        console.log('User created:', username);
                        const user = {username};
                        const token = jwt.sign(user, secretKey, {expiresIn: '1h'});
                        res.status(201).json({token});
                    })
                    .catch(error => {
                        console.error('Error inserting user:', username, error);
                        res.status(500).json({error: 'Internal server error.'});
                    })
            }
        })
        .catch(error => {
            console.error('Error selecting user:', username, error);
            res.status(500).json({error: 'Internal server error.'});
        })

});

app.post('/chat_list', (req, res) => {
    const {userName} = req.body;
    knex
        .select('*')
        .from('sessions')
        .where('username1', userName)
        .orWhere('username2', userName)
        .then(result => {
            console.log(result);
            let response = [];
            result.forEach(function (item) {
                const sessionId = item.id;
                let targetUsername;
                if (userName === item.username1) {
                    targetUsername = item.username2;
                } else {
                    targetUsername = item.username1;
                }
                response.push({sessionId, targetUsername});
            });
            console.log(response);
            res.status(200).json({chatList: response});
        }).catch(error => {
        console.error('Error finding chats for user:', userName, error);
        res.status(500).json({error: 'Something went wrong.'});
    })
});

app.post('/fetch_chats', (req, res) => {
    const {session_id} = req.body;
    knex
        .select('messages.data as data', 'messages.sender as sender')
        .from('sessions')
        .join('messages', 'sessions.id', '=', 'messages.session_id')
        .where('session_id',session_id)
        .orderBy('messages.created_at', 'asc') // Order by a specific column in ascending order
        .then(result => {
            console.log(result);
            let response = [];
            result.forEach(function (item) {
                const sender = item.sender;
                const data = item.data;
            });
            console.log(response);
            res.status(200).json({chats: response});
        }).catch(error => {
        console.error('Error finding chats for session:', session_id, error);
        res.status(500).json({error: 'Something went wrong.'});
    })
});

app.post('/add_session', (req, res) => {
    const {username1,username2} = req.body;

    knex('sessions').insert({username1: username1, username2:username2})
        .then(() => {
            console.log('sesion for users created:', username1, username2);
            res.status(201).json({});
        })
        .catch(error => {
            console.error('Error inserting user:', username1, username2, error);
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

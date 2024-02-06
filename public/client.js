(function ($) {
    $(function () {
        const socket = io();
        let userName;

        const token = Cookies.get('token');

        if (token) {
            const decodedToken = parseJwt(token);
            if (decodedToken.expired) {
                Cookies.remove('token');
                alert('Your session has expired. Please log in again.');
            } else {
                userName = decodedToken.username;
                fetchChatList(userName);
            }
        } else {
            $('#login-container').show();

            $('#login-form').submit(function (event) {
                event.preventDefault();
                const username = $('#username').val().trim();
                const password = $('#password').val().trim();

                if (username && password) {
                    authenticateUser(username, password);
                } else {
                    alert('Please enter both username and password.');
                }
            });

            $('#show-signup').on('click', function () {
                $('#login-container').toggle();
                $('#signup-container').toggle();
            });

            $('#signup-form').submit(function (event) {
                event.preventDefault();
                const username = $('#signup-username').val().trim();
                const nickname = $('#signup-nickname').val().trim();
                const password = $('#signup-password').val().trim();
                const retryPassword = $('#signup-retryPassword').val().trim();

                if (username && nickname && password && retryPassword) {
                    if (password !== retryPassword) {
                        alert('Passwords do not match.');
                    } else {
                        signupUser(username, nickname, password);
                    }
                } else {
                    alert('Please enter all the fields.');
                }
            });
        }

        function parseJwt(token) {
            try {
                // Get Token Header
                const base64HeaderUrl = token.split('.')[0];
                const base64Header = base64HeaderUrl.replace('-', '+').replace('_', '/');
                const headerData = JSON.parse(window.atob(base64Header));

                // Get Token Payload and Expiration
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace('-', '+').replace('_', '/');
                const payloadData = JSON.parse(window.atob(base64));

                // Validate Expiration
                const currentTimestamp = Math.floor(Date.now() / 1000);
                if (payloadData.exp && currentTimestamp > payloadData.exp) {
                    // Token has expired
                    return {expired: true};
                }

                payloadData.header = headerData;

                return payloadData;
            } catch (err) {
                return {error: true};
            }
        }


        function authenticateUser(username, password) {
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.toLowerCase(),
                    password: password,
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Authentication failed. Invalid username or password.');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Server response for log in:', data);

                    const token = data.token;

                    Cookies.set('token', token);

                    fetchChatList(username);
                })
                .catch(error => {
                    console.error('Error in log in:', error.message);
                    alert('Authentication failed. Please check your username and password.');
                });
        }

        function signupUser(username, nickname, password) {
            fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.toLowerCase(),
                    nickname: nickname,
                    password: password
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Sign up failed. Try again later.');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Server response for sign up:', data);

                    const token = data.token;

                    Cookies.set('token', token);

                    fetchChatList(username);
                })
                .catch(error => {
                    console.error('Error in sign up:', error);
                    alert('Signup failed. Please try again.');
                });
        }

        function joinChat() {
            // Hide login form, show chat container
            $('#login-container').hide();
            $('#signup-container').hide();
            $('#chat-container').show();

            // Emit the 'join' event to the server with the username
            socket.emit('join', userName);

            // Form submit
            $('#chat-form').submit(function () {
                socket.emit('chat', userName, $('#message').val());
                $('#message').val('');
                return false;
            });

            // Display chats
            socket.on('chat', function (message) {
                $('#chat-body').append($('<li>').text(message));
                $('html, body').animate({
                    scrollTop: $(document).height()
                });
            });

// Display users that join
            socket.on('join', function (data) {
                $('#chat-body').append($('<li>').text(data));
                $('html, body').animate({
                    scrollTop: $(document).height()
                });
            });
        }

        function fetchChatList(username) {
            // Fetch chat list from the server
            fetch('/chat_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName: username,
                }),
            })
                .then(response => {
                    console.log(response);
                    if (!response.ok) {
                        throw new Error('Failed to fetch chat list.');
                    }
                    return response.json();
                })
                .then(data => {
                    let chatList = data.chatList;
                    displayChats(chatList);
                })
                .catch(error => {
                    console.error('Error fetching chat list:', error.message);
                    alert('Failed to fetch chat list. Please try again.');
                });
        }

        function displayChats(chats) {
            // Hide chat buttons and show chat bar
            $('.chat-column').hide();
            $('#chat-form').show();

            // Display chats row by row
            chats.forEach(chat => {
                $('#chat-body').append($('<li>').text(chat.sender + ': ' + chat.data));
                $('html, body').animate({
                    scrollTop: $(document).height()
                });
            });
        }

        // Event listener for chat button click
        $(document).on('click', '.chat-column', function () {
            const sessionId = $(this).data('session-id');
            currentSessionId = sessionId;
            console.log('Clicked on chat button with sessionId:', sessionId);
            fetchChats(sessionId);
        });

        // Form submit
        $('#chat-form').submit(function () {
            // Use currentSessionId to send messages or handle other chat interactions
            socket.emit('chat', userName, $('#message').val());
            $('#message').val('');
            return false;
        });

        function fetchChats(sessionId) {
            fetch('/fetch_chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch chats.');
                    }
                    return response.json();
                })
                .then(data => {
                    let chats = data.chats;
                    displayChats(chats);
                })
                .catch(error => {
                    console.error('Error fetching chats:', error.message);
                    alert('Failed to fetch chats. Please try again.');
                });
        }

    });
})(jQuery);

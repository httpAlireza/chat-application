(function ($) {
    $(function () {
        var socket = io();
        var userName;

        const token = Cookies.get('token');

        if (token) {
            const decodedToken = parseJwt(token);
            if (decodedToken.expired) {
                alert('Your session has expired. Please log in again.');
            } else {
                userName = decodedToken.username;
                joinChat();
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
                    username: username,
                    password: password,
                }),
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Server response:', data);

                    // Assuming the server responds with a JWT upon successful authentication
                    const token = data.token;

                    // Save token to cookies
                    Cookies.set('token', token);

                    // Join the chat or perform any other actions
                    joinChat();
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Authentication failed. Please check your username and password.');
                });
        }

        function joinChat() {
            // Hide login form, show chat container
            $('#login-container').hide();
            $('#chat-container').show();

            // Emit the 'join' event to the server with the username
            socket.emit('join', userName);

            // Form submit
            $('#chat-form').submit(function () {
                socket.emit('chat', $('#message').val());
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
    });
})(jQuery);

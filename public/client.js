(function ($) {
    $(function () {
        var socket = io();
        socket.on('connect', function (data) {
            var userName = prompt('Please enter your user name');
            var password = prompt('Please enter your password'); // Updated prompt for clarity
            socket.emit('join', userName, password);
        });

        // Form submit
        $('form').submit(function () {
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
    });
})(jQuery);

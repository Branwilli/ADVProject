const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: {origin: "*"}
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('message', (message) => {
        console.log(message);
        io.emit('receivedMessage', message);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

http.listen(5000, () => console.log('listening on http://localhost:5000'));
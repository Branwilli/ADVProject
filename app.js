const socket = io('ws://localhost:5000');

socket.on('messsage', text => {
    const el = document.createElement('li');
    el.innerHTML = text;
    document.querySelector('ol').appendChild(el);
});

document.querySelector('button').onclick = () => {
    const text = document.querySelector('input').value;
    socket.emit('message', text)
}
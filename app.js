const socket = io('ws://localhost:8080');

socket.on('message', text => {
    
    const messageEl = document.createElement('div');
    messageEl.innerHTML = text;
    messageEl.style.backgroundColor = 'green';
    messageEl.style.color = 'white';
    messageEl.style.margin = '5px 0';
    messageEl.style.padding = '10px';
    messageEl.style.borderRadius = '5px';
    messageEl.style.border = '1px solid';
    messageEl.style.maxWidth = '30%';
    document.querySelector('#messageBox').appendChild(messageEl)

});

document.querySelector('button').onclick = () => {

    const text = document.querySelector('input').value;
    socket.emit('message: '+ text)
    
}
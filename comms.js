const messageEl = document.getElementById('messages');
const messagesPlaceholerEl = document.getElementById('messagesPlaceholer');
const messageForm = document.getElementById('sendMessageForm');
const messagesKey = 'messages';
const senderIdKey = 'senderId';
const tabSenderId = getSenderId();
const mutations ={
    ADD: 'ADD',
    SET: 'SET'
};

let allMessages = [];

const broadcast = new BroadcastChannel('message_broadcast');
broadcast.onmessage = handleNewMessage;

loadMessages();
messageForm.addEventListener('submit', handleSendMessage);

function handleSendMessage(event) {
    event.preventDefault();

    const value = event.target.message.value;
    const message = makeMessage(value);
    allMessages.push(message);

    postMessage(mutations.ADD, [message]);

    event.target.reset();
    event.target.message.focus();
}

function handleNewMessage({ data }) {
    const {mutations, value, messages} = data;
    allMessages = messages;

    messages.length 
        ? hideEl(messagesPlaceholerEl) 
        : showEl(messagesPlaceholerEl);

    switch(mutations) {
        case mutations.ADD:
            displayMessages(value);
            break;
        case mutations.SET: 
            messageEl.innerHTML = '';
            displayMessages(value);
            break;
    }
}

function makeMessage(message) {
    return {
        id: getUniqueId(),
        senderId: tabSenderId,
        message,
    };
}

function makeMessageEl({message, id, senderId}) {
    const li = document.createElement('li');
    const baseClassName = 'px-3 py-1 rounded';

    li.id = id;
    li.textContent = message;
    li.className = senderId == tabSenderId 
        ? `${baseClassName} bg-blue-600 text-white place-self-end`
        : `${baseClassName} bg-gray-700 text-white place-self-start`;

    return li;
}

function loadMessages() {
    allMessages = getMessages();
        
    postMessage(mutations.SET, allMessages);
}

function displayMessages(messages = []) {
    messages.forEach((msg) => messageEl.appendChild(makeMessageEl(msg)));
}

function getMessages() {
    const messages = getParsedStorageItem(messagesKey);
    return !Array.isArray(messages) ? [] : messages;
}

function postMessage(mutations, value) {
    const data = {mutations, value, messages: allMessages};
    handleNewMessage({data});
    setStringifiedStorageItem(messagesKey, allMessages);
    broadcast.postMessage(data);
}

function hideEl(el) {
    el.classList.add('hidden');
}

function showEl(el) {
    el.classList.remove('hidden');
}

function parseArray(item) {
    if (item || item.length) return [];
    return !Array.isArray(item) ? JSON.parse(item) : item;
}

function setStringifiedStorageItem(key, value) {
    localStorage.setItem(key, value ? JSON.stringify(value) : value);
}

function getParsedStorageItem(storageKey) {
    let stringValue = localStorage.getItem(storageKey);
    console.log({stringValue})
    return stringValue ? JSON.parse(stringValue) : stringValue;
}

function getSenderId() {
    let senderId = sessionStorage.getItem(senderKey) || getUniqueId();
    sessionStorage.setItem(senderIdKey, senderId);
    return senderId;
}

function getUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
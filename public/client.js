document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Get DOM elements
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatBox = document.getElementById('chat-box');
    const status = document.getElementById('status');
    const shareLinkInput = document.getElementById('share-link');
    const copyBtn = document.getElementById('copy-btn');
    
    // Get room ID from URL
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');

    if (!roomId) {
        window.location.href = '/'; // Redirect to home if no room ID
        return;
    }

    // Set shareable link
    shareLinkInput.value = window.location.href;
    copyBtn.addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy Link'; }, 2000);
    });

    // Join the room
    socket.emit('joinRoom', roomId);

    const addMessage = (message, type) => {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = message;
        msgDiv.classList.add('message', type); // e.g., 'sent', 'received', 'system'
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
    };

    const enableChat = () => {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        status.textContent = 'Connected! You can now chat.';
    };
    
    const disableChat = (message) => {
        messageInput.disabled = true;
        sendBtn.disabled = true;
        status.textContent = message;
    }

    // Event Listeners for Socket.IO
    socket.on('message', (msg) => {
        // Determine if the message was sent by this client or received
        const type = msg.id === socket.id ? 'sent' : 'received';
        addMessage(msg.text, type);
    });

    socket.on('waiting', () => {
        status.textContent = 'Waiting for another person to join...';
    });

    socket.on('startChat', () => {
        addMessage('Another user has joined the chat.', 'system');
        enableChat();
    });

    socket.on('userJoined', () => {
        addMessage('Another user has joined the chat.', 'system');
        enableChat();
    });

    socket.on('userLeft', (msg) => {
        addMessage(msg, 'system');
        disableChat('The other user has left. This chat is now closed.');
    });
    
    socket.on('roomFull', () => {
        document.body.innerHTML = '<div class="container centered"><h1>Chat Room Full</h1><p>This chat room is already full. Please create a new one.</p><a href="/"><button>Go Home</button></a></div>';
    });

    // Send message on button click
    sendBtn.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (text) {
            socket.emit('chatMessage', { id: socket.id, text });
            messageInput.value = '';
            messageInput.focus();
        }
    });

    // Send message on Enter key press
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });
});
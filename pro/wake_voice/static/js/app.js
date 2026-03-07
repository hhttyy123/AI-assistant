document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    const messages = document.getElementById('messages');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');

    let isListening = false;

    socket.on('connect', () => {
        console.log('已连接到服务器');
        statusDot.classList.add('active');
        messageInput.disabled = false;
        sendBtn.disabled = false;
    });

    socket.on('disconnect', () => {
        console.log('与服务器断开连接');
        statusDot.classList.remove('active');
        statusText.textContent = '未连接';
        messageInput.disabled = true;
        sendBtn.disabled = true;
    });

    socket.on('status', (data) => {
        console.log('状态:', data.message);
        statusText.textContent = data.message.includes('正在监听') ? '监听中...' : '已连接';

        // 如果显示正在监听，显示监听动画
        if (data.message.includes('正在监听')) {
            showListeningAnimation(true);
            isListening = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
        }
    });

    socket.on('wake_word_detected', (data) => {
        console.log('检测到唤醒词:', data.message);
        addMessage(data.message, 'wake-word', data.timestamp);
        showNotification('检测到唤醒词！');

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(data.message);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    });

    socket.on('receive_message', (data) => {
        addMessage(data.message, data.sender, data.timestamp);
    });

    startBtn.addEventListener('click', () => {
        fetch('/start_listening', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            isListening = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            statusText.textContent = '监听中...';
            showListeningAnimation(true);
        })
        .catch(error => {
            console.error('启动监听失败:', error);
        });
    });

    stopBtn.addEventListener('click', () => {
        fetch('/stop_listening', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            isListening = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusText.textContent = '已连接';
            showListeningAnimation(false);
        })
        .catch(error => {
            console.error('停止监听失败:', error);
        });
    });

    clearBtn.addEventListener('click', () => {
        messages.innerHTML = '';
    });

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('send_message', { message: message });
            messageInput.value = '';
        }
    }

    function addMessage(content, sender, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp || new Date().toLocaleTimeString('zh-CN');

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);

        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideInRight 0.3s;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    function showListeningAnimation(show) {
        let animation = document.querySelector('.listening-animation');

        if (!animation) {
            animation = document.createElement('div');
            animation.className = 'listening-animation';
            animation.innerHTML = `
                <div class="listening-icon">
                    <i class="fas fa-microphone"></i>
                </div>
                <p>正在监听唤醒词 "小笨"...</p>
            `;
            document.body.appendChild(animation);
        }

        if (show) {
            animation.classList.add('active');
        } else {
            animation.classList.remove('active');
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    addMessage('欢迎使用语音唤醒助手！系统已自动开始监听，请直接说出"小笨"开始对话。', 'assistant', new Date().toLocaleTimeString('zh-CN'));
});
const { ipcRenderer } = require('electron');

// 获取DOM元素
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// API配置
const API_KEY = "10ba5ae71e6d4a5dbd4c5abe168002c4.JhPqIaJC9jMMZQMT";
const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// 聊天历史记录
let chatHistory = [
    { role: 'system', content: '你是一个有用的AI助手，请用中文回答用户的问题。保持友好、专业的语气。' }
];

// 消息输入框回车事件
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 发送按钮点击事件
sendButton.addEventListener('click', sendMessage);

// 页面加载完成后聚焦输入框
window.onload = () => {
    messageInput.focus();
};

// 发送消息函数
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // 清空输入框
    messageInput.value = '';

    // 禁用输入
    messageInput.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = '发送中...';

    // 添加用户消息到界面
    addMessageToUI(message, 'user');

    // 添加到聊天历史
    chatHistory.push({ role: 'user', content: message });

    // 显示加载提示
    const loadingMessage = addMessageToUI('正在思考中', 'ai', true);

    try {
        // 调用AI API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'glm-4-flash',
                messages: chatHistory,
                temperature: 0.7,
                max_tokens: 1000,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // 移除加载提示
        loadingMessage.remove();

        // 添加AI回复到界面
        addMessageToUI(aiResponse, 'ai');

        // 添加到聊天历史
        chatHistory.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        console.error('API调用错误:', error);

        // 移除加载提示
        loadingMessage.remove();

        // 显示错误信息
        let errorMsg = '抱歉，发生了错误：';
        if (error.message.includes('401')) {
            errorMsg += 'API密钥无效，请检查你的API密钥是否正确';
        } else if (error.message.includes('403')) {
            errorMsg += '没有访问权限，请检查API密钥的权限设置';
        } else if (error.message.includes('429')) {
            errorMsg += '请求过于频繁，请稍后再试';
        } else {
            errorMsg += error.message;
        }

        addMessageToUI(errorMsg, 'ai');
    } finally {
        // 恢复输入
        messageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = '发送';
        messageInput.focus();
    }
}

// 添加消息到UI
function addMessageToUI(content, sender, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    if (isLoading) {
        messageDiv.className += ' loading';
    }
    messageDiv.textContent = content;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

// 创建滚动到底部按钮
function createScrollButton() {
    const button = document.createElement('button');
    button.className = 'scroll-to-bottom';
    button.textContent = '↓';
    button.title = '滚动到底部';
    button.style.position = 'fixed';
    button.style.bottom = '80px';
    button.style.right = '20px';
    button.style.display = 'none';

    button.addEventListener('click', () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        button.style.display = 'none';
    });

    return button;
}

// 监听滚动事件，显示/隐藏滚动按钮
chatMessages.addEventListener('scroll', () => {
    const scrollButton = document.getElementById('scrollButton') || createScrollButton();
    if (chatMessages.scrollTop < chatMessages.scrollHeight - chatMessages.clientHeight - 100) {
        scrollButton.style.display = 'block';
        if (!document.getElementById('scrollButton')) {
            scrollButton.id = 'scrollButton';
            document.body.appendChild(scrollButton);
        }
    } else {
        scrollButton.style.display = 'none';
    }
});

// 清除聊天历史功能
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + L 清除聊天历史
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        if (confirm('确定要清除所有聊天记录吗？')) {
            // 清除聊天历史（保留系统提示）
            chatHistory = [
                { role: 'system', content: '你是一个有用的AI助手，请用中文回答用户的问题。保持友好、专业的语气。' }
            ];
            // 清除界面上的消息（保留欢迎消息）
            chatMessages.innerHTML = '<div class="message ai-message">你好！我是GLM-4.6 AI助手，有什么可以帮助你的吗？</div>';
        }
    }
});

// 添加快捷键提示
document.addEventListener('DOMContentLoaded', () => {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        font-size: 12px;
        color: #888;
    `;
    tooltip.innerHTML = '提示：按 Ctrl+L 清除聊天记录';
    document.body.appendChild(tooltip);
});

// 悬浮球拖动功能
class FloatingBall {
    constructor() {
        this.ball = document.getElementById('floatingBall');
        this.isDragging = false;
        this.currentX;
        this.currentY;
        this.initialX;
        this.initialY;
        this.xOffset = 0;
        this.yOffset = 0;

        this.init();
    }

    init() {
        // 鼠标事件
        this.ball.addEventListener('mousedown', this.dragStart.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.dragEnd.bind(this));

        // 触摸事件（移动设备支持）
        this.ball.addEventListener('touchstart', this.dragStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.drag.bind(this), { passive: false });
        document.addEventListener('touchend', this.dragEnd.bind(this));

        // 添加hover效果
        this.ball.addEventListener('mouseenter', () => {
            if (!this.isDragging) {
                this.ball.style.opacity = '1';
                this.ball.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.4), 0 0 0 10px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
            }
        });

        this.ball.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                this.ball.style.opacity = '0.8';
                this.ball.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }
        });

        // 双击事件示例（可以添加其他功能）
        this.ball.addEventListener('dblclick', () => {
            this.resetPosition();
        });

        // 防止文字被选中
        this.ball.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
    }

    dragStart(e) {
        e.preventDefault();

        if (e.type === 'touchstart') {
            this.initialX = e.touches[0].clientX - this.xOffset;
            this.initialY = e.touches[0].clientY - this.yOffset;
        } else {
            this.initialX = e.clientX - this.xOffset;
            this.initialY = e.clientY - this.yOffset;
        }

        if (e.target === this.ball || this.ball.contains(e.target)) {
            this.isDragging = true;
            this.ball.classList.add('dragging');
            // 保存当前transform状态
            const currentTransform = window.getComputedStyle(this.ball).transform;
            if (currentTransform !== 'none') {
                const matrix = new DOMMatrix(currentTransform);
                this.xOffset = matrix.m41;
                this.yOffset = matrix.m42;
            }
        }
    }

    drag(e) {
        if (this.isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                this.currentX = e.touches[0].clientX - this.initialX;
                this.currentY = e.touches[0].clientY - this.initialY;
            } else {
                this.currentX = e.clientX - this.initialX;
                this.currentY = e.clientY - this.initialY;
            }

            this.xOffset = this.currentX;
            this.yOffset = this.currentY;

            this.setTranslate(this.currentX, this.currentY);
        }
    }

    setTranslate(xPos, yPos) {
        this.ball.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    dragEnd(e) {
        if (this.isDragging) {
            this.initialX = this.currentX;
            this.initialY = this.currentY;
            this.isDragging = false;
            this.ball.classList.remove('dragging');

            // 检查鼠标是否还在球上，恢复相应的hover效果
            const ballRect = this.ball.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            if (mouseX >= ballRect.left && mouseX <= ballRect.right &&
                mouseY >= ballRect.top && mouseY <= ballRect.bottom) {
                // 鼠标还在球上，保持hover效果
                this.ball.style.opacity = '1';
                this.ball.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.4), 0 0 0 10px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
            } else {
                // 鼠标不在球上，恢复正常效果
                this.ball.style.opacity = '0.8';
                this.ball.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }
        }
    }

    resetPosition() {
        this.xOffset = 0;
        this.yOffset = 0;
        this.ball.style.transform = 'translate(0, 0)';
    }
}

// 页面加载完成后初始化悬浮球
window.addEventListener('DOMContentLoaded', () => {
    new FloatingBall();
});


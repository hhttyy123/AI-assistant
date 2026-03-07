// 语音识别应用前端逻辑
const { ipcRenderer } = require('electron');

// 全局变量
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioStream;

// DOM元素
const recordBtn = document.getElementById('recordBtn');
const sendBtn = document.getElementById('sendBtn');
const textInput = document.getElementById('textInput');
const chatMessages = document.getElementById('chatMessages');

// 语音服务配置
const SPEECH_SERVICE_URL = 'http://localhost:8765';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('语音识别应用已加载');

    // 设置按钮事件监听
    recordBtn.addEventListener('click', toggleRecording);
    sendBtn.addEventListener('click', sendMessage);

    // 文本输入事件监听
    textInput.addEventListener('input', () => {
        sendBtn.disabled = !textInput.value.trim();
    });

    // 回车发送消息
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && textInput.value.trim()) {
            e.preventDefault();
            sendMessage();
        }
    });
});

// 切换录音状态
async function toggleRecording() {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
}

// 开始录音
async function startRecording() {
    try {
        // 请求麦克风权限
        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,  // 16kHz采样率，适合语音识别
                channelCount: 1,    // 单声道
                echoCancellation: true,
                noiseSuppression: true
            }
        });

        // 创建MediaRecorder
        mediaRecorder = new MediaRecorder(audioStream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        // 设置录音事件处理
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            await processRecording();
        };

        // 开始录音
        audioChunks = [];
        mediaRecorder.start();

        // 更新UI状态
        isRecording = true;
        recordBtn.querySelector('span:last-child').textContent = '停止录音';
        recordBtn.classList.add('recording');

        console.log('录音已开始');

    } catch (error) {
        console.error('开始录音失败:', error);
        alert('无法访问麦克风，请检查权限设置');
    }
}

// 停止录音
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();

        // 停止音频流
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }

        // 更新UI状态
        isRecording = false;
        recordBtn.querySelector('span:last-child').textContent = '开始录音';
        recordBtn.classList.remove('recording');

        console.log('录音已停止');
    }
}

// 处理录音数据
async function processRecording() {
    try {
        if (audioChunks.length === 0) {
            showError('没有录制到音频数据');
            return;
        }

        // 创建音频Blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        // 转换为WAV格式（更适合语音识别）
        const wavBlob = await convertToWav(audioBlob);

        // 发送到语音识别服务
        await sendToSpeechService(wavBlob);

    } catch (error) {
        console.error('处理录音失败:', error);
        alert('处理录音时发生错误');
    }
}

// 转换音频格式为WAV
async function convertToWav(audioBlob) {
    // 这里使用简单的转换，实际项目中可能需要更复杂的音频处理
    // 为了简化，我们直接发送原始数据，让Python服务处理
    return audioBlob;
}

// 发送音频到语音识别服务
async function sendToSpeechService(audioBlob) {
    try {
        const response = await fetch(`${SPEECH_SERVICE_URL}/recognize`, {
            method: 'POST',
            body: audioBlob,  // 直接发送音频数据
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        });

        const result = await response.json();

        if (result.success) {
            displayRecognitionResult(result);
        } else {
            alert(result.error || '语音识别失败');
        }

    } catch (error) {
        console.error('发送到语音服务失败:', error);
        alert('无法连接到语音识别服务');
    }
}

// 显示语音识别结果
function displayRecognitionResult(result) {
    if (result.text && result.text.trim()) {
        // 将语音识别结果填入输入框
        textInput.value = result.text;
        sendBtn.disabled = false;
        textInput.focus();

        // 自动发送到AI
        setTimeout(() => {
            sendToAI(result.text);
        }, 1000);
    }
    console.log('识别结果:', result);
}

// 发送消息给AI
async function sendMessage() {
    const message = textInput.value.trim();
    if (!message) return;

    // 清空输入框
    textInput.value = '';
    sendBtn.disabled = true;

    // 添加用户消息到对话
    addMessage('user', message);

    // 发送到AI
    sendToAI(message);
}

// 发送消息到AI服务
async function sendToAI(message) {
    try {
        const response = await fetch(`${SPEECH_SERVICE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversation_id: 'default'
            })
        });

        const result = await response.json();

        if (result.success) {
            addMessage('assistant', result.reply);
        } else {
            addMessage('system', `AI回复失败: ${result.error || '未知错误'}`);
        }

    } catch (error) {
        console.error('发送到AI失败:', error);
        addMessage('system', '无法连接到AI服务，请检查网络连接');
    }
}

// 添加消息到对话区域
function addMessage(role, content) {
    // 首次对话时清除默认提示
    const placeholder = chatMessages.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;

    messageDiv.appendChild(messageContent);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// 显示错误信息
function showError(message) {
    addMessage('system', `错误: ${message}`);
}

// 添加键盘快捷键支持
document.addEventListener('keydown', (event) => {
    // 空格键控制录音
    if (event.code === 'Space' && event.target.tagName !== 'INPUT') {
        event.preventDefault();
        toggleRecording();
    }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
});
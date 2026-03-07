// 语音识别应用前端逻辑 - 结合voice-ai-chat的UI和electron_back_v的后端API

// 全局变量
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
let audioStream;
let isContinuousRecordingMode = false; // 连续录音模式标志
let silenceTimer; // 静音检测定时器
let lastVoiceActivityTime; // 最后一次语音活动时间
let audioContext; // 音频上下文
let analyser; // 音频分析器
let isVoiceActive = false; // 语音活动状态

// DOM元素
const voiceButton = document.getElementById('voiceButton');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const statusBar = document.getElementById('statusBar');
const volumeIndicator = document.getElementById('volumeIndicator');
const volumeLevel = document.getElementById('volumeLevel');
const continuousButton = document.getElementById('continuousButton');
const continuousModeIndicator = document.getElementById('continuousModeIndicator');

// 语音服务配置
const SPEECH_SERVICE_URL = 'http://localhost:8765';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('语音识别应用已加载');

    // 确保DOM元素存在
    if (!voiceButton) {
        console.error('voiceButton not found');
        return;
    }
    
    // 设置按钮事件监听
    voiceButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Voice button clicked, current state:', isRecording);
        toggleVoiceRecording();
    });
    
    if (sendButton) {
        sendButton.addEventListener('click', sendTextMessage);
    }

    // 文本输入事件监听
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            sendButton.disabled = !messageInput.value.trim() || isProcessing;
        });

        // 回车发送消息
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && messageInput.value.trim() && !isProcessing) {
                e.preventDefault();
                sendTextMessage();
            }
        });
    }

    // 初始状态
    setIdleState();
    console.log('Initialization complete');
});

// 处理键盘事件
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendTextMessage();
    }
}

// 切换语音录制
async function toggleVoiceRecording() {
    console.log('toggleVoiceRecording called, isRecording:', isRecording);
    if (isRecording) {
        console.log('Stopping recording...');
        stopRecording();
    } else {
        console.log('Starting recording...');
        await startRecording();
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
                noiseSuppression: true,
                autoGainControl: true
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
        setRecordingState();
        updateStatus(isContinuousRecordingMode ? '连续录音模式 - 正在监听...' : '正在录音...', true);
        volumeIndicator.style.display = 'flex';

        // 显示音量指示和语音活动检测
        showVolumeIndicator(audioStream);
        setupVoiceActivityDetection(audioStream);

        console.log('录音已开始');

    } catch (error) {
        console.error('开始录音失败:', error);
        updateStatus('错误：无法访问麦克风');
        setIdleState();
    }
}

// 停止录音
function stopRecording() {
    console.log('stopRecording called, mediaRecorder state:', mediaRecorder ? mediaRecorder.state : 'null');
    
    // 清除静音检测定时器
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log('MediaRecorder stopped');
    }

    // 停止音频流
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
        console.log('Audio stream stopped');
    }

    // 关闭音频上下文
    if (audioContext) {
        audioContext.close();
        audioContext = null;
        analyser = null;
    }

    // 更新UI状态
    isRecording = false;
    isVoiceActive = false;
    
    // 如果是连续录音模式，不设置为空闲状态
    if (!isContinuousRecordingMode) {
        setIdleState();
        volumeIndicator.style.display = 'none';
    } else {
        // 连续录音模式下，设置处理状态但不隐藏音量指示器
        setProcessingState();
    }

    console.log('录音已停止');
}

// 显示音量指示器
function showVolumeIndicator(stream) {
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function updateVolume() {
        if (!isRecording) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const volumePercent = (average / 255) * 100;

        volumeLevel.style.width = volumePercent + '%';
        requestAnimationFrame(updateVolume);
    }

    updateVolume();
}

// 设置语音活动检测
function setupVoiceActivityDetection(stream) {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const threshold = 10; // 声音阈值，可根据实际情况调整
    
    // 初始化最后语音活动时间
    lastVoiceActivityTime = Date.now();
    isVoiceActive = false;
    
    function checkVoiceActivity() {
        if (!isRecording) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > threshold) {
            // 检测到声音
            if (!isVoiceActive) {
                isVoiceActive = true;
                console.log('检测到语音活动');
            }
            lastVoiceActivityTime = Date.now();
            
            // 清除之前的静音定时器
            if (silenceTimer) {
                clearTimeout(silenceTimer);
            }
            
            // 设置新的静音检测定时器
            silenceTimer = setTimeout(() => {
                if (isRecording) {
                    console.log('检测到1.6秒静音，自动停止录音');
                    updateStatus('检测到静音，正在处理...');
                    stopRecording();
                }
            }, 1600);
        }
        
        requestAnimationFrame(checkVoiceActivity);
    }
    
    checkVoiceActivity();
}

// 处理录音数据
async function processRecording() {
    try {
        if (audioChunks.length === 0) {
            showError('没有录制到音频数据');
            
            // 在连续录音模式下，即使没有录制到数据也要继续
            if (isContinuousRecordingMode) {
                setTimeout(() => {
                    if (!isRecording && isContinuousRecordingMode) {
                        updateStatus('连续录音模式 - 准备开始下一次录音...');
                        startRecording();
                    }
                }, 1000);
            }
            return;
        }

        // 创建音频Blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        // 转换为WAV格式（更适合语音识别）
        const wavBlob = await convertToWav(audioBlob);

        // 更新UI状态
        setProcessingState();
        updateStatus('正在识别语音...');

        // 发送到语音识别服务
        await sendToSpeechService(wavBlob);

    } catch (error) {
        console.error('处理录音失败:', error);
        showError('处理录音时发生错误');
        
        if (!isContinuousRecordingMode) {
            setIdleState();
        } else {
            // 连续录音模式下，即使处理失败也要继续
            setTimeout(() => {
                if (!isRecording && isContinuousRecordingMode) {
                    updateStatus('连续录音模式 - 准备开始下一次录音...');
                    startRecording();
                }
            }, 1000);
        }
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
            showError(`语音识别失败: ${result.error || '未知错误'}`);
            if (!isContinuousRecordingMode) {
                setIdleState();
            } else {
                // 连续录音模式下，即使识别失败也要继续
                setTimeout(() => {
                    if (!isRecording && isContinuousRecordingMode) {
                        updateStatus('连续录音模式 - 准备开始下一次录音...');
                        startRecording();
                    }
                }, 1000);
            }
        }

    } catch (error) {
        console.error('发送到语音服务失败:', error);
        showError('无法连接到语音识别服务');
        
        if (!isContinuousRecordingMode) {
            setIdleState();
        } else {
            // 连续录音模式下，即使出错也要继续
            setTimeout(() => {
                if (!isRecording && isContinuousRecordingMode) {
                    updateStatus('连续录音模式 - 准备开始下一次录音...');
                    startRecording();
                }
            }, 1000);
        }
    }
}

// 显示语音识别结果
function displayRecognitionResult(result) {
    if (result.text && result.text.trim()) {
        // 处理语音间断，添加标点符号
        let processedText = processSpeechPauses(result.text);

        // 添加用户消息到对话
        addMessage(processedText, 'user');

        // 发送到AI
        sendToAI(processedText);
    } else {
        showError('未识别到有效语音内容');
        if (!isContinuousRecordingMode) {
            setIdleState();
        } else {
            // 连续录音模式下，即使没有识别到内容也要继续
            setTimeout(() => {
                if (!isRecording && isContinuousRecordingMode) {
                    updateStatus('连续录音模式 - 准备开始下一次录音...');
                    startRecording();
                }
            }, 1000);
        }
    }
    console.log('识别结果:', result);
}

// 处理语音间断，添加适当的标点符号
function processSpeechPauses(text) {
    if (!text || !text.trim()) return text;
    
    let processedText = text.trim();
    
    // 处理多个空格，替换为逗号
    processedText = processedText.replace(/\s{2,}/g, '，');
    
    // 处理句子末尾没有标点的情况
    processedText = processedText.replace(/([^.!?，。！？])\s*$/g, '$1。');
    
    // 处理连续的逗号
    processedText = processedText.replace(/，{2,}/g, '，');
    
    // 处理逗号后跟句号的情况
    processedText = processedText.replace(/，。/g, '。');
    
    return processedText;
}

// 发送文本消息
function sendTextMessage() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;

    messageInput.value = '';
    sendButton.disabled = true;

    // 添加用户消息到对话
    addMessage(message, 'user');

    // 发送到AI
    sendToAI(message);
}

// 发送消息到AI服务
async function sendToAI(message) {
    try {
        setProcessingState();
        updateStatus('正在获取AI回复...');

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
            addMessage(result.reply, 'ai');
            updateStatus('准备就绪');
            
            // 检查是否处于连续录音模式
            if (isContinuousRecordingMode) {
                // 立即准备开始下一次录音，减少延迟
                updateStatus('连续录音模式 - 准备开始下一次录音...');
                
                // 使用更短的延迟，并立即更新UI状态
                setTimeout(() => {
                    if (!isRecording && isContinuousRecordingMode) {
                        console.log('连续录音模式：开始下一次录音');
                        startRecording();
                    }
                }, 200); // 进一步减少延迟到0.2秒，提高响应速度
            }
        } else {
            showError(`AI回复失败: ${result.error || '未知错误'}`);
        }

    } catch (error) {
        console.error('发送到AI失败:', error);
        showError('无法连接到AI服务，请检查网络连接');
        
        // 即使出错，如果是连续录音模式也要继续
        if (isContinuousRecordingMode && !isRecording) {
            setTimeout(() => {
                updateStatus('连续录音模式 - 准备开始下一次录音...');
                startRecording();
            }, 1000);
        }
    } finally {
        // 如果不是连续录音模式，则设置为空闲状态
        if (!isContinuousRecordingMode) {
            setIdleState();
            messageInput.focus();
        } else {
            // 连续录音模式下，确保处理状态被重置
            isProcessing = false;
        }
    }
}

// 设置UI状态
function setIdleState() {
    console.log('Setting idle state');
    isRecording = false;
    isProcessing = false;
    
    // 根据连续录音模式设置不同的按钮状态
    if (voiceButton) {
        if (isContinuousRecordingMode) {
            voiceButton.className = 'voice-button processing';
            voiceButton.innerHTML = '🔄';
        } else {
            voiceButton.className = 'voice-button idle';
            voiceButton.innerHTML = '🎤';
        }
    }
    
    if (messageInput) {
        messageInput.disabled = false;
    }
    if (sendButton) {
        sendButton.disabled = !messageInput.value.trim();
    }
}

function setRecordingState() {
    console.log('Setting recording state');
    isRecording = true;
    if (voiceButton) {
        voiceButton.className = 'voice-button recording';
        voiceButton.innerHTML = '⏹️';
    }
    if (messageInput) {
        messageInput.disabled = true;
    }
    if (sendButton) {
        sendButton.disabled = true;
    }
}

function setProcessingState() {
    console.log('Setting processing state');
    isProcessing = true;
    if (voiceButton) {
        if (isContinuousRecordingMode) {
            voiceButton.className = 'voice-button processing';
            voiceButton.innerHTML = '🔄';
        } else {
            voiceButton.className = 'voice-button processing';
            voiceButton.innerHTML = '⏳';
        }
    }
    if (messageInput) {
        messageInput.disabled = true;
    }
    if (sendButton) {
        sendButton.disabled = true;
    }
}

// 更新状态栏
function updateStatus(message, isRecordingStatus = false) {
    statusBar.textContent = message;
    statusBar.className = isRecordingStatus ? 'status-bar recording' : 'status-bar';
}

// 添加消息到聊天界面
function addMessage(content, sender, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    if (isLoading) {
        messageDiv.innerHTML = '<div class="loading"></div> ' + content;
    } else {
        messageDiv.textContent = content;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

// 显示错误信息
function showError(message) {
    addMessage(message, 'system');
    updateStatus('发生错误');
}

// 设置相关
function toggleSettings() {
    // 切换连续录音模式
    toggleContinuousMode();
}

// 切换连续录音模式
function toggleContinuousMode() {
    isContinuousRecordingMode = !isContinuousRecordingMode;
    
    if (isContinuousRecordingMode) {
        updateStatus('连续录音模式已开启');
        addMessage('连续录音模式已开启 - AI回复后将自动开始下一次录音', 'system');
        
        // 更新UI状态
        if (continuousButton) {
            continuousButton.style.background = 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)';
            continuousButton.textContent = '停止连续';
        }
        
        if (continuousModeIndicator) {
            continuousModeIndicator.style.display = 'block';
        }
        
        // 如果当前没有在录音，立即开始录音
        if (!isRecording && !isProcessing) {
            updateStatus('连续录音模式 - 正在启动录音...');
            startRecording();
        }
    } else {
        updateStatus('连续录音模式已关闭');
        addMessage('连续录音模式已关闭', 'system');
        
        // 更新UI状态
        if (continuousButton) {
            continuousButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            continuousButton.textContent = '连续录音';
        }
        
        if (continuousModeIndicator) {
            continuousModeIndicator.style.display = 'none';
        }
        
        // 如果正在录音，停止录音
        if (isRecording) {
            stopRecording();
        }
        
        // 重置按钮状态
        setIdleState();
    }
}

// 添加键盘快捷键支持
document.addEventListener('keydown', (event) => {
    // 空格键控制录音
    if (event.code === 'Space' && event.target.tagName !== 'INPUT') {
        event.preventDefault();
        toggleVoiceRecording();
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

// 备用事件处理 - 确保按钮点击能够工作
setTimeout(() => {
    const voiceBtn = document.getElementById('voiceButton');
    const sendBtn = document.getElementById('sendButton');
    const msgInput = document.getElementById('messageInput');
    
    if (voiceBtn) {
        // 移除所有现有的事件监听器
        const newVoiceBtn = voiceBtn.cloneNode(true);
        voiceBtn.parentNode.replaceChild(newVoiceBtn, voiceBtn);
        
        // 添加新的事件监听器
        newVoiceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Voice button clicked (backup handler)');
            toggleVoiceRecording();
        });
        
        console.log('Voice button backup event handler attached');
    }
    
    if (sendBtn && msgInput) {
        // 为发送按钮和输入框添加备用事件处理
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendTextMessage();
        });
        
        msgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && msgInput.value.trim() && !isProcessing) {
                e.preventDefault();
                sendTextMessage();
            }
        });
        
        console.log('Send button and input backup event handlers attached');
    }
}, 500);
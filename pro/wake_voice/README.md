# 语音唤醒聊天助手

一个基于Python Flask和WebSocket的语音唤醒聊天应用。当你说出唤醒词时，助手会回复"你好，有什么可以帮助你的吗？"

## 功能特点

- 🎤 **语音唤醒词检测**: 使用Porcupine引擎，高精度识别"小笨"唤醒词
- 💬 **实时聊天界面**: 美观的Web聊天界面，支持文字输入和语音唤醒
- 🔄 **WebSocket通信**: 实时双向通信，无需刷新页面
- 🔊 **语音合成回复**: 自动朗读助手的回复
- 📱 **响应式设计**: 适配各种屏幕尺寸

## 安装步骤

### 1. 安装Python依赖

```bash
pip install -r requirements.txt
```

### 2. 安装系统依赖

**Windows:**
- 安装 [PyAudio](https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio) for Windows
- 下载对应的whl文件后使用: `pip install PyAudio-0.2.11-cp39-cp39-win_amd64.whl`

**macOS:**
```bash
brew install portaudio
pip install pyaudio
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install portaudio19-dev
pip install pyaudio
```

## 使用方法

1. **启动应用**:
   ```bash
   python app.py
   ```

2. **访问界面**:
   打开浏览器访问 `http://localhost:5000`

3. **开始使用**:
   - 点击"开始监听"按钮启动语音监听
   - 说出唤醒词："小笨"
   - 助手会自动回复："你好，有什么可以帮助你的吗？"
   - 也可以直接在输入框输入文字消息

## 项目结构

```
wake_voice/
├── app.py                 # 主应用程序
├── requirements.txt       # Python依赖
├── templates/
│   └── index.html        # 前端页面
├── static/
│   ├── css/
│   │   └── style.css     # 样式文件
│   └── js/
│       └── app.js        # 前端JavaScript
└── README.md             # 项目说明
```

## 技术栈

- **后端**: Python Flask + Flask-SocketIO
- **前端**: HTML5 + CSS3 + JavaScript + Socket.IO
- **语音识别**: SpeechRecognition (Google Speech API)
- **实时通信**: WebSocket

## 注意事项

1. 确保麦克风权限已开启
2. 需要稳定的网络连接以使用Google语音识别API
3. 首次使用可能需要授权浏览器使用麦克风
4. 建议在安静环境下使用以获得更好的识别效果

## 自定义设置

### 修改唤醒词
目前使用的是 Porcupine 唤醒词引擎训练好的"小笨"唤醒词文件。如需使用其他唤醒词，需要：

1. 在 [PicoVoice Console](https://console.picovoice.ai/) 训练新的唤醒词模型
2. 下载对应的 `.ppn` 文件
3. 修改 `app.py` 中的 `PPN_PATH` 变量指向新的唤醒词文件

```python
PPN_PATH = "./你的唤醒词.ppn"  # 修改为你的唤醒词文件路径
```

### 修改回复消息
在 `app.py` 的 `_listen_loop` 方法中修改回复内容:

```python
socketio.emit('wake_word_detected', {
    'message': '你的自定义回复消息',
    'timestamp': datetime.now().strftime('%H:%M:%S')
})
```

## 故障排除

1. **PyAudio安装失败**:
   - Windows: 下载预编译的wheel文件安装
   - macOS: 确保已安装portaudio
   - Linux: 安装portaudio19-dev

2. **麦克风无响应**:
   - 检查浏览器麦克风权限
   - 确认系统麦克风设备正常
   - 尝试更换浏览器

3. **语音识别不准确**:
   - 确保环境安静
   - 清晰说出唤醒词
   - 检查麦克风质量
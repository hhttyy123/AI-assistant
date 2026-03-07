# AI聊天语音识别应用

这是一个集成了语音识别功能的 Electron AI 聊天应用。

## 功能特性

- 🎤 **语音输入**: 按住麦克风按钮进行语音输入
- 🤖 **AI对话**: 基于智谱AI的GLM-4.6语言模型
- 💬 **实时识别**: 使用 FunASR 进行中文语音识别
- 🎨 **现代UI**: 精美的深色主题界面
- 📱 **响应式设计**: 支持不同屏幕尺寸

## 环境要求

### Python 环境
- Python 3.7+
- 安装语音识别依赖：
```bash
pip install -r requirements.txt
pip install modelscope  # 用于下载 CosyVoice 模型
```

## 模型下载

**⚠️ 重要**: 本项目使用 CosyVoice 进行语音合成，模型文件较大（约 1GB+），未包含在 Git 仓库中。

### 方法一：自动下载（推荐）

运行模型下载脚本：

```bash
cd pro/ali
python download_models.py
```

脚本会自动从 ModelScope 下载所需模型到 `pretrained_models/` 目录。

### 方法二：手动下载

如需手动下载，请访问 [CosyVoice 官方仓库](https://github.com/FunAudioLLM/CosyVoice) 查看详细说明。

### Node.js 环境
- Node.js 16+
- npm 或 yarn

## 安装步骤

1. **安装 Python 依赖**
```bash
pip install funasr>=1.0.0 pyaudio>=0.2.11 numpy>=1.21.0 safetensors>=0.4.3 huggingface-hub>=0.30.0,<1.0.0
```

2. **安装 Electron 依赖**
```bash
cd "electron(javascipt)"
npm install
```

## 使用方法

### 启动应用
```bash
cd "electron(javascipt)"
npm start
```

### 语音输入
1. 等待语音模型加载完成（右下角会提示"语音功能已就绪"）
2. 按住输入框旁边的麦克风按钮 🎤
3. 开始说话（支持中文）
4. 松开按钮停止录音
5. 识别结果会自动填入输入框
6. 点击发送按钮或按 Enter 发送消息

### 快捷键
- `Enter`: 发送消息
- `Ctrl+L`: 清除聊天记录

## 文件结构

```
ali/
├── chat.py                    # 原始语音识别程序
├── voice_service.py           # 语音识别服务模块
├── requirements.txt           # Python 依赖
├── README.md                  # 使用说明
├── electron(javascipt)/       # Electron 应用目录
│   ├── main.js               # 主进程
│   ├── index.html            # 界面HTML
│   ├── renderer.js           # 渲染进程
│   ├── package.json          # Node.js 依赖配置
│   └── dist/                 # 打包输出目录
└── temp/                     # 临时音频文件目录
```

## 工作原理

1. **语音录制**: 使用 Web Audio API 录制用户语音
2. **格式转换**: 将录制的音频转换为 16kHz 单声道 WAV 格式
3. **语音识别**: 通过 IPC 调用 Python 的 FunASR 进行识别
4. **结果返回**: 识别结果返回并填入聊天输入框

## 故障排除

### 常见问题

1. **麦克风权限**
   - 确保应用有麦克风访问权限
   - 检查系统设置中的权限配置

2. **语音模型加载失败**
   - 检查 Python 环境是否正确安装
   - 确认 FunASR 相关依赖已安装
   - 检查网络连接（首次运行需要下载模型）

3. **语音识别不准确**
   - 确保环境安静，减少背景噪音
   - 说话时保持正常语速和音量
   - 确保麦克风距离适中

4. **应用无法启动**
   - 检查 Node.js 版本是否满足要求
   - 确认所有 npm 依赖已正确安装
   - 查看控制台错误信息

### 开发调试

启用开发者工具查看详细日志：
```javascript
// 在 main.js 中取消注释
mainWindow.webContents.openDevTools();
```

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **桌面应用**: Electron 27
- **语音识别**: FunASR (阿里达摩院)
- **AI模型**: GLM-4.6 (智谱AI)

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 集成语音识别功能
- 实现语音输入UI
- 添加实时识别反馈
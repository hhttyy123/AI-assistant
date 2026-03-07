# AI 语音对话助手

> 基于 Electron + FunASR + GLM-4.6 的智能语音对话桌面应用

## 项目简介

这是一个功能完整的 AI 语音对话助手，支持语音识别、文字对话和连续录音模式。通过直观的图形界面，你可以轻松与 AI 进行自然对话。

## 核心功能

### 1. 语音识别
- 基于 **FunASR** 的中文语音识别
- 支持实时语音转文字
- 高精度的语音识别能力

### 2. AI 对话
- 集成 **智谱 GLM-4.6** 大语言模型
- 支持多轮对话，保持上下文记忆
- 智能回复，自然流畅

### 3. 交互方式
- 🎤 **语音输入**：点击麦克风按钮说话
- ⌨️ **文字输入**：在输入框中直接输入文字
- 🔄 **连续录音模式**：持续监听语音输入

### 4. 图形界面
- 现代化的聊天界面设计
- 实时音量指示器
- 状态反馈和动画效果

## 技术栈

| 技术 | 用途 |
|------|------|
| **Electron** | 桌面应用框架 |
| **FunASR** | 语音识别（damo/speech_paraformer-large） |
| **GLM-4.6** | AI 对话大模型 |
| **Python** | 语音识别和对话服务后端 |
| **HTML/CSS/JS** | 前端界面 |

## 项目结构

```
toge/
├── main.js              # Electron 主进程
├── index.html           # 前端界面
├── renderer.js          # 渲染进程逻辑
├── speech_service.py    # 语音识别 & AI 对话服务
├── wake_voice/          # 唤醒词相关文件
│   └── 小笨_zh_windows_v4_0_0.ppn  # Porcupine 唤醒词模型
├── package.json         # 项目配置
└── dist/               # 打包输出目录
```

## 安装与运行

### 前置要求

- Node.js (推荐 v18+)
- Python 3.8+
- FunASR 及依赖

### 安装步骤

```bash
# 1. 安装 Node.js 依赖
npm install

# 2. 安装 Python 依赖
pip install funasr requests

# 3. 启动应用
npm start
```

### 打包发布

```bash
# 打包为安装包
npm run build

# 仅打包不安装
npm run pack
```

## API 接口

语音服务运行在 `http://localhost:8765`

| 端点 | 方法 | 描述 |
|------|------|------|
| `/recognize` | POST | 语音识别 |
| `/chat` | POST | AI 对话 |
| `/status` | GET | 服务状态检查 |

## 界面预览

- **渐变色头部设计**
- **消息气泡动画**
- **实时音量指示**
- **状态栏反馈**
- **连续录音模式指示器**

## 配置说明

在 `speech_service.py` 中配置 API Key：

```python
API_KEY = "your_api_key_here"  # 智谱 API Key
```

## 注意事项

1. 首次运行会自动下载 FunASR 模型（约 1GB）
2. 需要有效的智谱 API Key 才能使用 AI 对话功能
3. 麦克风权限需要被允许

## 开发者

- 项目名称：AI 语音对话助手
- 版本：1.0.0
- Electron 版本：34.0.0

## 许可证

MIT License

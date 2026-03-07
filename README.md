<div align="center">

# 🎙️ AI 语音对话助手

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Light-blue.svg)](https://github.com)
[![Electron](https://img.shields.io/badge/Electron-34.0.0-9FE349.svg)](https://electronjs.org)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB.svg)](https://python.org)

**基于 Electron + Whisper + GLM-4.6 的跨平台智能语音桌面应用**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [技术栈](#-技术栈) • [演示截图](#-演示截图) • [贡献指南](#-贡献指南)

</div>

---

## 📖 项目简介

AI 语音对话助手是一款功能强大的跨平台桌面应用，集成了先进的语音识别和人工智能技术。通过 OpenAI Whisper 模型实现高精度语音识别，结合智谱 GLM-4.6 大语言模型，为用户提供自然流畅的语音交互体验。

### ✨ 核心亮点

- 🎯 **高精度语音识别** - 基于 Whisper 模型，识别准确率达 95%+
- 🤖 **智能多轮对话** - 对接 GLM-4.6 API，支持上下文理解
- 🔊 **语音合成播报** - TTS 语音输出，双重模态反馈
- 💾 **本地数据持久化** - 聊天记录本地存储，隐私安全
- 🌐 **跨平台支持** - 支持 Windows/macOS/Linux 三大平台

---

## 🚀 功能特性

### 语音交互
- ✅ 实时语音采集与波形可视化
- ✅ 高精度语音识别（支持中英文）
- ✅ 语音合成播报（TTS）
- ✅ 双模态交互（语音 + 文本）

### AI 对话
- ✅ 智能多轮对话
- ✅ 上下文记忆管理
- ✅ 流畅自然的回复体验
- ✅ 支持中英文对话

### 用户体验
- ✅ 现代化 UI 设计
- ✅ 响应式布局
- ✅ 聊天记录本地保存
- ✅ 简洁易用的操作界面

---

## 🎯 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **Python** >= 3.9
- **npm** 或 **yarn**

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/AI-assistant.git
cd AI-assistant/pro/electron_front
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置 API 密钥

在项目中配置你的 GLM-4.6 API 密钥：

```javascript
// 在配置文件中设置
const API_KEY = "your_glm_api_key_here";
```

#### 4. 启动应用

```bash
npm start
```

#### 5. 打包发布

```bash
# 打包为可执行文件
npm run build

# 仅打包不发布
npm run pack
```

---

## 🛠️ 技术栈

### 前端技术
| 技术 | 说明 |
|------|------|
| [Electron](https://electronjs.org) | 跨平台桌面应用框架 |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | 音频采集与处理 |
| HTML5 + CSS3 | 界面渲染 |
| JavaScript (ES6+) | 核心逻辑 |

### 后端技术
| 技术 | 说明 |
|------|------|
| [Node.js](https://nodejs.org) | 主进程管理 |
| [Python](https://python.org) | Whisper 模型调用 |
| [OpenAI Whisper](https://github.com/openai/whisper) | 语音识别模型 |

### AI 能力
| 技术 | 说明 |
|------|------|
| [智谱 GLM-4.6](https://open.bigmodel.cn) | 大语言模型 API |
| TTS 引擎 | 语音合成 |

---

## 📸 演示截图

> 注：截图待补充

---

## 📁 项目结构

```
AI-assistant/
├── pro/
│   ├── electron_front/          # Electron 前端应用
│   │   ├── main.js             # 主进程
│   │   ├── renderer.js         # 渲染进程
│   │   ├── index.html          # 主界面
│   │   ├── ai-chat.html        # AI 聊天界面
│   │   └── package.json        # 项目配置
│   │
│   ├── wake_voice/             # Python 唤醒模块
│   │   ├── app.py              # Flask 应用
│   │   ├── requirements.txt    # Python 依赖
│   │   └── templates/          # 前端模板
│   │
│   └── electron_back_v/        # Electron 后端版本
│
└── README.md                    # 项目说明
```

---

## 🔧 配置说明

### Whisper 模型配置

确保已安装 Whisper 及其依赖：

```bash
pip install openai-whisper
pip install torch
```

### GLM API 配置

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn)
2. 注册并获取 API Key
3. 在项目中配置 API Key

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 代码规范

- 遵循 ESLint 配置
- 使用有意义的变量命名
- 添加必要的注释说明

---

## 📝 开源协议

本项目基于 [MIT License](LICENSE.txt) 开源。

---

## 📧 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/yourusername/AI-assistant/issues)
- 发送邮件至：your.email@example.com

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div>

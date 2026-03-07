# AI语音对话助手

一个基于Electron的智能语音聊天应用，集成了语音识别和AI对话功能，让你可以与AI进行自然的语音交流。

## 功能特点

- 🎤 **语音输入**: 支持实时录音和音频文件上传
- 🤖 **AI对话**: 集成GLM-4.6模型，智能回复
- 🔊 **语音播放**: AI回复自动转为语音播放
- 💬 **文本聊天**: 支持文字输入和聊天记录
- 🌈 **美观界面**: 现代化的UI设计

## 环境要求

- Node.js 14+
- Python 3.7+
- 已安装的依赖包:
  - whisper
  - opencc (可选，用于简繁转换)

## 安装步骤

### 1. 安装Python依赖

```bash
pip install whisper
pip install opencc  # 可选：用于简体中文转换
```

### 2. 安装Node.js依赖

```bash
cd voice-ai-chat
npm install
```

### 3. 运行应用

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## 使用说明

1. **语音对话**
   - 点击麦克风按钮开始录音
   - 说话后再次点击停止录音
   - 程序会自动识别语音并发送给AI
   - AI回复会自动播放语音

2. **文字聊天**
   - 在输入框中输入消息
   - 按回车或点击发送按钮
   - AI会以文字形式回复

3. **音量指示**
   - 录音时会显示实时音量

## 构建打包

Windows:
```bash
npm run build
```

生成的安装包在 `dist` 目录中。

## 注意事项

1. 首次使用时，whisper会下载模型文件，需要联网
2. 确保麦克风权限已开启
3. 如果Python不在系统PATH中，可能需要修改代码中的Python路径

## 技术栈

- Electron: 跨平台桌面应用框架
- Python Whisper: OpenAI的语音识别模型
- GLM-4.6: 智谱AI的对话模型
- Node.js: JavaScript运行环境

## 许可证

MIT License
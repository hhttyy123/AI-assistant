// 设置环境变量，减少GPU警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// 引入 Electron 核心模块
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

// 避免GC回收导致窗口关闭
let mainWindow;
let speechServiceProcess;

// 启动语音识别服务
function startSpeechService() {
  try {
    console.log('正在启动语音识别服务...');

    // 启动Python语音识别服务
    speechServiceProcess = spawn('python', [path.join(__dirname, 'speech_service.py')], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    // 监听服务输出
    speechServiceProcess.stdout.on('data', (data) => {
      console.log(`语音服务: ${data.toString().trim()}`);
    });

    speechServiceProcess.stderr.on('data', (data) => {
      console.error(`语音服务错误: ${data.toString().trim()}`);
    });

    // 监听服务退出
    speechServiceProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`语音服务异常退出，代码: ${code}`);
      } else {
        console.log('语音服务已停止');
      }
      speechServiceProcess = null;
    });

    // 等待服务启动
    setTimeout(() => {
      console.log('语音服务启动完成');
    }, 3000);

  } catch (error) {
    console.error('启动语音服务失败:', error);
  }
}

// 停止语音识别服务
function stopSpeechService() {
  if (speechServiceProcess) {
    console.log('正在停止语音识别服务...');
    speechServiceProcess.kill();
    speechServiceProcess = null;
  }
}

// 创建窗口函数
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,  // 允许渲染进程使用Node.js
      contextIsolation: false // 关闭上下文隔离（方便调试）
    }
  });

  // 加载本地HTML文件
  mainWindow.loadFile('index.html');

  // 打开开发者工具（调试用，打包时可注释）
  //mainWindow.webContents.openDevTools();

  // 过滤GPU错误信息
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    // 忽略GPU相关的错误
    if (message.includes('GPU') ||
        message.includes('command_buffer_proxy_impl.cc') ||
        message.includes('WaitForGetOffsetInRange')) {
      event.preventDefault();
    }
  });

  // 窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron 初始化完成后创建窗口
app.whenReady().then(() => {
  startSpeechService();  // 启动语音服务
  createWindow();        // 创建窗口
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  stopSpeechService();  // 停止语音服务
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  stopSpeechService();  // 确保语音服务被停止
});

// macOS 点击dock图标时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
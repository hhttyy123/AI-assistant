// 引入 Electron 核心模块
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

// 避免GC回收导致窗口关闭
let mainWindow;

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

  // 窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron 初始化完成后创建窗口
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 点击dock图标时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
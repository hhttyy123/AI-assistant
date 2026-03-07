// 简单的 Electron 启动脚本
const { spawn } = require('child_process');
const path = require('path');

console.log('正在启动 Electron 应用...');

// 尝试不同的方式启动 Electron
const electronPath = path.join(__dirname, 'electron(javascipt)', 'node_modules', '.bin', 'electron.cmd');
const mainScript = path.join(__dirname, 'electron(javascipt)', 'main.js');

// 如果本地 Electron 不存在，尝试使用全局安装的
function startApp() {
  let electronCmd;

  if (require('fs').existsSync(electronPath)) {
    // 使用本地安装的 Electron
    electronCmd = spawn(electronPath, [mainScript], {
      stdio: 'inherit',
      shell: true
    });
  } else {
    // 尝试使用全局 Electron 或 npx
    electronCmd = spawn('npx', ['electron', mainScript], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, 'electron(javascipt)')
    });
  }

  electronCmd.on('error', (err) => {
    console.error('启动失败:', err.message);
    console.log('\n请尝试以下方法安装依赖:');
    console.log('1. 进入 electron(javascipt) 目录');
    console.log('2. 运行: npm install');
    console.log('3. 或者全局安装: npm install -g electron');
  });

  electronCmd.on('close', (code) => {
    console.log(`应用退出，代码: ${code}`);
  });
}

startApp();
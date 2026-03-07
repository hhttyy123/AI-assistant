const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const os = require('os');

// 避免GC回收导致窗口关闭
let mainWindow;

// 创建窗口函数
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 750,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        icon: path.join(__dirname, 'icon.ico'), // 可选：添加图标
        show: false
    });

    // 加载HTML文件
    mainWindow.loadFile('index.html');

    // 窗口准备好后显示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 打开开发者工具（调试用）
    // mainWindow.webContents.openDevTools();

    // 窗口关闭时触发
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 保存音频数据到临时文件
function saveAudioBuffer(buffer) {
    const tempDir = os.tmpdir();
    const audioFile = path.join(tempDir, `audio_${Date.now()}.webm`);
    fs.writeFileSync(audioFile, buffer);
    return audioFile;
}

// 清理临时文件
function cleanupFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('清理临时文件失败:', error);
    }
}

// 使用Python Whisper进行语音识别
function recognizeWithPythonWhisper(audioFile, event) {
    return new Promise((resolve, reject) => {
        const pythonScript = `
import whisper
import sys
import json
import io

# 引入简繁转换库
try:
    from opencc import OpenCC
    converter = OpenCC('t2s')
    print("OpenCC初始化成功", file=sys.stderr)
except ImportError:
    print("警告: 未安装opencc库，将不进行简繁转换", file=sys.stderr)
    converter = None
except Exception as e:
    print(f"OpenCC初始化失败: {e}，将不进行简繁转换", file=sys.stderr)
    converter = None

# 设置输出编码为UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def convert_to_simplified(text):
    """将文本转换为简体中文"""
    if converter and text:
        try:
            import re
            clean_text = re.sub(r'[^\\u4e00-\\u9fff\\u3400-\\u4dbf\\w\\s.,!?;:()（）【】""\'\'""、。，；：！？—…]', '', text)
            converted = converter.convert(clean_text)
            return converted
        except Exception as e:
            print(f"转换失败: {e}", file=sys.stderr)
            return text
    return text

try:
    # 加载模型
    model = whisper.load_model("base")

    # 识别音频
    result = model.transcribe("${audioFile.replace(/\\/g, '\\\\')}", language="zh")

    # 获取识别的文本并转换为简体中文
    recognized_text = result.get("text", "").strip()
    simplified_text = convert_to_simplified(recognized_text)

    # 输出结果
    output = {
        "success": True,
        "text": simplified_text,
        "language": result["language"]
    }

    print(json.dumps(output, ensure_ascii=False))

except Exception as e:
    output = {
        "success": False,
        "error": str(e)
    }
    print(json.dumps(output, ensure_ascii=False))
`;

        const python = spawn('python', ['-c', pythonScript], {
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                console.error('Python执行错误:', errorOutput);
                event.reply('voice-recognized', {
                    success: false,
                    error: `Python执行错误: ${errorOutput}`
                });
                reject(new Error(errorOutput));
                return;
            }

            try {
                const result = JSON.parse(output);
                console.log('识别结果:', result);
                event.reply('voice-recognized', result);
                resolve(result);
            } catch (parseError) {
                console.error('解析结果失败:', parseError);
                console.log('原始输出:', output);
                event.reply('voice-recognized', {
                    success: false,
                    error: '解析识别结果失败'
                });
                reject(parseError);
            }
        });

        python.on('error', (err) => {
            console.error('启动Python失败:', err);
            event.reply('voice-recognized', {
                success: false,
                error: `无法启动Python: ${err.message}`
            });
            reject(err);
        });
    });
}

// AI聊天配置
const AI_CONFIG = {
    API_KEY: "10ba5ae71e6d4a5dbd4c5abe168002c4.JhPqIaJC9jMMZQMT",
    API_URL: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    MODEL: "glm-4-flash",
    TEMPERATURE: 0.7,
    MAX_TOKENS: 1000
};

// 调用AI API
async function callAI(prompt) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: AI_CONFIG.MODEL,
            messages: [
                {
                    role: 'system',
                    content: '你是一个友好、聪明的AI助手。请用简洁、自然的中文回答用户的问题。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: AI_CONFIG.TEMPERATURE,
            max_tokens: AI_CONFIG.MAX_TOKENS
        });

        const options = {
            hostname: 'open.bigmodel.cn',
            path: '/api/paas/v4/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.choices && response.choices.length > 0) {
                        resolve({
                            success: true,
                            response: response.choices[0].message.content.trim()
                        });
                    } else {
                        resolve({
                            success: false,
                            error: 'AI回复格式错误'
                        });
                    }
                } catch (error) {
                    resolve({
                        success: false,
                        error: '解析AI回复失败: ' + error.message
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve({
                success: false,
                error: '网络请求失败: ' + error.message
            });
        });

        req.write(postData);
        req.end();
    });
}

// 文字转语音（可选功能）
function speakText(text) {
    // 使用Windows的sapi.spvoice或macOS的say命令
    if (process.platform === 'win32') {
        // Windows
        const powershell = spawn('powershell', [
            '-Command',
            `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak('${text.replace(/'/g, "''")}')`
        ]);
    } else if (process.platform === 'darwin') {
        // macOS
        spawn('say', [text]);
    } else {
        // Linux (需要espeak或其他TTS引擎)
        console.log('语音播放功能在当前平台不可用');
    }
}

// IPC处理：接收语音输入
ipcMain.on('voice-input', async (event, audioBuffer) => {
    try {
        console.log('收到语音数据，开始处理...');

        // 保存音频到临时文件
        const tempAudioFile = saveAudioBuffer(audioBuffer);
        console.log('音频已保存到:', tempAudioFile);

        // 使用Python Whisper进行语音识别
        console.log('开始语音识别...');
        const recognitionResult = await recognizeWithPythonWhisper(tempAudioFile, event);

        // 清理临时文件
        cleanupFile(tempAudioFile);

        // 如果识别成功，发送给AI
        if (recognitionResult.success) {
            console.log('识别文本:', recognitionResult.text);

            // 调用AI
            const aiResponse = await callAI(recognitionResult.text);

            // 发送AI回复
            event.reply('ai-response', {
                ...aiResponse,
                speak: true  // 可以通过设置控制是否播放语音
            });
        } else {
            // 识别失败，恢复UI状态
            event.reply('ai-response', {
                success: false,
                error: '语音识别失败: ' + (recognitionResult.error || '未知错误')
            });
        }

    } catch (error) {
        console.error('处理语音输入失败:', error);

        // 发送错误信息
        event.reply('ai-response', {
            success: false,
            error: error.message || '语音处理过程中发生未知错误'
        });
    }
});

// IPC处理：接收文本输入
ipcMain.on('text-input', async (event, text) => {
    try {
        console.log('收到文本输入:', text);

        // 调用AI
        const aiResponse = await callAI(text);

        // 发送AI回复
        event.reply('ai-response', {
            ...aiResponse,
            speak: false  // 文本输入不播放语音
        });

    } catch (error) {
        console.error('处理文本输入失败:', error);

        // 发送错误信息
        event.reply('ai-response', {
            success: false,
            error: error.message || '处理文本输入时发生未知错误'
        });
    }
});

// IPC处理：播放文本语音
ipcMain.on('speak-text', (event, text) => {
    console.log('播放语音:', text);
    speakText(text);
});

// Electron 初始化完成后创建窗口
app.whenReady().then(() => {
    createWindow();
});

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
@echo off
echo AI语音对话助手启动中...
echo.

REM 检查是否已安装Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.7或更高版本
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 检查是否已安装whisper
python -c "import whisper" >nul 2>&1
if errorlevel 1 (
    echo [提示] 正在安装whisper，请稍候...
    python -m pip install whisper
    if errorlevel 1 (
        echo [错误] 安装whisper失败，请手动运行：python -m pip install whisper
        pause
        exit /b 1
    )
)

echo 启动应用...
npm start

pause
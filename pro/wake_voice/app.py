from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import threading
import time
import struct
import os
from datetime import datetime
import pvporcupine
import pyaudio

app = Flask(__name__)
app.config['SECRET_KEY'] = 'wake_voice_secret'
socketio = SocketIO(app, cors_allowed_origins="*")

# 从t.py文件中获取配置
ACCESS_KEY = "CFcsaJbgpN8p/l2dM1FtOqgOU+anAhLt1Ia6hjns8GDxQ5/liwnPeQ=="
PPN_PATH = "./小笨_zh_windows_v4_0_0.ppn"
MODEL_PATH = r"C:/Python310/Lib/site-packages/pvporcupine/lib/common/porcupine_params_zh.pv"

class WakeWordDetector:
    def __init__(self):
        self.is_listening = False
        self.porcupine = None
        self.pa = None
        self.stream = None
        self.wake_word_detected_callback = None

    def initialize(self):
        try:
            self.porcupine = pvporcupine.create(
                access_key=ACCESS_KEY,
                keyword_paths=[PPN_PATH],
                model_path=MODEL_PATH,
                sensitivities=[0.6]  # 0~1，越大越灵敏
            )

            self.pa = pyaudio.PyAudio()

            self.stream = self.pa.open(
                rate=self.porcupine.sample_rate,      # 16000
                channels=1,
                format=pyaudio.paInt16,
                input=True,
                frames_per_buffer=self.porcupine.frame_length
            )

            print("🎧 唤醒词引擎初始化成功")
            return True
        except Exception as e:
            print(f"初始化失败: {e}")
            return False

    def start_listening(self):
        if not self.is_listening:
            # 如果还没初始化，先初始化
            if not self.porcupine:
                if not self.initialize():
                    return False
            self.is_listening = True
            threading.Thread(target=self._listen_loop, daemon=True).start()
            return True
        return False

    def stop_listening(self):
        self.is_listening = False
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        if self.pa:
            self.pa.terminate()
        if self.porcupine:
            self.porcupine.delete()

    def _listen_loop(self):
        print("🎧 正在监听唤醒词 '小笨'...")

        try:
            while self.is_listening:
                pcm = self.stream.read(
                    self.porcupine.frame_length,
                    exception_on_overflow=False
                )

                pcm = struct.unpack_from(
                    "h" * self.porcupine.frame_length,
                    pcm
                )

                result = self.porcupine.process(pcm)

                if result >= 0:
                    print("🔥 唤醒词触发！", time.strftime("%H:%M:%S"))

                    # 通过WebSocket发送唤醒事件
                    socketio.emit('wake_word_detected', {
                        'message': '你好，有什么可以帮助你的吗？',
                        'timestamp': datetime.now().strftime('%H:%M:%S')
                    })

                    # 防止连续触发
                    time.sleep(0.8)

        except Exception as e:
            print(f"监听错误: {e}")
            self.is_listening = False

detector = WakeWordDetector()

# 自动开始监听
print("\n" + "="*50)
print("正在初始化唤醒词检测器...")
print("="*50)

try:
    if detector.initialize():
        print("\n🎧 初始化成功，启动监听线程...")
        if detector.start_listening():
            print("\n✅ 唤醒词检测器已自动启动")
            print("🎧 正在监听唤醒词 '小笨'...")
            print("🔧 请直接说出 '小笨' 来测试唤醒功能")
        else:
            print("\n❌ 启动监听失败")
    else:
        print("\n⚠️ 唤醒词检测器初始化失败")
        print("📝 请通过页面手动启动")
except Exception as e:
    print(f"\n⚠️ 自动启动失败: {e}")
    print("📝 请通过页面手动启动监听")

print("="*50 + "\n")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/status')
def status():
    return jsonify({
        'is_listening': detector.is_listening,
        'message': '正在监听' if detector.is_listening else '未在监听'
    })

@app.route('/start_listening', methods=['POST'])
def start_listening():
    if detector.start_listening():
        return jsonify({'status': 'success', 'message': '开始监听唤醒词'})
    else:
        return jsonify({'status': 'error', 'message': '启动监听失败'})

@app.route('/stop_listening', methods=['POST'])
def stop_listening():
    detector.stop_listening()
    return jsonify({'status': 'success', 'message': '停止监听'})

@socketio.on('connect')
def handle_connect():
    print('客户端已连接')
    # 通知客户端监听状态
    if detector.is_listening:
        emit('status', {'message': '已连接到服务器，正在监听唤醒词...'})
    else:
        emit('status', {'message': '已连接到服务器，监听未启动'})

@socketio.on('disconnect')
def handle_disconnect():
    print('客户端已断开连接')

@socketio.on('send_message')
def handle_message(data):
    message = data['message']
    timestamp = datetime.now().strftime('%H:%M:%S')

    emit('receive_message', {
        'message': message,
        'sender': 'user',
        'timestamp': timestamp
    }, broadcast=True)

    time.sleep(1)
    emit('receive_message', {
        'message': f'收到你的消息: {message}',
        'sender': 'assistant',
        'timestamp': datetime.now().strftime('%H:%M:%S')
    }, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
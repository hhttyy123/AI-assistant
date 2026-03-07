#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
基于FunASR的语音识别服务
为Electron应用提供语音识别API接口
"""

import os
import json
import tempfile
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import threading
import time
import requests

# 导入FunASR相关模块
try:
    from funasr import AutoModel
    from funasr.utils.postprocess_utils import rich_transcription_postprocess
    FUNASR_AVAILABLE = True
    print("FunASR已成功导入")
except ImportError as e:
    FUNASR_AVAILABLE = False
    print(f"FunASR导入失败: {e}")

# GLM4.6 AI对话服务
class ChatAI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        self.model = "glm-4"

    def chat(self, message, conversation_history=None):
        """调用GLM4.6 API进行对话"""
        try:
            # 构建消息历史
            messages = []
            if conversation_history:
                messages.extend(conversation_history)
            messages.append({"role": "user", "content": message})

            # 请求头
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            # 请求数据
            data = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2000
            }

            # 发送请求
            response = requests.post(
                self.base_url,
                headers=headers,
                json=data,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    reply = result["choices"][0]["message"]["content"]
                    return {
                        "success": True,
                        "reply": reply.strip(),
                        "usage": result.get("usage", {})
                    }
                else:
                    return {
                        "success": False,
                        "error": "AI响应格式异常"
                    }
            else:
                return {
                    "success": False,
                    "error": f"API请求失败: {response.status_code}"
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"对话处理失败: {str(e)}"
            }


# 初始化AI服务
API_KEY = "10ba5ae71e6d4a5dbd4c5abe168002c4.JhPqIaJC9jMMZQMT"
ai_service = ChatAI(API_KEY)
print("GLM4.6 AI服务已初始化")

# 对话历史存储（简单内存存储）
conversation_histories = {}


class SpeechRecognitionHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.model = None
        self.init_model()
        super().__init__(*args, **kwargs)

    def init_model(self):
        """初始化FunASR模型"""
        if not FUNASR_AVAILABLE:
            print("FunASR不可用，跳过模型初始化")
            return

        try:
            # 初始化FunASR模型，使用已经下载的中文语音识别模型
            self.model = AutoModel(
                model="damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch",
                device="cpu",
                disable_update=True  # 禁用更新检查，避免重复下载
            )
            print("FunASR模型初始化成功")
        except Exception as e:
            print(f"FunASR模型初始化失败: {e}")
            self.model = None

    def do_POST(self):
        """处理POST请求"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        if self.path == '/recognize':
            self.handle_recognize(post_data)
        elif self.path == '/chat':
            self.handle_chat(post_data)
        else:
            self.send_error(404, "Not Found")

    def handle_recognize(self, audio_data):
        """处理语音识别请求"""
        try:
            if self.model is None:
                self.send_error_response("FunASR模型未初始化")
                return

            # 创建临时文件保存音频数据
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_file_path = tmp_file.name

            try:
                # 使用FunASR进行语音识别
                result = self.model.generate(
                    input=tmp_file_path,
                    cache={},
                    language="zh",  # 中文
                    use_itn=True,   # 使用文本格式化
                )

                # 提取识别结果
                if result and len(result) > 0:
                    text = result[0]['text'] if 'text' in result[0] else ""
                    confidence = result[0].get('confidence', 0)

                    response_data = {
                        "success": True,
                        "text": text,
                        "confidence": confidence,
                        "timestamp": time.time()
                    }
                else:
                    response_data = {
                        "success": False,
                        "error": "未识别到语音内容"
                    }

                self.send_json_response(response_data)

            finally:
                # 清理临时文件
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)

        except Exception as e:
            self.send_error_response(f"语音识别失败: {str(e)}")

    def handle_chat(self, data):
        """处理AI对话请求"""
        try:
            # 解析请求数据
            request_data = json.loads(data.decode('utf-8'))
            message = request_data.get('message', '')
            conversation_id = request_data.get('conversation_id', 'default')

            if not message.strip():
                self.send_error_response("消息不能为空")
                return

            # 获取对话历史
            if conversation_id not in conversation_histories:
                conversation_histories[conversation_id] = []

            history = conversation_histories[conversation_id]

            # 调用AI服务
            result = ai_service.chat(message, history)

            if result['success']:
                # 更新对话历史
                history.append({"role": "user", "content": message})
                history.append({"role": "assistant", "content": result['reply']})

                # 限制历史长度，避免太长
                if len(history) > 20:
                    history = history[-20:]
                    conversation_histories[conversation_id] = history

                # 返回回复
                response_data = {
                    "success": True,
                    "reply": result['reply'],
                    "conversation_id": conversation_id,
                    "timestamp": time.time(),
                    "usage": result.get('usage', {})
                }
            else:
                response_data = {
                    "success": False,
                    "error": result['error'],
                    "conversation_id": conversation_id,
                    "timestamp": time.time()
                }

            self.send_json_response(response_data)

        except json.JSONDecodeError:
            self.send_error_response("请求数据格式错误")
        except Exception as e:
            self.send_error_response(f"对话处理失败: {str(e)}")

    def do_GET(self):
        """处理GET请求"""
        if self.path == '/status':
            self.handle_status()
        else:
            self.send_error(404, "Not Found")

    def handle_status(self):
        """检查服务状态"""
        status_data = {
            "service": "语音识别服务",
            "status": "running",
            "funasr_available": FUNASR_AVAILABLE,
            "model_loaded": self.model is not None,
            "timestamp": time.time()
        }
        self.send_json_response(status_data)

    def send_json_response(self, data, status_code=200):
        """发送JSON响应"""
        response_data = json.dumps(data, ensure_ascii=False, indent=2)

        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_data.encode('utf-8'))))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        self.wfile.write(response_data.encode('utf-8'))

    def send_error_response(self, error_message, status_code=500):
        """发送错误响应"""
        error_data = {
            "success": False,
            "error": error_message,
            "timestamp": time.time()
        }
        self.send_json_response(error_data, status_code)

    def log_message(self, format, *args):
        """重写日志方法以减少输出"""
        pass  # 静默处理，避免控制台输出过多信息

def start_server():
    """启动语音识别和AI对话服务器"""
    server_address = ('', 8765)
    httpd = HTTPServer(server_address, SpeechRecognitionHandler)

    print("智能语音助手服务已启动")
    print("服务地址: http://localhost:8765")
    print("API端点:")
    print("  POST /recognize - 语音识别")
    print("  POST /chat - AI对话")
    print("  GET /status - 服务状态")
    print("GLM4.6 AI服务已就绪")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器正在关闭...")
        httpd.shutdown()

if __name__ == '__main__':
    start_server()
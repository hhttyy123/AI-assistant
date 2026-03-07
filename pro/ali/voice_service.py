#!/usr/bin/env python3
"""
语音识别服务模块
用于 Electron 应用的语音识别功能
"""
import os
import sys
import json
import shutil
import wave
import pyaudio
from funasr import AutoModel

class VoiceRecognitionService:
    def __init__(self):
        self.model = None
        self.audio_path = "temp_audio.wav"

    def fix_env(self):
        """修复缓存和依赖缺失问题"""
        try:
            # 1. 删除异常缓存
            cache_path = os.path.expanduser("~/.cache/funasr")
            if os.path.exists(cache_path):
                shutil.rmtree(cache_path, ignore_errors=True)

            # 2. 检查核心依赖
            import safetensors
            import huggingface_hub
            return True
        except Exception as e:
            return False

    def load_model(self):
        """加载语音识别模型"""
        if self.model is not None:
            return True

        if not self.fix_env():
            return {"error": "依赖检查失败"}

        try:
            print(json.dumps({"status": "loading_model"}), file=sys.stderr)
            self.model = AutoModel(
                model="damo/speech_paraformer_asr_nostress-zh-cn-16k-common-vocab8404-online",
                trust_remote_code=True,
                cache_dir=os.path.expanduser("~/.cache/modelscope")
            )
            return True
        except Exception as e:
            return {"error": f"模型加载失败: {str(e)}"}

    def recognize_file(self, audio_file_path):
        """识别音频文件"""
        if not os.path.exists(audio_file_path):
            return {"error": "音频文件不存在"}

        if self.model is None:
            result = self.load_model()
            if result is not True:
                return result

        try:
            result = self.model.generate(input=audio_file_path, batch_size=1)
            text = result[0]["text"] if result else ""
            return {"text": text, "status": "success"}
        except Exception as e:
            return {"error": f"识别失败: {str(e)}"}

def main():
    """主函数，处理命令行调用"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "缺少参数"}))
        sys.exit(1)

    command = sys.argv[1]
    service = VoiceRecognitionService()

    if command == "init":
        # 初始化模型
        result = service.load_model()
        if result is True:
            print(json.dumps({"status": "model_loaded"}))
        else:
            print(json.dumps(result))

    elif command == "recognize":
        # 识别音频文件
        if len(sys.argv) < 3:
            print(json.dumps({"error": "缺少音频文件路径"}))
            sys.exit(1)

        audio_path = sys.argv[2]
        result = service.recognize_file(audio_path)
        print(json.dumps(result))

    else:
        print(json.dumps({"error": f"未知命令: {command}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
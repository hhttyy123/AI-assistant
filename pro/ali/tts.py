from funasr import AutoModel
import sounddevice as sd
import numpy as np

# 关键修正：使用最新的CosyVoice3轻量版模型名 + 开启trust_remote_code
model = AutoModel(
    model="damo/speech_cosyvoice3_tts_zh-cn_16k",  # 修正后的模型名
    device="cpu",
    trust_remote_code=True,  # 必须加！新版本FunASR加载自定义模型需要
    vad_model="damo/speech_fsmn_vad_zh-cn-16k-common-pytorch"  # VAD模型保留
)

# 测试合成+播放
text = "你好，这是测试CosyVoice3的流式TTS合成效果"
# 创建流式上下文
stream = model.create_stream()
# 输入文本
stream.put({"text": text})
# 获取合成的语音
audio = stream.get(is_end=True)
# 播放语音（采样率固定16000）
sd.play(audio["wav"], 16000)
sd.wait()

# 释放流
stream.reset()
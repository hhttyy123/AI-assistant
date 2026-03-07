import os
import shutil
import wave
import pyaudio
from funasr import AutoModel

# ===================== 强制修复缓存 & 依赖检查 =====================
def fix_env():
    """修复缓存和依赖缺失问题"""
    # 1. 删除异常缓存
    cache_path = os.path.expanduser("~/.cache/funasr")
    if os.path.exists(cache_path):
        print(f"清理旧模型缓存：{cache_path}")
        shutil.rmtree(cache_path, ignore_errors=True)
    
    # 2. 检查核心依赖
    try:
        import safetensors
        assert safetensors.__version__ >= "0.4.3", "safetensors版本过低"
        import huggingface_hub
        assert huggingface_hub.__version__ >= "0.30.0", "huggingface-hub版本过低"
        print("依赖检查通过 ✅")
    except (ImportError, AssertionError) as e:
        print(f"依赖异常：{e}")
        print("请重新执行：pip install 'safetensors>=0.4.3' 'huggingface-hub>=0.30.0,<1.0' -U")
        exit(1)

# ===================== 音频配置（固定16k单声道） =====================
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1024
RECORD_SECONDS = 5
AUDIO_PATH = "recorded_audio.wav"

# ===================== 加载模型（使用 ModelScope 地址） =====================
def load_model():
    print("正在加载模型（首次下载≈500MB，耐心等待...）")
    try:
        # 使用 ModelScope 的正确模型路径
        model = AutoModel(
            model="damo/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch",
            # 或者使用这个更小的模型：
            # model="damo/speech_paraformer_asr_nostress-zh-cn-16k-common-vocab8404-online",
            trust_remote_code=True,
            cache_dir=os.path.expanduser("~/.cache/modelscope")
        )
        print("模型加载成功 ✅")
        return model
    except Exception as e:
        print(f"模型加载失败：{str(e)}")
        print("尝试使用备用模型...")
        try:
            # 备用小模型
            model = AutoModel(
                model="damo/speech_paraformer_asr_nostress-zh-cn-16k-common-vocab8404-online",
                trust_remote_code=True,
                cache_dir=os.path.expanduser("~/.cache/modelscope")
            )
            print("备用模型加载成功 ✅")
            return model
        except Exception as e2:
            print(f"备用模型也加载失败：{str(e2)}")
            exit(1)

# ===================== 录音+识别核心功能 =====================
def record_audio():
    """录音并保存为16k单声道WAV"""
    audio = pyaudio.PyAudio()
    stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)
    print(f"\n开始录音{RECORD_SECONDS}秒...（请说话）")
    frames = []
    for _ in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        frames.append(stream.read(CHUNK))
    print("录音结束！")
    
    stream.stop_stream()
    stream.close()
    audio.terminate()
    
    # 保存WAV文件
    with wave.open(AUDIO_PATH, 'wb') as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(audio.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b''.join(frames))
    return AUDIO_PATH

def recognize(model, audio_path):
    """识别音频文件"""
    if not os.path.exists(audio_path):
        print(f"文件不存在：{audio_path}")
        return None
    print(f"正在识别音频：{audio_path}")
    result = model.generate(input=audio_path, batch_size=1)
    text = result[0]["text"] if result else "识别失败"
    print(f"识别结果：{text}")
    return text

# ===================== 主程序 =====================
if __name__ == "__main__":
    # 1. 修复环境和缓存
    fix_env()
    # 2. 加载模型
    asr_model = load_model()
    # 3. 功能循环
    while True:
        print("\n===== 语音识别工具 =====")
        print("1. 实时录音识别（5秒）")
        print("2. 识别本地WAV文件（需16k单声道）")
        print("3. 退出")
        choice = input("请选择（1/2/3）：").strip()
        
        if choice == "1":
            audio_file = record_audio()
            recognize(asr_model, audio_file)
        elif choice == "2":
            path = input("请输入WAV文件路径：").strip()
            recognize(asr_model, path)
        elif choice == "3":
            print("程序退出！")
            break
        else:
            print("输入错误，请选1/2/3！")
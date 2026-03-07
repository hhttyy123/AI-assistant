import pvporcupine
import pyaudio
import struct
import sys
import time

# ========================
# 1️⃣ 修改这里
ACCESS_KEY = "CFcsaJbgpN8p/l2dM1FtOqgOU+anAhLt1Ia6hjns8GDxQ5/liwnPeQ=="
PPN_PATH = "./小笨_zh_windows_v4_0_0.ppn"
# ========================

MODEL_PATH = r"C:/Python310/Lib/site-packages/pvporcupine/lib/common/porcupine_params_zh.pv"

def main():
    porcupine = pvporcupine.create(
        access_key=ACCESS_KEY,
        keyword_paths=[PPN_PATH],
        model_path=MODEL_PATH,
        sensitivities=[0.6]  # 0~1，越大越灵敏
    )

    pa = pyaudio.PyAudio()

    stream = pa.open(
        rate=porcupine.sample_rate,      # 16000
        channels=1,
        format=pyaudio.paInt16,
        input=True,
        frames_per_buffer=porcupine.frame_length
    )

    print("🎧 正在监听唤醒词...")
    print("按 Ctrl+C 退出")

    try:
        while True:
            pcm = stream.read(
                porcupine.frame_length,
                exception_on_overflow=False
            )

            pcm = struct.unpack_from(
                "h" * porcupine.frame_length,
                pcm
            )

            result = porcupine.process(pcm)

            if result >= 0:
                print("🔥 唤醒词触发！", time.strftime("%H:%M:%S"))
                # 👉 这里可以接 ASR / CosyVoice
                # on_wake()
                time.sleep(0.8)  # 防止连续触发

    except KeyboardInterrupt:
        print("\n退出")

    finally:
        stream.stop_stream()
        stream.close()
        pa.terminate()
        porcupine.delete()


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
CosyVoice 模型下载脚本
自动从 ModelScope 或 HuggingFace 下载所需的预训练模型
"""

import os
import sys

def download_from_modelscope():
    """使用 ModelScope 下载模型（推荐国内用户）"""
    try:
        from modelscope import snapshot_download
        print("📥 正在从 ModelScope 下载模型...")

        models = {
            'FunAudioLLM/Fun-CosyVoice3-0.5B-2512': 'pretrained_models/Fun-CosyVoice3-0.5B',
            'iic/CosyVoice-300M-SFT': 'pretrained_models/CosyVoice-300M-SFT',
            'iic/CosyVoice-ttsfrd': 'pretrained_models/CosyVoice-ttsfrd',
        }

        for model_id, local_dir in models.items():
            print(f"⏳ 下载 {model_id} 到 {local_dir}...")
            snapshot_download(model_id, local_dir=local_dir)
            print(f"✅ {model_id} 下载完成！")

        print("🎉 所有模型下载完成！")
        return True
    except ImportError:
        print("❌ 未安装 modelscope，请先安装：pip install modelscope")
        return False
    except Exception as e:
        print(f"❌ 下载失败: {e}")
        return False


def download_from_huggingface():
    """使用 HuggingFace 下载模型（推荐海外用户）"""
    try:
        from huggingface_hub import snapshot_download
        print("📥 正在从 HuggingFace 下载模型...")

        models = {
            'FunAudioLLM/Fun-CosyVoice3-0.5B-2512': 'pretrained_models/Fun-CosyVoice3-0.5B',
            'FunAudioLLM/CosyVoice-300M-SFT': 'pretrained_models/CosyVoice-300M-SFT',
            'FunAudioLLM/CosyVoice-ttsfrd': 'pretrained_models/CosyVoice-ttsfrd',
        }

        for model_id, local_dir in models.items():
            print(f"⏳ 下载 {model_id} 到 {local_dir}...")
            snapshot_download(model_id, local_dir=local_dir)
            print(f"✅ {model_id} 下载完成！")

        print("🎉 所有模型下载完成！")
        return True
    except ImportError:
        print("❌ 未安装 huggingface_hub，请先安装：pip install huggingface_hub")
        return False
    except Exception as e:
        print(f"❌ 下载失败: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("CosyVoice 模型下载工具")
    print("=" * 50)

    # 创建模型目录
    os.makedirs("pretrained_models", exist_ok=True)

    # 选择下载源
    if len(sys.argv) > 1 and sys.argv[1] == "hf":
        success = download_from_huggingface()
    else:
        print("\n📍 请选择下载源:")
        print("1. ModelScope (国内推荐)")
        print("2. HuggingFace (海外推荐)")

        choice = input("\n请输入选择 (1/2，默认1): ").strip() or "1"

        if choice == "2":
            success = download_from_huggingface()
        else:
            success = download_from_modelscope()

    if success:
        print("\n✅ 模型准备完成，现在可以运行项目了！")
    else:
        print("\n❌ 模型下载失败，请检查网络连接或手动下载")
        print("📖 手动下载请参考: https://github.com/FunAudioLLM/CosyVoice")

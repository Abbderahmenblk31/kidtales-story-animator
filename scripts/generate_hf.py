import sys
import os
import shutil
import json

if len(sys.argv) < 3:
    print(json.dumps({"success": False, "error": "Missing input or output arguments"}))
    sys.exit(1)

input_image = os.path.abspath(sys.argv[1])
output_video = os.path.abspath(sys.argv[2])
hf_token = sys.argv[3].strip() if len(sys.argv) > 3 and sys.argv[3].strip() else None

print(json.dumps({"stage": "connecting", "progress": 25, "message": "Connecting to Hugging Face ZeroGPU..."}))
sys.stdout.flush()

try:
    from gradio_client import Client, handle_file

    if hf_token:
        client = Client("mediasynthesismuseum/stable-video-diffusion", hf_token=hf_token)
    else:
        client = Client("mediasynthesismuseum/stable-video-diffusion")

    print(json.dumps({"stage": "generating", "progress": 55, "message": "Neural video diffusion in progress on Cloud GPU..."}))
    sys.stdout.flush()

    result = client.predict(
        image=handle_file(input_image),
        seed=42,
        randomize_seed=True,
        motion_bucket_id=127,
        fps_id=6,
        api_name="/video"
    )

    video_path = None
    if isinstance(result, (list, tuple)) and len(result) > 0:
        first = result[0]
        if isinstance(first, dict) and "video" in first:
            video_path = first["video"]
        elif isinstance(first, str):
            video_path = first

    if not video_path or not os.path.exists(video_path):
        raise Exception(f"Video file not found in result: {result}")

    os.makedirs(os.path.dirname(output_video), exist_ok=True)
    shutil.copyfile(video_path, output_video)

    print(json.dumps({"success": True, "output": output_video, "progress": 100}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1)

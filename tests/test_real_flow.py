import urllib.request
import json
import time
import io
import os

print("--- Testing Real Video Processing Engine (FFmpeg) ---")

# 1. Prepare image upload
boundary = "----WebKitFormBoundaryRealEngineTest"
body = io.BytesIO()

sample_image_path = "public/samples/sample-storybook-scene.jpg"
with open(sample_image_path, "rb") as f:
    img_data = f.read()

body.write(f"--{boundary}\r\n".encode())
body.write(b'Content-Disposition: form-data; name="file"; filename="storybook-bunny.jpg"\r\n')
body.write(b"Content-Type: image/jpeg\r\n\r\n")
body.write(img_data)
body.write(b"\r\n")

prompt = "الأرنب اللطيف يقفز بمرح عبر الحديقة الخضراء مع حركة سينمائية"
body.write(f"--{boundary}\r\n".encode())
body.write(b'Content-Disposition: form-data; name="prompt"\r\n\r\n')
body.write(prompt.encode("utf-8"))
body.write(b"\r\n")
body.write(f"--{boundary}--\r\n".encode())

req = urllib.request.Request(
    "http://localhost:3000/api/generate",
    data=body.getvalue(),
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
)

task_id = None
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode("utf-8"))
    assert res["success"] is True
    task_id = res["task"]["id"]
    print(f"Task successfully created! ID: {task_id}")
    print(f"Original uploaded file: {res['task']['originalFileUrl']}")

# 2. Poll until COMPLETED
print("\n--- Polling status every 2 seconds ---")
completed = False
for step in range(12):
    time.sleep(2.0)
    with urllib.request.urlopen(f"http://localhost:3000/api/status/{task_id}") as s_resp:
        data = json.loads(s_resp.read().decode("utf-8"))
        t = data["task"]
        print(f"Step {step+1}: Status={t['status']} | Progress={t['progress']}% | Message: {t.get('statusMessage')}")

        if t["status"] == "COMPLETED":
            completed = True
            result_url = t["resultFileUrl"]
            print(f"\n🎉 Task completed successfully!")
            print(f"Result URL: {result_url}")

            # Verify result URL is the unique animated video for this task
            expected_prefix = f"/uploads/animated-{task_id}.mp4"
            assert result_url == expected_prefix, f"Expected {expected_prefix}, got {result_url}"

            # Verify file exists on disk and has valid size
            local_path = os.path.join("public", result_url.lstrip("/"))
            assert os.path.exists(local_path), f"File {local_path} does not exist on disk!"
            file_size = os.path.getsize(local_path)
            print(f"Disk file verified: {local_path} (Size: {file_size:,} bytes)")
            assert file_size > 10000, f"File size too small: {file_size}"
            break
        elif t["status"] == "FAILED":
            print(f"Task FAILED: {t.get('errorMessage')}")
            break

if not completed:
    print("Test timed out before completion!")
    exit(1)

print("\n✅ ALL TESTS PASSED! Real FFmpeg video engine is working seamlessly!")

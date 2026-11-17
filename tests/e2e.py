import urllib.request
import json
import time
import io

print("--- 1. Testing GET / ---")
try:
    with urllib.request.urlopen("http://localhost:3000") as resp:
        print("Home status:", resp.status)
except Exception as e:
    print("Error fetching home:", e)

print("\n--- 2. Testing POST /api/generate ---")
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = io.BytesIO()

with open("public/samples/sample-storybook-scene.jpg", "rb") as f:
    file_bytes = f.read()

body.write(f"--{boundary}\r\n".encode())
body.write(b'Content-Disposition: form-data; name="file"; filename="test-scene.jpg"\r\n')
body.write(b"Content-Type: image/jpeg\r\n\r\n")
body.write(file_bytes)
body.write(b"\r\n")

prompt = "القطة اللطيفة تقفز بمرح والولد يبتسم بسعادة"
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
try:
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        print("Generate response status:", resp.status)
        print("Task ID:", res_data["task"]["id"])
        print("Initial Status:", res_data["task"]["status"])
        print("Original File:", res_data["task"]["originalFileUrl"])
        task_id = res_data["task"]["id"]
except Exception as e:
    print("Error generating task:", e)

if task_id:
    print(f"\n--- 3. Polling Task {task_id} every 2.7s ---")
    for i in range(6):
        time.sleep(2.7)
        try:
            with urllib.request.urlopen(f"http://localhost:3000/api/status/{task_id}") as s_resp:
                s_data = json.loads(s_resp.read().decode("utf-8"))
                t = s_data["task"]
                print(
                    f"Poll #{i+1}: Status={t['status']}, Progress={t['progress']}%, Message='{t.get('statusMessage')}'"
                )
                if t["status"] == "COMPLETED":
                    print("✅ SUCCESS: Task reached COMPLETED with result:", t.get("resultFileUrl"))
                    break
        except Exception as e:
            print(f"Poll #{i+1} failed:", e)

print("\n--- 4. Testing GET /api/tasks ---")
try:
    with urllib.request.urlopen("http://localhost:3000/api/tasks") as t_resp:
        tasks_data = json.loads(t_resp.read().decode("utf-8"))
        print("Recent tasks retrieved:", len(tasks_data.get("tasks", [])))
        for item in tasks_data.get("tasks", [])[:3]:
            print(f" - [{item['status']}] Task {item['id']}: {item['userPrompt'][:30]}...")
except Exception as e:
    print("Error fetching tasks:", e)

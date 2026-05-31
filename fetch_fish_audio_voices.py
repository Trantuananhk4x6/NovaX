"""Run in WSL2: cd ~/ai-narrator && source venv/bin/activate && python3 /mnt/d/NovaX/fetch_fish_audio_voices.py"""
import urllib.request, json, os

KEY = os.getenv("FISH_AUDIO_API_KEY", "")
HDR = {"Authorization": f"Bearer {KEY}"} if KEY else {}

def get(url):
    req = urllib.request.Request(url, headers=HDR)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

print("=== fish.audio public voices ===\n")
for lang, label in [("vi","Vietnamese"),("en","English"),("zh","Chinese"),("ja","Japanese"),("ko","Korean")]:
    try:
        url = f"https://api.fish.audio/model?language={lang}&visibility=public&sort_by=task_count&page_size=8"
        data = get(url)
        items = data.get("items", data) if isinstance(data, dict) else data
        print(f"--- {label} ({lang}) ---")
        for m in items[:8]:
            mid  = m.get("_id", m.get("id","?"))
            name = m.get("title", m.get("name","?"))
            cnt  = m.get("task_count", "?")
            tags = ",".join(m.get("tags",[])[:2])
            print(f"  {mid}  {name[:30]:30}  tasks={cnt}  [{tags}]")
        print()
    except Exception as e:
        print(f"  Error fetching {lang}: {e}\n")

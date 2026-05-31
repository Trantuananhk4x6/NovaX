import urllib.request, json
IDS = [
    "3f366bc073b449bca5838fb37d26ff62",  # voice truyen nu tre (VI female)
    "835a674392f64d9bb819ad0de17ce388",  # Binh luan vien (VI male)
    "e252335b9b314e919d22d54164397dd7",  # Jessica (VI female)
    "2e324e52a86c4ec69d98bb99e1b61c5b",  # Vietnam (VI male)
]
for mid in IDS:
    try:
        r = urllib.request.urlopen(f"https://api.fish.audio/model/{mid}", timeout=10)
        d = json.loads(r.read())
        print(f"\n=== {mid[:16]}... ===")
        print(f"Title: {d.get('title','?')}")
        print(f"Keys: {list(d.keys())}")
        voices = d.get("voices",[])
        samples = d.get("samples",[])
        print(f"voices count: {len(voices)}")
        if voices:
            print(f"voices[0] keys: {list(voices[0].keys()) if isinstance(voices[0],dict) else type(voices[0])}")
            if isinstance(voices[0], dict):
                print(f"voices[0]: {voices[0]}")
        print(f"samples count: {len(samples)}")
        if samples:
            print(f"samples[0]: {samples[0]}")
    except Exception as e:
        print(f"Error {mid[:16]}: {e}")

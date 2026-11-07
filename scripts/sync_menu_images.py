#!/usr/bin/env python3
"""Mirror public Kape Bar-Rio menu uploads to GitHub Pages repository.

Executed only in GitHub Actions with repository write permission.
No GitHub credential or secret is sent to browsers/Supabase.
"""
import hashlib
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

SUPABASE = "https://wkyyuyyfauyhpivebrdg.supabase.co"
BUCKET_PREFIX = SUPABASE + "/storage/v1/object/public/kbr-menu-images/"
KEY = os.environ["KBR_SUPABASE_PUBLISHABLE_KEY"]
target = Path("images/menu-managed")
target.mkdir(parents=True, exist_ok=True)

payload = Request(
    SUPABASE + "/rest/v1/rpc/kbr_public_menu_image_manifest",
    data=b"{}",
    headers={"apikey": KEY, "Content-Type": "application/json"},
    method="POST",
)
with urlopen(payload, timeout=25) as response:
    assets = json.load(response)

if not isinstance(assets, list) or len(assets) > 500:
    raise ValueError("Unexpected menu image manifest")
manifest = {}
for item in assets:
    product_id = item.get("product_id", "")
    image_url = item.get("image_url", "")
    if not isinstance(product_id, str) or not isinstance(image_url, str):
        continue
    if not image_url.startswith(BUCKET_PREFIX) or len(product_id) != 36:
        continue
    if any(c not in "0123456789abcdefABCDEF-" for c in product_id):
        continue
    fingerprint = hashlib.sha256(image_url.encode("utf-8")).hexdigest()[:16]
    filename = f"{product_id}-{fingerprint}.jpg"
    path = target / filename
    if not path.exists():
        with urlopen(Request(image_url, headers={"User-Agent": "KBR-GitHub-Photo-Sync"}), timeout=45) as response:
            mime = response.headers.get("content-type", "").split(";")[0].lower()
            if mime != "image/jpeg":
                raise ValueError(f"Unexpected image MIME for {product_id}: {mime}")
            body = response.read(2_097_153)
        if not body or len(body) > 2_097_152 or not body.startswith(b"\\xff\\xd8"):
            raise ValueError("Invalid or oversized JPEG upload")
        path.write_bytes(body)
    manifest[product_id] = "./images/menu-managed/" + filename

index = target / "manifest.json"
index.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\\n")
print(f"Mirrored {len(manifest)} shared menu image(s) to GitHub.")

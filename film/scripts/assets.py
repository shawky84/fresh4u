"""Prepare film/public from src-assets/img. Run: python3 scripts/assets.py"""
import os, shutil
import numpy as np
from PIL import Image, ImageFilter

here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, "..", "..", "src-assets", "img")
pub = os.path.join(here, "..", "public")
os.makedirs(pub, exist_ok=True)

for a, b in [("i-030.png", "field-rows.png"), ("i-037.png", "sweet-potato-pile.png")]:
    shutil.copyfile(os.path.join(src, a), os.path.join(pub, b))

logo = Image.open(os.path.join(src, "i-004.png")).convert("RGB")
mask = Image.open(os.path.join(src, "i-005.png")).convert("L")
logo.putalpha(mask)
logo.save(os.path.join(pub, "logo.png"))

rng = np.random.default_rng(4)
n = np.clip(rng.normal(128, 46, (540, 960)), 0, 255).astype("uint8")
Image.fromarray(n).filter(ImageFilter.GaussianBlur(0.45)).save(os.path.join(pub, "grain.png"))

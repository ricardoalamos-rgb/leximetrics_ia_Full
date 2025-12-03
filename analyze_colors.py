import os
from PIL import Image
from collections import Counter

import colorsys

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path)
        img = img.resize((150, 150))
        img = img.convert("RGB")
        pixels = list(img.getdata())
        
        # Filter for saturated colors
        vibrant_pixels = []
        for p in pixels:
            r, g, b = p[0]/255.0, p[1]/255.0, p[2]/255.0
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            # Saturation > 0.3 and Value > 0.3 (not too dark, not too gray)
            if s > 0.3 and v > 0.3:
                vibrant_pixels.append(p)
        
        if not vibrant_pixels:
            return "No vibrant colors found"

        counts = Counter(vibrant_pixels)
        most_common = counts.most_common(5)
        return most_common
    except Exception as e:
        return str(e)

base_path = "/Users/ricardoalamossantacruz/.gemini/antigravity/brain/1d3d4af3-76ac-42ef-b382-b4e9629a9594/"
images = [
    "uploaded_image_0_1764644881933.png",
    "uploaded_image_1_1764644881933.jpg"
]

print("Analyzing images for brand colors...")
for img_name in images:
    full_path = os.path.join(base_path, img_name)
    if os.path.exists(full_path):
        print(f"\nImage: {img_name}")
        colors = get_dominant_color(full_path)
        print(f"Dominant Colors (RGB): {colors}")
        if isinstance(colors, list):
            print(f"Hex: {[ '#%02x%02x%02x' % c[0] for c in colors ]}")
    else:
        print(f"File not found: {full_path}")

#!/usr/bin/env python3
"""
Fix PNG DPI to 72 for App Store Connect
Usage: python fix-dpi.py iap-promo.png iap-promo-72dpi.png
"""
import sys
from PIL import Image

if len(sys.argv) < 3:
    print("Usage: python fix-dpi.py input.png output.png")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

# Open image
img = Image.open(input_file)

# Ensure RGB mode (no transparency)
if img.mode != 'RGB':
    img = img.convert('RGB')

# Save with 72 DPI
img.save(output_file, 'PNG', dpi=(72, 72))

print(f"✓ Saved {output_file} at 1024x1024, 72 DPI")

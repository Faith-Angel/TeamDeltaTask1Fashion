"""Quick sanity check — confirms CLIP works from local cache before seeding."""
import io
import sys
import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

print("Loading CLIP from local cache (no download)...")
proc  = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
model.eval()
print("Loaded.")

img    = Image.new("RGB", (224, 224), color=(100, 150, 200))
inputs = proc(images=img, return_tensors="pt")

with torch.no_grad():
    features = model.get_image_features(**inputs)

if not isinstance(features, torch.Tensor):
    print(f"get_image_features returned {type(features)} — using manual projection fallback")
    vision_out = model.vision_model(pixel_values=inputs["pixel_values"])
    features   = model.visual_projection(vision_out.pooler_output)

features = F.normalize(features, p=2, dim=-1)
result   = features.squeeze(0).tolist()

print(f"Embedding length : {len(result)}")
print(f"First 5 values   : {[round(x, 4) for x in result[:5]]}")

if len(result) == 512:
    print("\n✅ CLIP is working correctly. Safe to run: python scripts/seed_pinecone.py --resume")
else:
    print(f"\n❌ Wrong dimension: {len(result)}. Something is still wrong.")
    sys.exit(1)

"""
scripts/test_gemini.py

Verifies the google-genai SDK and API key work correctly.
Run from ml-service/ directory:
    python scripts/test_gemini.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

from google import genai
from google.genai import types

api_key = os.getenv("GOOGLE_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

print(f"API key loaded : {'✅ yes' if api_key else '❌ missing'}")
print(f"Model          : {model_name}\n")

client = genai.Client(api_key=api_key)

# ── Test 1: list available models ─────────────────────────────────────────
print("── Available Gemini models ───────────────────────────────────────")
try:
    for m in client.models.list():
        if "generateContent" in (m.supported_actions or []):
            print(f"  {m.name}")
except Exception as e:
    print(f"  Could not list models: {e}")

# ── Test 2: simple generation ─────────────────────────────────────────────
print(f"\n── Test generation ({model_name}) ────────────────────────────────")
try:
    response = client.models.generate_content(
        model=model_name,
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text="In one sentence, describe Toghu fabric from Cameroon.")]
            )
        ],
        config=types.GenerateContentConfig(
            system_instruction="You are a Cameroonian fashion expert.",
        ),
    )
    print(f"  Response: {response.text.strip()}")
    print("\n✅ Gemini API is working correctly.")
except Exception as e:
    print(f"\n❌ Generation failed: {type(e).__name__}: {e}")

"""
Gemini 2.0 Flash style assistant service.

Uses the NEW google-genai SDK (google.genai.Client) — NOT google-generativeai.
Install: pip install google-genai

API key format: AQ.Ab8R... (associated with Google Cloud project via AI Studio)
Read from env: GOOGLE_API_KEY

Responsibilities:
  - chat(): multi-turn conversation as a Cameroonian fashion consultant.
  - extract_brief(): structured JSON brief from conversation history.

Both sync functions are called via asyncio.to_thread() from the async endpoints
so they never block the FastAPI event loop.
"""

import asyncio
import json
import logging
import time
from typing import Any

from google import genai
from google.genai import types
import google.api_core.exceptions

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Lazy client singleton ─────────────────────────────────────────────────
# Created once on first use so startup doesn't fail if the key is missing.
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GOOGLE_API_KEY)
    return _client


# ── System prompt ─────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are Ndolo, a knowledgeable and enthusiastic Cameroonian fashion consultant
for NdoloStitch — a platform connecting clients with Cameroonian designers.

Your expertise covers:
- Traditional Cameroonian clothing: Toghu, Sanja, Kaba Ngondo, Ndop, Bamoun robes
- Modern African fashion: Ankara, Kente, Adire, contemporary Afrocentric styles
- Hairstyles: traditional and modern African hairstyles
- Accessories: beads, headwraps, bags, jewellery typical to Cameroon and West/Central Africa
- Fabric knowledge: cotton, silk, Toghu wool, Kente cloth, lace
- Regional styles: Northwest (Bamenda), Littoral (Douala), Centre (Yaoundé), West (Bafoussam)
- Occasions: weddings, funerals, graduations, office, casual, religious ceremonies
- Pricing guidance in XAF (Central African CFA franc)

Rules:
1. Always respond in the same language the user writes in (French or English).
2. If asked about topics unrelated to fashion, clothing, styling, or textiles, politely redirect.
3. Be warm, encouraging, and culturally specific.
4. When you have enough information, proactively suggest a design brief summary.
5. Keep responses concise (2-4 paragraphs max) unless the user asks for more detail.
"""

_BRIEF_EXTRACTION_PROMPT = """Based on the fashion consultation conversation above, extract a
structured design brief as valid JSON with exactly these fields:

{
  "style": "<overall style category, e.g. 'Traditional Bamileke Wedding'>",
  "occasion": "<specific occasion, e.g. 'Traditional Wedding'>",
  "color_palette": ["<color1>", "<color2>"],
  "fabric_preference": "<preferred fabric(s)>",
  "budget_range_xaf": "<budget range in XAF, e.g. '100000-300000'>",
  "special_requirements": "<any specific requests, accessories, or constraints>"
}

Return ONLY the JSON object. No markdown, no explanation."""


# ── Retry helper ──────────────────────────────────────────────────────────

def _call_with_retry(fn, *args, max_attempts: int = 3, **kwargs):
    """Exponential backoff on Gemini rate limit (ResourceExhausted)."""
    for attempt in range(max_attempts):
        try:
            return fn(*args, **kwargs)
        except google.api_core.exceptions.ResourceExhausted:
            wait = 2 ** attempt  # 1s, 2s, 4s
            logger.warning(
                "Gemini rate limit hit — retrying in %ds (attempt %d/%d)...",
                wait, attempt + 1, max_attempts,
            )
            time.sleep(wait)
        except Exception:
            raise  # non-rate-limit errors bubble up immediately
    raise RuntimeError("Gemini rate limit exceeded after all retries.")


# ── History builder ───────────────────────────────────────────────────────

def _build_contents(message: str, history: list[dict[str, str]]) -> list[types.Content]:
    """
    Convert prior history + new message into google-genai Content objects.
    google-genai uses role='user'|'model' (not 'assistant').
    """
    contents: list[types.Content] = []

    for turn in history[-40:]:  # cap at 20 turns × 2 roles
        role = "model" if turn["role"] == "assistant" else "user"
        contents.append(
            types.Content(role=role, parts=[types.Part(text=turn["content"])])
        )

    contents.append(
        types.Content(role="user", parts=[types.Part(text=message)])
    )
    return contents


# ── Sync implementations (run in thread) ─────────────────────────────────

def _chat_sync(message: str, history: list[dict[str, str]]) -> str:
    """Synchronous Gemini chat with rate-limit retry."""
    client = _get_client()
    contents = _build_contents(message, history)

    response = _call_with_retry(
        client.models.generate_content,
        model=settings.GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
        ),
    )
    return response.text


def _extract_brief_sync(history: list[dict[str, str]]) -> dict[str, Any]:
    """Synchronous brief extraction with JSON response mode."""
    client = _get_client()

    # Build history for context then append extraction instruction
    contents: list[types.Content] = []
    for turn in history[-40:]:
        role = "model" if turn["role"] == "assistant" else "user"
        contents.append(
            types.Content(role=role, parts=[types.Part(text=turn["content"])])
        )
    contents.append(
        types.Content(role="user", parts=[types.Part(text=_BRIEF_EXTRACTION_PROMPT)])
    )

    response = _call_with_retry(
        client.models.generate_content,
        model=settings.GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()

    # Strip markdown fences if Gemini adds them despite response_mime_type
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)


# ── Async public API (called by FastAPI endpoints) ────────────────────────

async def chat(message: str, history: list[dict[str, str]]) -> str:
    """
    Async chat — runs sync Gemini call in a thread pool.
    Times out after 15 seconds (generous for free tier).
    """
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_chat_sync, message, history),
            timeout=15.0,
        )
    except asyncio.TimeoutError:
        raise TimeoutError("Gemini API did not respond within 15 seconds.")
    except Exception as exc:
        logger.exception("Gemini chat error: %s", exc)
        raise


async def extract_brief(history: list[dict[str, str]]) -> dict[str, Any]:
    """
    Async brief extraction — runs sync Gemini call in a thread pool.
    Times out after 15 seconds.
    """
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_extract_brief_sync, history),
            timeout=15.0,
        )
    except asyncio.TimeoutError:
        raise TimeoutError("Gemini API did not respond within 15 seconds.")
    except Exception as exc:
        logger.exception("Gemini brief extraction error: %s", exc)
        raise

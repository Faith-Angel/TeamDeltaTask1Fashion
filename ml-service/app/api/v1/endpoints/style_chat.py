# app/api/v1/endpoints/style_chat.py
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status

from app.models.requests import StyleChatRequest
from app.models.responses import DesignBrief, StyleChatResponse
from app.gemini_client import get_style_advice, extract_brief, ACTIVE_MODEL

logger = logging.getLogger(__name__)

router = APIRouter()
_BRIEF_TRIGGER = "generate brief"


@router.post(
    "/style-chat",
    response_model=StyleChatResponse,
    summary="Chat with the Cameroonian fashion style assistant (Gemini Flash)",
)
async def style_chat(body: StyleChatRequest) -> StyleChatResponse:
    """
    Send a message to the NdoloStitch style assistant.
    Optionally extract a structured design brief from the conversation.
    """
    # ── Extract history from request ──────────────────────────────────
    history_dicts = []
    if body.history:
        history_dicts = [msg.model_dump() if hasattr(msg, 'model_dump') else msg for msg in body.history]
    
    # ── Generate reply ────────────────────────────────────────────────
    try:
        reply = get_style_advice(body.message, history_dicts)
        
        if reply.startswith("Error:"):
            logger.warning(f"Gemini returned error: {reply[:100]}")
            
    except TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The style assistant is taking too long to respond. Please try again in a moment."
        )
    except Exception as exc:
        logger.exception("Style chat failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Style assistant is temporarily unavailable."
        )

    # ── Extract brief if requested ────────────────────────────────────
    brief: Optional[DesignBrief] = None
    should_extract = body.extract_brief or _BRIEF_TRIGGER in body.message.lower()
    
    if should_extract and not reply.startswith("Error:"):
        try:
            brief_data = extract_brief(reply)
            
            if brief_data and "error" not in brief_data:
                # Clean up the data before passing to DesignBrief
                cleaned_data = clean_brief_data(brief_data)
                brief = DesignBrief(**cleaned_data)
                logger.info(f"Brief extracted for {body.conversation_id}")
            else:
                logger.warning(f"Brief extraction returned: {brief_data.get('error', 'Unknown')}")
                
        except Exception as exc:
            logger.warning(f"Brief extraction failed: {exc}")
            # Non-fatal: return reply without brief

    return StyleChatResponse(
        reply=reply,
        conversation_id=body.conversation_id,
        brief=brief,
    )


def clean_brief_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Clean and normalize brief data from Gemini.
    Converts lists to comma-separated strings for fields that expect strings.
    """
    cleaned = {}
    
    # Handle list fields -> convert to comma-separated strings
    list_fields = ["style", "colors", "fabrics", "accessories", "color_palette"]
    
    for key, value in data.items():
        if key in list_fields and isinstance(value, list):
            cleaned[key] = ", ".join(value)
        else:
            cleaned[key] = value
    
    return cleaned
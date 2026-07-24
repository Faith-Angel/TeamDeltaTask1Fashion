# app/gemini_client.py - Updated with robust brief extraction
import os
import time
import json
import re
from dotenv import load_dotenv

# Load .env
load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY not found in .env file!")

print(f"🔑 API Key loaded: ✅ Yes (starts with {API_KEY[:4]})")

# Try to import the new SDK first
try:
    from google import genai
    client = genai.Client(api_key=API_KEY)
    SDK_VERSION = "google-genai (new)"
    print(f"✅ Using {SDK_VERSION}")
    
except ImportError:
    # Fallback to old SDK
    import google.generativeai as genai_old
    genai_old.configure(api_key=API_KEY)
    SDK_VERSION = "google-generativeai (deprecated)"
    print(f"⚠️ Using {SDK_VERSION}")
    client = None

# Model configuration - gemini-flash-latest works for you!
MODEL_OPTIONS = [
    "gemini-flash-latest",      # ✅ This one works for you!
    "gemini-2.5-flash",         
    "gemini-2.5-flash-lite",    
    "gemini-2.0-flash",         
    "gemini-pro-latest",        
]

def get_working_model():
    """Try each model option until one works"""
    for model_name in MODEL_OPTIONS:
        try:
            if SDK_VERSION == "google-genai (new)":
                # New SDK test
                response = client.models.generate_content(
                    model=model_name,
                    contents="Say 'test'"
                )
                print(f"✅ Model works: {model_name}")
                return model_name
            else:
                # Old SDK test
                model = genai_old.GenerativeModel(model_name)
                response = model.generate_content("Test connection")
                print(f"✅ Model works: {model_name}")
                return model_name
        except Exception as e:
            if "quota" in str(e).lower() or "429" in str(e):
                print(f"⚠️ Model {model_name} - Quota exhausted, trying next...")
            elif "not found" in str(e).lower() or "404" in str(e):
                print(f"⚠️ Model {model_name} - Not available, trying next...")
            else:
                print(f"⚠️ Model {model_name} - Error: {str(e)[:80]}...")
            continue
    
    print("❌ No working model found. Using default: gemini-flash-latest")
    return "gemini-flash-latest"

ACTIVE_MODEL = get_working_model()
print(f"📌 Using model: {ACTIVE_MODEL}")

SYSTEM_PROMPT = """You are a Cameroonian fashion consultant. 
Help users discover or design traditional (Toghu, Kaba Ngondo, Sanja) and modern outfits. 
Be warm and specific. If the user describes a design, mention colors, fabrics, and accessories."""

def get_style_advice(user_message: str, history: list = None) -> str:
    """Get fashion advice from Gemini with retry logic"""
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            if SDK_VERSION == "google-genai (new)":
                # NEW SDK: Use models.generate_content with proper format
                # Build the full prompt with system context
                full_prompt = f"{SYSTEM_PROMPT}\n\nUser question: {user_message}"
                
                # Add history if provided
                if history:
                    # Convert history to a single string
                    history_text = "\n".join([f"{h['role']}: {h['content']}" for h in history])
                    full_prompt = f"{history_text}\n\n{full_prompt}"
                
                response = client.models.generate_content(
                    model=ACTIVE_MODEL,
                    contents=full_prompt,
                )
                return response.text
                
            else:
                # Old SDK format
                model = genai_old.GenerativeModel(ACTIVE_MODEL)
                chat = model.start_chat(history=history or [])
                full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {user_message}"
                response = chat.send_message(full_prompt)
                return response.text
                
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                wait_time = retry_delay * (attempt + 1)
                print(f"⚠️ Quota limit hit, retrying in {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
            elif attempt == max_retries - 1:
                return f"Error: {error_str}"
            else:
                time.sleep(1)
    
    return "I'm currently overloaded. Please try again in a moment."


def clean_gemini_response(text: str) -> str:
    """Clean Gemini response for JSON parsing."""
    if not text:
        return ""
    
    # Remove markdown code blocks
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    
    # Remove "Here is the JSON:" type prefixes
    text = re.sub(r'^[^{]*', '', text)
    text = re.sub(r'[^}]*$', '', text)
    
    return text.strip()


def normalize_brief_fields(data: dict) -> dict:
    """Normalize field names to match DesignBrief expectations."""
    normalized = {}
    
    # Direct mappings from Gemini's field names to our field names
    field_mappings = {
        "occasion": "occasion",
        "style": "style",
        "colors": "colors",
        "color_palette": "colors",  # Map alternative name
        "fabrics": "fabrics",
        "fabric_preference": "fabrics",  # Map alternative name
        "accessories": "accessories",
        "budget": "budget",
        "budget_range_xaf": "budget",  # Map alternative name
        "special_requirements": "special_requirements",
    }
    
    for key, value in data.items():
        if key in field_mappings:
            normalized[field_mappings[key]] = value
        else:
            # Keep unknown fields
            normalized[key] = value
    
    return normalized


def extract_brief_fallback(text: str) -> dict:
    """Fallback: extract what we can using regex."""
    fields = {
        "occasion": None,
        "style": None,
        "colors": None,
        "fabrics": None,
        "accessories": None,
        "budget": None,
    }
    
    patterns = {
        "occasion": r"(?:occasion|for a|for your)[:\s]+([^\n,.]+)",
        "style": r"(?:style|silhouette|cut)[:\s]+([^\n,.]+)",
        "colors": r"(?:colors?|colours?|palette)[:\s]+([^\n,.]+)",
        "fabrics": r"(?:fabrics?|material|fabric preference)[:\s]+([^\n,.]+)",
        "accessories": r"(?:accessories?)[:\s]+([^\n,.]+)",
        "budget": r"(?:budget|price)[:\s]+([^\n,.]+)",
    }
    
    for field, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fields[field] = match.group(1).strip()
    
    return fields if any(fields.values()) else {"error": "Fallback extraction failed"}


def extract_brief(text: str) -> dict:
    """Extract structured fashion brief from Gemini's reply with robust parsing."""
    if text.startswith("Error:"):
        return {"error": "Skipping brief extraction due to error"}
    
    # Clean the text first - remove markdown and extra whitespace
    cleaned_text = clean_gemini_response(text)
    
    prompt = f"""From this fashion advice, extract a structured brief with ONLY these fields: 
    occasion, style, colors, fabrics, accessories, budget. 
    Output ONLY valid JSON. No extra text. No markdown formatting.
    
    Advice: {cleaned_text[:3000]}"""  # Truncate to avoid token limits
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            if SDK_VERSION == "google-genai (new)" and client is not None:
                response = client.models.generate_content(
                    model=ACTIVE_MODEL,
                    contents=prompt,
                )
                content = response.text
            else:
                model = genai_old.GenerativeModel(ACTIVE_MODEL)
                response = model.generate_content(prompt)
                content = response.text
            
            # Clean and parse JSON
            content = clean_gemini_response(content)
            
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = json.loads(content)
            
            # Ensure we have a dict with the expected fields
            if not isinstance(result, dict):
                return {"error": "Response is not a dictionary"}
            
            # Normalize field names - convert any alternative names to standard ones
            normalized = normalize_brief_fields(result)
            
            # If we have at least some fields, return them
            if any(normalized.values()):
                return normalized
            else:
                return {"error": "No valid fields extracted"}
            
        except json.JSONDecodeError as e:
            if attempt == max_retries - 1:
                # Try to extract using regex fallback
                fallback_result = extract_brief_fallback(cleaned_text)
                if fallback_result and "error" not in fallback_result:
                    return fallback_result
                return {"error": f"JSON parsing failed: {str(e)}"}
            time.sleep(1)
        except Exception as e:
            if attempt == max_retries - 1:
                return {"error": f"Brief extraction failed: {str(e)}"}
            time.sleep(1)
    
    return {"error": "Brief extraction failed"}


# Export for testing
if __name__ == "__main__":
    print("\n🧪 Testing NdoloStitch Gemini client...")
    print(f"📌 Using model: {ACTIVE_MODEL}")
    print(f"📌 SDK: {SDK_VERSION}")
    
    test_message = "Hello! I need a traditional Toghu dress for my wedding ceremony."
    print(f"\n📝 Test message: {test_message}")
    
    result = get_style_advice(test_message)
    print(f"\n🤖 Response: {result[:200]}...")
    
    if not result.startswith("Error:"):
        print("\n📊 Extracting brief...")
        brief = extract_brief(result)
        print(f"\n📋 Brief: {brief}")
    else:
        print("\n⚠️ Skipping brief extraction due to error.")
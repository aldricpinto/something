from __future__ import annotations

import os
from typing import Dict, Optional

try:
    import google.generativeai as genai  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    genai = None  # type: ignore


SYSTEM_PROMPT = (
    "You are an empathetic Christian spiritual guide. Provide comfort, encouragement, "
    "and Scripture rooted in the Bible. Always include a verse reference and summarize its meaning."
)


def _get_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or genai is None:
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel("gemini-2.5-flash")
    except Exception:
        return None


def generate_ai_reflection(verse_text: str, reference: Optional[str] = None) -> Dict[str, str]:
    model = _get_model()
    prompt = (
        f"System Prompt: {SYSTEM_PROMPT}\n\n"
        f"User Input: Provide a brief reflection and one-sentence encouragement for this Bible verse.\n"
        f"Verse: {reference or ''} - {verse_text}"
    )
    if model is None:
        # Fallback simple heuristic
        enc = "Take heart—God is with you and will guide you today."
        refl = (
            "This verse reminds us of God's faithful presence and the peace He offers to those who trust Him."
        )
        return {"reflection": refl, "encouragement": enc}

    try:
        response = model.generate_content(prompt)
        text = response.text.strip() if hasattr(response, "text") else ""
        # Very simple parsing: try to split into two parts
        if "Encouragement:" in text:
            parts = text.split("Encouragement:")
            reflection = parts[0].strip().replace("Reflection:", "").strip()
            encouragement = parts[1].strip()
        else:
            # If no clear structure, just use the first sentence as reflection, rest as encouragement
            sentences = text.split(".")
            reflection = (sentences[0] + ".").strip() if sentences and sentences[0] else text
            encouragement = " ".join(sentences[1:]).strip() or (
                "Take heart—God is with you and will guide you today."
            )
        return {"reflection": reflection, "encouragement": encouragement}
    except Exception:
        enc = "Take heart—God is with you and will guide you today."
        refl = (
            "This verse reminds us of God's faithful presence and the peace He offers to those who trust Him."
        )
        return {"reflection": refl, "encouragement": enc}


def generate_encouragement(mood: str, text: Optional[str] = None) -> Dict[str, str]:
    model = _get_model()
    user_input = text or f"I'm feeling {mood}."
    prompt = (
        f"System Prompt:\n{SYSTEM_PROMPT}\n\n"
        f"User Input:\n{user_input}\n\n"
        "Output Format (JSON):\n"
        "{\n\"verse\": \"(Book Chapter:Verse)\",\n\"message\": \"(summary)\",\n\"encouragement\": \"(motivation)\"\n}"
    )

    if model is None:
        # Simple rule-based fallback
        presets = {
            "anxious": {
                "verse": "Philippians 4:6-7",
                "message": "Paul reminds us not to worry but to pray with thanksgiving.",
                "encouragement": "You are not alone; God's peace will guard your heart and mind.",
            },
            "tired": {
                "verse": "Matthew 11:28",
                "message": "Jesus invites the weary to find rest in Him.",
                "encouragement": "Lay your burdens on Him—He gives true rest.",
            },
            "hopeful": {
                "verse": "Jeremiah 29:11",
                "message": "God has plans to give you a future and a hope.",
                "encouragement": "Trust that His plans are unfolding for your good.",
            },
            "grateful": {
                "verse": "1 Thessalonians 5:18",
                "message": "Give thanks in all circumstances; this is God's will for you.",
                "encouragement": "Keep praising—gratitude opens your heart to God's joy.",
            },
        }
        return presets.get(mood.lower(), presets["hopeful"])  # default

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip() if hasattr(response, "text") else ""
        # Try parse JSON inside the text
        import json
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1:
            payload = json.loads(raw[start : end + 1])
            return {
                "verse": str(payload.get("verse", "")),
                "message": str(payload.get("message", "")),
                "encouragement": str(payload.get("encouragement", "")),
            }
        # Fallback simplistic split
        return {
            "verse": "Psalm 23:1",
            "message": "The Lord is our Shepherd who cares for us.",
            "encouragement": raw or "God is guiding you gently today.",
        }
    except Exception:
        return {
            "verse": "Isaiah 41:10",
            "message": "God strengthens and upholds those who fear not.",
            "encouragement": "Do not be afraid—He is with you and will help you.",
        }

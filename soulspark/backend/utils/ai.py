from __future__ import annotations

import os
import re
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
        print('No keyyyyyy')
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel("gemini-2.5-flash")
    except Exception:
        return None


# Basic cleanup to remove markdown/labels from AI output
_MARKDOWN_PATTERNS = [
    (re.compile(r"\*\*+"), ""),  # bold markers
    (re.compile(r"__+"), ""),     # underline markers
    (re.compile(r"`+"), ""),      # backticks
    (re.compile(r"^#+\s*", re.MULTILINE), ""),  # headings
    (re.compile(r"\bOne[- ]Sentence:?\b", re.IGNORECASE), ""),
    (re.compile(r"\bReflection:?\b", re.IGNORECASE), ""),
    (re.compile(r"\bEncouragement:?\b", re.IGNORECASE), ""),
]


def _sanitize_text(text: str) -> str:
    if not text:
        return ""
    s = text.strip()
    for pattern, repl in _MARKDOWN_PATTERNS:
        s = pattern.sub(repl, s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _sanitize_keep_newlines_and_labels(text: str) -> str:
    """Remove markdown markers but preserve newlines and keep labels.

    Used for answers that rely on a strict line format (e.g., entry Q&A).
    """
    if not text:
        return ""
    s = text
    # Strip formatting markers but keep labels and newlines intact
    s = re.sub(r"\*\*+", "", s)
    s = re.sub(r"__+", "", s)
    s = re.sub(r"`+", "", s)
    s = re.sub(r"^#+\s*", "", s, flags=re.MULTILINE)
    # Normalize Windows line endings
    s = s.replace("\r\n", "\n")
    # Trim spaces around lines but preserve newlines
    s = "\n".join(part.strip() for part in s.split("\n"))
    return s.strip()


def generate_ai_reflection(verse_text: str, reference: Optional[str] = None) -> Dict[str, str]:
    model = _get_model()
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        "Task: Given the verse below, write a concise reflection and a one-sentence encouragement.\n"
        "- Do NOT use markdown, asterisks, headings, or labels.\n"
        "- Output JSON only with keys: reflection, encouragement.\n"
        f"Verse: {reference or ''} - {verse_text}\n\n"
        "Example JSON: {\"reflection\": \"Short insight...\", \"encouragement\": \"One kind sentence.\"}"
    )
    if model is None:
        enc = "Take heart—God is with you and will guide you today."
        refl = (
            "This verse reminds us of God's faithful presence and the peace He offers to those who trust Him."
        )
        return {"reflection": _sanitize_text(refl), "encouragement": _sanitize_text(enc)}

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip() if hasattr(response, "text") else ""
        import json
        reflection = ""
        encouragement = ""
        try:
            start = raw.find("{")
            end = raw.rfind("}")
            payload = json.loads(raw[start : end + 1]) if start != -1 and end != -1 else json.loads(raw)
            reflection = str(payload.get("reflection", ""))
            encouragement = str(payload.get("encouragement", ""))
        except Exception:
            # Fallback: split by lines
            lines = [l for l in re.split(r"[\n\r]+", raw) if l.strip()]
            if lines:
                reflection = lines[0]
                encouragement = " ".join(lines[1:])
        reflection = _sanitize_text(reflection)
        encouragement = _sanitize_text(encouragement)
        if not encouragement:
            encouragement = "Take heart—God is with you today."
        return {"reflection": reflection, "encouragement": encouragement}
    except Exception:
        enc = "Take heart—God is with you and will guide you today."
        refl = (
            "This verse reminds us of God's faithful presence and the peace He offers to those who trust Him."
        )
        return {"reflection": _sanitize_text(refl), "encouragement": _sanitize_text(enc)}


def generate_encouragement(mood: str, text: Optional[str] = None) -> Dict[str, str]:
    model = _get_model()
    mood_text = (mood or "").strip()
    user_text = (text or "").strip()
    context = {"mood": mood_text or None, "text": user_text or None}
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        "Task: Create a short, practical encouragement tailored to the user's state.\n"
        "Rules:\n"
        "- If both mood and text are provided, use both.\n"
        "- If only text is provided, base the response on the text.\n"
        "- If only mood is provided, base the response on the mood.\n"
        "- Always include one fitting Bible verse reference and a one-sentence summary of it.\n"
        "- In the JSON 'verse' field, include BOTH the reference and the full verse text, formatted as: 'Book Chapter:Verse — <full verse text>'.\n"
        "- Prefer a common translation (e.g., NIV/ESV) and keep it concise (<= 1–2 sentences).\n"
        "- Do NOT use markdown, asterisks, headings, or labels.\n"
        "Output strictly as JSON with keys: verse, message, encouragement.\n\n"
        f"Context JSON: {context}\n\n"
        "Example JSON: {\"verse\": \"Psalm 23:1 — The Lord is my shepherd; I shall not want.\", \"message\": \"God shepherds and provides.\", \"encouragement\": \"Let Him guide your steps today.\"}"
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
        # print('heyyyyyyyyyyyyyyyyyyyyyyyyyy')

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip() if hasattr(response, "text") else ""
        # Try parse JSON in output (allow extra text around)
        import json
        start = raw.find("{")
        end = raw.rfind("}")
        payload = json.loads(raw[start : end + 1]) if start != -1 and end != -1 else json.loads(raw)
        verse = _sanitize_text(str(payload.get("verse", "")))
        message = _sanitize_text(str(payload.get("message", "")))
        encouragement = _sanitize_text(str(payload.get("encouragement", "")))
        return {"verse": verse, "message": message, "encouragement": encouragement}
    except Exception:
        
        return {
            "verse": "Isaiah 41:10",
            "message": "God strengthens and upholds those who fear not.",
            "encouragement": _sanitize_text("Do not be afraid—He is with you and will help you."),
        }


def generate_journal_answer(question: str, entries_text: str) -> str:
    model = _get_model()
    base_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        "Task: Answer the user's question grounded in the Bible and the user's journal excerpts.\n"
        "- Prioritize empathy, clarity, and Scriptural faithfulness.\n"
        "- Include at least one Bible reference with a concise paraphrase.\n"
        "- Do NOT use markdown or special formatting; return clean plain text.\n"
    )
    prompt = base_prompt + f"\nJournal excerpts (may be partial):\n{entries_text}\n\nQuestion: {question}"

    if model is None:
        return _sanitize_text("God cares for what you shared. Consider Philippians 4:6-7—bring your concerns to Him in prayer, trusting His peace to guard your heart and mind.")

    try:
        resp = model.generate_content(prompt)
        raw = resp.text.strip() if hasattr(resp, "text") else ""
        return _sanitize_text(raw)
    except Exception:
        return _sanitize_text("Seek the Lord in prayer and Scripture today; Psalm 34:17-18 reminds us that He is near to the brokenhearted and saves those crushed in spirit.")


def generate_entry_answer(question: str, entry_text: str) -> str:
    """Answer a question based on a single journal entry.

    Output format (exactly three lines):
    Book Chapter:Verse — <full Bible text>
    Reflection: <reflection text>
    Encouragement: <encouragement text>
    """
    model = _get_model()
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        "Task: Using the user's single journal entry as context, answer their question strictly in this 3-line format:\n"
        "1) Book Chapter:Verse — <full Bible text>\n"
        "2) Reflection: <your brief reflection (1–3 sentences)>\n"
        "3) Encouragement: <one sentence of encouragement>\n"
        "- Do NOT use markdown or extra labels.\n"
        "- Choose a fitting verse and include the full verse text on line 1.\n\n"
        f"Journal Entry:\n{entry_text}\n\nQuestion: {question}"
    )
    if model is None:
        return _sanitize_text(
            "John 14:27 — Peace I leave with you; my peace I give you.\n"
            "Reflection: God offers real peace even amid anxious thoughts; bring them to Him.\n"
            "Encouragement: Take courage—Christ’s peace can steady your heart today."
        )
    try:
        resp = model.generate_content(prompt)
        raw = resp.text.strip() if hasattr(resp, "text") else ""
        return _sanitize_keep_newlines_and_labels(raw)
    except Exception:
        return _sanitize_keep_newlines_and_labels(
            "Philippians 4:6–7 — Do not be anxious about anything… and the peace of God… will guard your hearts.\n"
            "Reflection: God invites you to pray honestly and receive His guarding peace.\n"
            "Encouragement: Hand today’s burden to Him—He is near and faithful."
        )


def generate_mass_reflection(readings_text: str) -> Dict[str, str]:
    model = _get_model()
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        "Task: Based on today's Catholic Mass readings, write a concise reflection (3–5 sentences) and a one-sentence encouragement.\n"
        "- Return JSON with keys: reflection, encouragement.\n"
        "- Do NOT use markdown or labels.\n\n"
        f"Readings Summary:\n{readings_text}\n\n"
        "Example JSON: {\"reflection\": \"Short synthesis...\", \"encouragement\": \"One supportive sentence.\"}"
    )
    if model is None:
        return {
            "reflection": _sanitize_text("Today's readings invite deeper trust in God's providence and practical charity toward others."),
            "encouragement": _sanitize_text("Take one concrete step of love today—He walks with you."),
        }
    try:
        resp = model.generate_content(prompt)
        raw = resp.text.strip() if hasattr(resp, "text") else ""
        import json
        start = raw.find("{")
        end = raw.rfind("}")
        payload = json.loads(raw[start : end + 1]) if start != -1 and end != -1 else json.loads(raw)
        return {
            "reflection": _sanitize_text(str(payload.get("reflection", ""))),
            "encouragement": _sanitize_text(str(payload.get("encouragement", ""))),
        }
    except Exception:
        return {
            "reflection": _sanitize_text("Let today's readings shape your heart and decisions in Christ."),
            "encouragement": _sanitize_text("Trust God's nearness and take the next faithful step."),
        }


def generate_mass_answer(question: str, readings_text: str) -> str:
    model = _get_model()
    base = (
        f"{SYSTEM_PROMPT}\n\n"
        "Task: Answer the user's question based only on today's Mass readings.\n"
        "- Be pastoral, brief, and faithful to Scripture.\n"
        "- Include at least one reference with a short paraphrase.\n"
        "- Plain text only (no markdown).\n"
    )
    prompt = base + f"\nReadings:\n{readings_text}\n\nQuestion: {question}"
    if model is None:
        return _sanitize_text("Consider how today's readings encourage trust and charity—see John 14:27 for Christ's peace.")
    try:
        resp = model.generate_content(prompt)
        raw = resp.text.strip() if hasattr(resp, "text") else ""
        return _sanitize_text(raw)
    except Exception:
        return _sanitize_text("Let God’s Word guide you with peace today.")

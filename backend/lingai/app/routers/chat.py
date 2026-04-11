import re

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, ChatMessage
from app.schemas.schemas import ChatMessageIn, ChatMessageOut

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

SYSTEM_PROMPT = """You are LingAI Coach, a practical English tutor.
Always follow the user's latest instruction.
Core behaviors:
1. If user asks to write (paragraph/email/essay), write directly in requested language and length.
2. If user asks to translate, return only the translation unless user asks for explanation.
3. If user asks to correct grammar, provide corrections + short explanation.
4. If user asks general questions, answer clearly and concisely.
Tone: friendly, specific, and encouraging.
"""


def _history_messages(db: Session, user_id: int, limit: int = 12) -> list[dict[str, str]]:
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )
    rows.reverse()

    formatted = []
    for row in rows:
        role = "assistant" if row.role == "assistant" else "user"
        formatted.append({"role": role, "content": row.content})
    return formatted


def _call_llm(user_text: str, system_prompt: str, history: list[dict[str, str]]) -> str | None:
    if not settings.LLM_API_KEY:
        return None

    endpoint = settings.LLM_BASE_URL.rstrip("/") + "/chat/completions"
    messages = [{"role": "system", "content": system_prompt}, *history, {"role": "user", "content": user_text}]

    payload = {
        "model": settings.LLM_MODEL,
        "messages": messages,
        "temperature": 0.4,
    }
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            response = client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        choice = (data.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        content = message.get("content")

        if isinstance(content, str):
            text = content.strip()
            return text or None

        if isinstance(content, list):
            parts = [part.get("text", "") for part in content if isinstance(part, dict)]
            text = "".join(parts).strip()
            return text or None
    except Exception:
        return None

    return None


def _coach_reply(text: str) -> str:
    raw = (text or "").strip()
    if not raw:
        return "Please send a sentence in English and I will help you improve it."

    lower = raw.lower()

    # Basic intent routing for no-LLM fallback mode.
    if ("write" in lower and "paragraph" in lower) or ("viết" in lower and "đoạn" in lower):
        topic_match = re.search(r"(?:about|on|về)\s+(.+)$", raw, flags=re.IGNORECASE)
        topic = topic_match.group(1).strip(" .") if topic_match else "daily life"
        return (
            f"Here is a paragraph in English about {topic}:\n\n"
            f"{topic[:1].upper() + topic[1:] if topic else 'Daily life'} is an important part of our learning journey. "
            "When we spend time exploring this topic, we improve not only our vocabulary but also our ability to think clearly in English. "
            "In my opinion, the best way to learn is to combine reading, listening, and real communication. "
            "Although making mistakes can feel uncomfortable, each mistake helps us grow faster and become more confident. "
            "With regular practice and a positive mindset, anyone can make steady progress and use English more naturally in real situations."
        )

    if "dịch" in lower or "translate" in lower:
        candidate = raw
        marker_patterns = [
            r"dịch\s*(?:câu\s*này|đoạn\s*này)?\s*[:：]\s*(.+)$",
            r"translate\s*(?:this\s*(?:sentence|paragraph))?\s*[:：]\s*(.+)$",
        ]
        for pattern in marker_patterns:
            match = re.search(pattern, raw, flags=re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                break

        # If user asks to translate without providing source text, ask for it explicitly.
        if candidate == raw and len(raw.split()) <= 6:
            return "Please provide the exact sentence you want me to translate. Example: Translate: Tôi thích học tiếng Anh mỗi ngày."

        # Heuristic fallback translation style when no external LLM is configured.
        return (
            "I can translate accurately when AI mode is enabled.\n"
            f"Text to translate: {candidate}\n"
            "Please set LLM_API_KEY in backend/.env, then I will translate this exact text for you immediately."
        )

    corrected = raw
    notes: list[str] = []

    rules = [
        (r"\b[Ii]\s+go\b", "I went", "Use past tense for completed actions in the past."),
        (r"\b[Ii]\s+have\s+been\s+to\b", "I went to", "Use past simple with a finished time marker like 'last year'."),
        (r"\b([Hh]e|[Ss]he|[Ii]t)\s+don't\b", r"\1 doesn't", "Third-person singular uses 'doesn't', not 'don't'."),
        (r"\bmore\s+taller\b", "taller", "Do not use double comparatives (more + -er)."),
        (r"\bmore\s+better\b", "better", "Use 'better' directly; it is already comparative."),
        (r"\badvices\b", "advice", "'Advice' is uncountable in English."),
        (r"\bhomeworks\b", "homework", "'Homework' is uncountable in English."),
    ]

    for pattern, replacement, explanation in rules:
        new_text = re.sub(pattern, replacement, corrected)
        if new_text != corrected:
            corrected = new_text
            notes.append(explanation)

    if not re.search(r"[.!?]$", corrected):
        corrected += "."

    # Simple naturalness cleanups.
    corrected = re.sub(r"\bi\b", "I", corrected)
    corrected = re.sub(r"\s+", " ", corrected).strip()

    if corrected == raw and not notes:
        return (
            "Great sentence.\n"
            f"Natural version: {corrected}\n"
            "Tip: Add one extra detail (time, reason, or example) to sound more fluent."
        )

    unique_notes = []
    seen = set()
    for note in notes:
        if note not in seen:
            unique_notes.append(note)
            seen.add(note)

    why = "\n".join(f"- {item}" for item in unique_notes) if unique_notes else "- Improved punctuation and sentence flow."

    return (
        f"Original: {raw}\n"
        f"Corrected: {corrected}\n"
        "Why:\n"
        f"{why}\n"
        "Practice: Write one more sentence using the same grammar pattern."
    )


@router.get("/history", response_model=list[ChatMessageOut])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at)
        .limit(100)
        .all()
    )
    return messages


@router.post("/send", response_model=ChatMessageOut)
def send_message(
    payload: ChatMessageIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save user message. AI response is generated by the frontend calling
    the /chat/ai-response endpoint or via a real LLM integration.
    This endpoint handles persistence.
    """
    msg = ChatMessage(user_id=current_user.id, role="user", content=payload.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.post("/ai-response", response_model=ChatMessageOut)
def save_ai_response(
    payload: ChatMessageIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save the AI assistant's response to the DB."""
    msg = ChatMessage(user_id=current_user.id, role="assistant", content=payload.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.post("/generate", response_model=ChatMessageOut)
def generate_ai_response(
    payload: ChatMessageIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate and save AI response using prompt + history + configured LLM."""
    custom_prompt = (payload.system_prompt or "").strip()
    system_prompt = custom_prompt if custom_prompt else SYSTEM_PROMPT

    history = _history_messages(db, current_user.id)
    ai_text = _call_llm(payload.content, system_prompt, history) or _coach_reply(payload.content)

    msg = ChatMessage(user_id=current_user.id, role="assistant", content=ai_text)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/system-prompt")
def get_system_prompt(_: User = Depends(get_current_user)):
    """Return the system prompt for frontend LLM calls."""
    return {"system_prompt": SYSTEM_PROMPT}


@router.delete("/history", status_code=204)
def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()

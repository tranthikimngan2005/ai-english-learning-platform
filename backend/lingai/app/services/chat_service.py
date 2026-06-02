import re

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import ChatMessage

SYSTEM_PROMPT = """You are Pengwin Coach, a practical English tutor.
Always follow the user's latest instruction.
Core behaviors:
1. If user asks to write (paragraph/email/essay), write directly in requested language and length.
2. If user asks to translate, return only the translation unless user asks for explanation.
3. If user asks to correct grammar, provide corrections + short explanation.
4. If user asks general questions, answer clearly and concisely.
5. Never return rigid templates like "Original/Corrected/Why" unless the user explicitly asks for grammar correction format.
6. Never ask the user to choose from numbered options unless the user explicitly asks for options.
Tone: friendly, specific, and encouraging.
"""


def history_messages(db: Session, user_id: int, limit: int = 12) -> list[dict[str, str]]:
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


def call_llm(user_text: str, system_prompt: str, history: list[dict[str, str]]) -> tuple[str | None, str | None]:
    key = (settings.LLM_API_KEY or "").strip()
    if not key:
        return None, "missing_key"
    if key.upper().startswith("YOUR_REAL_API_KEY"):
        return None, "placeholder_key"

    provider = (settings.LLM_PROVIDER or "groq").strip().lower()

    try:
        with httpx.Client(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            if provider == "gemini":
                endpoint = (
                    settings.LLM_BASE_URL.rstrip("/")
                    + f"/models/{settings.LLM_MODEL}:generateContent"
                )

                gemini_history = []
                for msg in history:
                    role = "model" if msg.get("role") == "assistant" else "user"
                    gemini_history.append(
                        {
                            "role": role,
                            "parts": [{"text": msg.get("content", "")}],
                        }
                    )

                payload = {
                    "system_instruction": {
                        "parts": [{"text": system_prompt}],
                    },
                    "contents": [
                        *gemini_history,
                        {"role": "user", "parts": [{"text": user_text}]},
                    ],
                    "generationConfig": {
                        "temperature": 0.4,
                    },
                }

                response = client.post(
                    endpoint,
                    params={"key": key},
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
                data = response.json()

                candidate = (data.get("candidates") or [{}])[0]
                parts = ((candidate.get("content") or {}).get("parts") or [])
                text = "".join(
                    part.get("text", "") for part in parts if isinstance(part, dict)
                ).strip()
                return (text or None), None

            endpoint = settings.LLM_BASE_URL.rstrip("/") + "/chat/completions"
            messages = [
                {"role": "system", "content": system_prompt},
                *history,
                {"role": "user", "content": user_text},
            ]

            payload = {
                "model": settings.LLM_MODEL,
                "messages": messages,
                "temperature": 0.4,
            }
            headers = {
                "Authorization": f"Bearer {settings.LLM_API_KEY}",
                "Content-Type": "application/json",
            }

            response = client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

            choice = (data.get("choices") or [{}])[0]
            message = choice.get("message") or {}
            content = message.get("content")

            if isinstance(content, str):
                text = content.strip()
                return (text or None), None

            if isinstance(content, list):
                parts = [part.get("text", "") for part in content if isinstance(part, dict)]
                text = "".join(parts).strip()
                return (text or None), None
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        body = (e.response.text or "").lower()
        if status == 429:
            return None, "quota_exceeded"
        if status in (401, 403):
            return None, "invalid_key_or_permission"
        if status == 404:
            return None, "model_or_endpoint_not_found"
        if "quota" in body or "resource_exhausted" in body:
            return None, "quota_exceeded"
        return None, f"http_{status}"
    except httpx.TimeoutException:
        return None, "timeout"
    except Exception:
        return None, "unknown"

    return None, "empty_response"


def save_user_message(db: Session, user_id: int, content: str) -> ChatMessage:
    msg = ChatMessage(user_id=user_id, role="user", content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def save_ai_message(db: Session, user_id: int, content: str) -> ChatMessage:
    msg = ChatMessage(user_id=user_id, role="assistant", content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def generate_and_save_ai_response(
    db: Session,
    user_id: int,
    content: str,
    custom_prompt: str | None = None,
) -> tuple[ChatMessage, str | None]:
    system_prompt = custom_prompt.strip() if custom_prompt else SYSTEM_PROMPT
    history = history_messages(db, user_id)
    ai_text, llm_error = call_llm(content, system_prompt, history)

    if not ai_text:
        provider = (settings.LLM_PROVIDER or "groq").strip().lower()
        if provider == "gemini":
            key = (settings.LLM_API_KEY or "").strip()
            if not key or key.upper().startswith("YOUR_REAL_API_KEY"):
                ai_text = (
                    "Gemini chưa được cấu hình API key thật. "
                    "Bạn mở backend/.env và thay LLM_API_KEY=YOUR_REAL_API_KEY bằng key Gemini thật, rồi restart backend."
                )
            elif llm_error == "quota_exceeded":
                ai_text = (
                    "Gemini báo hết quota (RESOURCE_EXHAUSTED / 429). "
                    "Bạn cần bật billing hoặc chờ reset quota rồi thử lại."
                )
            elif llm_error == "invalid_key_or_permission":
                ai_text = (
                    "Gemini từ chối xác thực (401/403). "
                    "Hãy kiểm tra lại API key, project và quyền truy cập Gemini API."
                )
            elif llm_error == "model_or_endpoint_not_found":
                ai_text = (
                    "Model hoặc endpoint Gemini không tồn tại (404). "
                    "Hãy kiểm tra LLM_BASE_URL và LLM_MODEL trong backend/.env."
                )
            else:
                ai_text = (
                    "Gemini đang bật nhưng gọi API bị lỗi. "
                    "Hãy kiểm tra key còn hiệu lực, billing/quota, model gemini-2.0-flash và kết nối mạng máy chủ."
                )
        elif provider == "openai":
            key = (settings.LLM_API_KEY or "").strip()
            if not key or key.upper().startswith("YOUR_REAL_API_KEY"):
                ai_text = (
                    "OpenAI chưa được cấu hình API key thật. "
                    "Bạn mở backend/.env và cập nhật LLM_API_KEY, rồi restart backend."
                )
            else:
                ai_text = (
                    "OpenAI đang bật nhưng gọi API bị lỗi. "
                    "Hãy kiểm tra key, model, quota và kết nối mạng máy chủ."
                )
        elif provider == "groq":
            key = (settings.LLM_API_KEY or "").strip()
            if not key or key.upper().startswith("YOUR_REAL_API_KEY"):
                ai_text = (
                    "Groq chưa được cấu hình API key thật. "
                    "Bạn mở backend/.env, đặt LLM_PROVIDER=groq và dán Groq key vào LLM_API_KEY, rồi restart backend."
                )
            elif llm_error == "quota_exceeded":
                ai_text = (
                    "Groq báo hết quota/tốc độ tạm thời (429). "
                    "Bạn chờ một lúc rồi thử lại, hoặc đổi model nhẹ hơn trong LLM_MODEL."
                )
            elif llm_error == "invalid_key_or_permission":
                ai_text = (
                    "Groq từ chối xác thực (401/403). "
                    "Hãy kiểm tra lại Groq API key và quyền truy cập model."
                )
            elif llm_error == "model_or_endpoint_not_found":
                ai_text = (
                    "Model hoặc endpoint Groq không tồn tại (404). "
                    "Hãy kiểm tra LLM_BASE_URL và LLM_MODEL trong backend/.env."
                )
            else:
                ai_text = (
                    "Groq đang bật nhưng gọi API bị lỗi. "
                    "Hãy kiểm tra key, model, hạn mức miễn phí và kết nối mạng máy chủ."
                )
        else:
            ai_text = (
                "LLM_PROVIDER chưa hợp lệ. "
                "Hãy đặt LLM_PROVIDER=groq hoặc LLM_PROVIDER=gemini hoặc LLM_PROVIDER=openai trong backend/.env."
            )

    msg = save_ai_message(db, user_id, ai_text)
    return msg, llm_error

import { useEffect, useState, useRef, useCallback } from 'react';
import { chatApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Chat.css';

const SYSTEM_PROMPT = `You are an English language tutor AI.
When the user writes in English:
1. Identify and correct grammar/spelling errors clearly.
2. Suggest a better, more natural version of their sentence.
3. Briefly explain why the correction is needed.
4. Keep your tone encouraging and friendly.
Format corrections clearly with ❌ for errors and ✅ for corrections.`;

function Message({ msg }) {
  const isUser = msg.role === 'user';
  const time = new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`msg-row ${isUser ? 'user' : 'ai'}`}>
      {!isUser && <div className="msg-avatar ai-avatar">AI</div>}
      <div className={`msg-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
        <div className="msg-content">{msg.content}</div>
        <div className="msg-time">{time}</div>
      </div>
      {isUser && <div className="msg-avatar user-avatar">U</div>}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg-row ai">
      <div className="msg-avatar ai-avatar">AI</div>
      <div className="ai-bubble msg-bubble typing-bubble">
        <span /><span /><span />
      </div>
    </div>
  );
}

export default function Chat() {
  const toast   = useToast();
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [typing,   setTyping]   = useState(false);
  const [clearing, setClearing] = useState(false);

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  useEffect(() => {
    chatApi.history()
      .then(setMessages)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { scrollDown(); }, [messages, typing]);

  const callAI = useCallback(async (history) => {
    setTyping(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        }),
      });
      const data = await res.json();
      const aiText = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

      // Save AI response to backend
      const saved = await chatApi.saveAI(aiText);
      setMessages(prev => [...prev, saved]);
    } catch (e) {
      toast('Không thể kết nối AI. Hãy đảm bảo backend đang chạy.', 'error');
    } finally {
      setTyping(false);
    }
  }, [toast]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');

    try {
      const saved = await chatApi.send(text);
      const newHistory = [...messages, saved];
      setMessages(newHistory);
      await callAI(newHistory);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = async () => {
    if (!window.confirm('Xóa toàn bộ lịch sử chat?')) return;
    setClearing(true);
    try {
      await chatApi.clear();
      setMessages([]);
      toast('Đã xóa lịch sử chat');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  const SUGGESTIONS = [
    'Yesterday I go to school with my friend.',
    'She is more taller than her sister.',
    'I have been to Paris last year.',
    'He don\'t know the answer.',
  ];

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-topbar">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>AI Writing Coach</h1>
          <p className="page-sub">Viết tự do bằng tiếng Anh — AI sẽ sửa lỗi và gợi ý cải thiện</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleClear} disabled={clearing || messages.length === 0}>
          {clearing ? <span className="spinner" /> : '🗑'} Xóa chat
        </button>
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {loading ? (
          <div className="loading-page" style={{ height: '100%' }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">✦</div>
            <h3>Chào mừng đến AI Writing Coach!</h3>
            <p>Viết bất kỳ câu nào bằng tiếng Anh và AI sẽ giúp bạn cải thiện.</p>
            <div className="suggestions">
              <p className="sug-label">Thử các câu này:</p>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="sug-btn" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map(m => <Message key={m.id} msg={m} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-textarea"
          placeholder="Viết câu tiếng Anh bất kỳ... (Enter để gửi, Shift+Enter xuống dòng)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
          disabled={typing}
        />
        <button className="btn btn-primary chat-send-btn" onClick={handleSend}
          disabled={!input.trim() || typing}>
          {typing ? <span className="spinner" /> : '↑'}
        </button>
      </div>
    </div>
  );
}

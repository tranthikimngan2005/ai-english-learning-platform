import { useEffect, useState, useRef } from 'react';
import { chatApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Chat.css';

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
  const [systemPrompt, setSystemPrompt] = useState('');

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  useEffect(() => {
    chatApi.history()
      .then(setMessages)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    chatApi.systemPrompt()
      .then((res) => setSystemPrompt(res.system_prompt || ''))
      .catch(() => {});
  }, []);

  useEffect(() => { scrollDown(); }, [messages, typing]);

  const callAI = async (text) => {
    setTyping(true);
    try {
      const saved = await chatApi.generate(text, systemPrompt);
      setMessages(prev => [...prev, saved]);
    } catch (e) {
      toast('Không thể tạo phản hồi AI từ backend.', 'error');
    } finally {
      setTyping(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');

    try {
      const saved = await chatApi.send(text);
      setMessages(prev => [...prev, saved]);
      await callAI(text);
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
          className="chat-textarea"
          placeholder="System prompt (tùy chỉnh cách AI trả lời)."
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          rows={2}
          disabled={typing}
          style={{ marginBottom: 10, opacity: 0.95 }}
        />
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

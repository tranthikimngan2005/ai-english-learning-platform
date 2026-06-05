import React, { useState, useEffect, useRef } from 'react';
import * as apiModule from '../api/client'; // 🌟 Giải pháp tối cao: Gom toàn bộ export để triệt tiêu lỗi biên dịch của Vercel
import './Practice.css';

export default function Practice() {
    // 🌟 TỰ ĐỘNG PHÂN TÍCH MODULE: Giúp nhận diện Axios instance dù bạn cấu hình export kiểu gì bên file gốc
    const client = apiModule.default || apiModule.client || apiModule;

    // State cấu hình bài học
    const [selectedPart, setSelectedPart] = useState(5);
    const [questionCount, setQuestionCount] = useState(10);
    const [isStarted, setIsStarted] = useState(false);
    
    // State quản lý câu hỏi và bài làm
    const [questions, setQuestions] = useState([]);
    const [passages, setPassages] = useState([]);
    const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [checkedQuestions, setCheckedQuestions] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State AI Assist
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const threadEndRef = useRef(null);

    useEffect(() => {
        if (threadEndRef.current) {
            threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiMessages]);

    const handleStartPractice = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.post('/api/questions/practice/start', {
                skill: 'reading',
                part: parseInt(selectedPart),
                count: parseInt(questionCount)
            });
            
            if (response.data.passages && response.data.passages.length > 0) {
                setPassages(response.data.passages);
                setQuestions([]);
                setCurrentPassageIndex(0);
            } else {
                setQuestions(response.data.questions || []);
                setPassages([]);
            }
            setIsStarted(true);
            setAiMessages([]);
            setUserAnswers({});
            setCheckedQuestions({});
        } catch (err) {
            console.error(err);
            setError('Failed to fetch questions. Please try again!');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = async (questionId) => {
        const answer = userAnswers[questionId];
        if (!answer) return;

        try {
            const response = await client.post('/api/questions/practice/submit', {
                question_id: questionId,
                user_answer: answer
            });
            setCheckedQuestions(prev => ({
                ...prev,
                [questionId]: response.data
            }));
        } catch (err) {
            console.error('Submit answer failed:', err);
        }
    };

    const handleSendAiMessage = async (textToSend) => {
        const msg = textToSend || aiInput;
        if (!msg.trim()) return;

        const newUserMessage = { sender: 'user', text: msg };
        setAiMessages(prev => [...prev, newUserMessage]);
        if (!textToSend) setAiInput('');
        setAiLoading(true);

        try {
            const response = await client.post('/api/chat/respond', { message: msg });
            setAiMessages(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
        } catch (err) {
            setAiMessages(prev => [...prev, { sender: 'ai', text: 'Penwin AI Assist đang bận xử lý, thử lại nhé! 🐾' }]);
        } finally {
            setAiLoading(false);
        }
    };

    if (!isStarted) {
        return (
            <div className="practice-config">
                <div style={{ backgroundColor: '#1e3a8a', padding: '24px', borderRadius: '12px', color: '#fff', marginBottom: '24px', textAlign: 'left' }}>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>▶ Practice</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Choose TOEIC Reading part and question count to begin</p>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' }}>
                    <label style={{ fontWeight: 700, color: '#475569', fontSize: '13px', textTransform: 'uppercase' }}>TOEIC Reading Part</label>
                    
                    <div className="part-picker">
                        <button className={`part-pick-btn ${selectedPart === 5 ? 'active' : ''}`} onClick={() => setSelectedPart(5)}>
                            <img src="/assets/icons/part5.png" alt="Part 5" onError={(e) => e.target.src="https://cdn-icons-png.flaticon.com/512/3593/3593444.png"} />
                            <span>Part 5</span>
                            <span className="part-pick-sub">Incomplete Sentences</span>
                        </button>
                        <button className={`part-pick-btn ${selectedPart === 6 ? 'active' : ''}`} onClick={() => setSelectedPart(6)}>
                            <img src="/assets/icons/part6.png" alt="Part 6" onError={(e) => e.target.src="https://cdn-icons-png.flaticon.com/512/3593/3593497.png"} />
                            <span>Part 6</span>
                            <span className="part-pick-sub">Text Completion</span>
                        </button>
                        <button className={`part-pick-btn ${selectedPart === 7 ? 'active' : ''}`} onClick={() => setSelectedPart(7)}>
                            <img src="/assets/icons/part7.png" alt="Part 7" onError={(e) => e.target.src="https://cdn-icons-png.flaticon.com/512/2202/2202111.png"} />
                            <span>Part 7</span>
                            <span className="part-pick-sub">Reading Comprehension</span>
                        </button>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <label style={{ fontWeight: 700, color: '#475569', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                            QUESTION COUNT: <span style={{ color: '#0ea5e9' }}>{questionCount}</span>
                        </label>
                        <input 
                            type="range" min="5" max="30" step="5" value={questionCount} 
                            onChange={(e) => setQuestionCount(e.target.value)}
                            style={{ width: '100%', accentColor: '#0ea5e9' }}
                        />
                    </div>

                    {error && <p style={{ color: '#ef4444', marginTop: '12px', fontSize: '14px' }}>❌ {error}</p>}

                    <button 
                        onClick={handleStartPractice} disabled={loading}
                        style={{ marginTop: '24px', width: '100%', padding: '14px', backgroundColor: '#0ea5e9', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}
                    >
                        {loading ? 'Loading Questions...' : `▶ Start ${questionCount} questions - Part ${selectedPart}`}
                    </button>
                </div>
            </div>
        );
    }

    const activeQuestions = passages.length > 0 ? (passages[currentPassageIndex]?.questions || []) : questions;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
            
            {/* CỘT TRÁI: ĐỀ THI & ĐÁP ÁN */}
            <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/3593/3593444.png" alt="Penwin Mini" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '18px' }}>TOEIC Part {selectedPart} Practice</h3>
                    </div>
                    <button onClick={() => setIsStarted(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Stop</button>
                </div>

                {/* Khung đoạn văn Part 6/7 */}
                {passages.length > 0 && passages[currentPassageIndex] && (
                    <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0ea5e9', backgroundColor: '#e0f2fe', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px' }}>
                            📄 Passage {currentPassageIndex + 1} of {passages.length}
                        </span>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '15px', color: '#334155', fontFamily: 'Inter, sans-serif' }}>
                            {passages[currentPassageIndex].passage}
                        </div>
                    </div>
                )}

                {/* SỐ LƯỢNG CÂU HỎI GRID */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ width: '100%', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px', display: 'block' }}>QUESTIONS IN THIS BLOCK:</span>
                    {activeQuestions.map((q, idx) => {
                        const isAnswered = !!userAnswers[q.id];
                        const isChecked = !!checkedQuestions[q.id];
                        const isCorrect = checkedQuestions[q.id]?.is_correct;
                        
                        let bg = '#fff';
                        let color = '#475569';
                        if (isChecked) {
                            bg = isCorrect ? '#22c55e' : '#ef4444';
                            color = '#fff';
                        } else if (isAnswered) {
                            bg = '#bae6fd';
                            color = '#0369a1';
                        }

                        return (
                            <div 
                                key={q.id} 
                                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bg, color: color, border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            >
                                Q{idx + 1}
                            </div>
                        );
                    })}
                </div>

                {/* QUY TRÌNH RENDER CÂU HỎI KHÔNG VỠ LAYOUT */}
                {activeQuestions.map((q, index) => {
                    const result = checkedQuestions[q.id];

                    return (
                        <div key={q.id} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
                                <h4 style={{ margin: 0, fontWeight: 700, color: '#0ea5e9', fontSize: '15px' }}>Question {index + 1}:</h4>
                            </div>
                            
                            <p style={{ fontSize: '15.5px', color: '#1e293b', marginBottom: '20px', lineHeight: 1.6, fontWeight: 500 }}>
                                {q.content}
                            </p>

                            {/* Cột dọc (Flex-Column) xếp thẳng hàng */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {['A', 'B', 'C', 'D'].map((opt) => {
                                    let optionText = q[`option_${opt.toLowerCase()}`] || q[opt];
                                    if (!optionText) return null;
                                    
                                    if (optionText.startsWith(opt) && optionText.length > 1) {
                                        optionText = optionText.substring(1).trim();
                                    }

                                    const isSelected = userAnswers[q.id] === opt;
                                    
                                    return (
                                        <button 
                                            key={opt} disabled={!!result}
                                            onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                            style={{
                                                width: '100%',
                                                padding: '14px 18px',
                                                border: isSelected ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                                                backgroundColor: isSelected ? '#f0f9ff' : '#fff',
                                                borderRadius: '8px',
                                                cursor: result ? 'not-allowed' : 'pointer',
                                                textAlign: 'left',
                                                fontWeight: 500,
                                                fontSize: '14.5px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.15s ease',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <span style={{ 
                                                width: '28px', 
                                                height: '28px', 
                                                borderRadius: '50%', 
                                                backgroundColor: isSelected ? '#0ea5e9' : '#f1f5f9', 
                                                color: isSelected ? '#fff' : '#475569', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                marginRight: '12px', 
                                                fontWeight: 700,
                                                fontSize: '13px'
                                            }}>{opt}</span>
                                            <span style={{ color: '#334155' }}>{optionText}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* KIỂM TRA ĐÁP ÁN */}
                            <div style={{ marginTop: '20px' }}>
                                {!result ? (
                                    <button 
                                        onClick={() => handleSubmitAnswer(q.id)}
                                        disabled={!userAnswers[q.id]}
                                        style={{ padding: '10px 24px', backgroundColor: userAnswers[q.id] ? '#0ea5e9' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: userAnswers[q.id] ? 'pointer' : 'not-allowed', fontSize: '14px', transition: 'background 0.2s' }}
                                    >
                                        Submit Answer
                                    </button>
                                ) : (
                                    <div style={{ padding: '16px', backgroundColor: result.is_correct ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${result.is_correct ? '#bbf7d0' : '#fecaca'}` }}>
                                        <div style={{ fontWeight: 700, color: result.is_correct ? '#16a34a' : '#dc2626', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {result.is_correct ? '✅ Correct Answer!' : `❌ Incorrect! Correct Option is: ${result.correct_answer}`}
                                        </div>
                                        {result.explanation && (
                                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#475569', lineHeight: 1.5, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '8px' }}>
                                                💡 <strong>Giải thích:</strong> {result.explanation}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* DI CHUYỂN PASSAGE */}
                {passages.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <button 
                            disabled={currentPassageIndex === 0}
                            onClick={() => setCurrentPassageIndex(p => p - 1)}
                            style={{ padding: '10px 18px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontWidth: 600, cursor: currentPassageIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentPassageIndex === 0 ? 0.5 : 1, fontSize: '14px' }}
                        >
                            ◀ Previous
                        </button>
                        <span style={{ fontWeight: 700, color: '#475569', fontSize: '14px' }}>Passage {currentPassageIndex + 1} of {passages.length}</span>
                        <button 
                            disabled={currentPassageIndex === passages.length - 1}
                            onClick={() => setCurrentPassageIndex(p => p + 1)}
                            style={{ padding: '10px 18px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontWeight: 600, cursor: currentPassageIndex === passages.length - 1 ? 'not-allowed' : 'pointer', opacity: currentPassageIndex === passages.length - 1 ? 0.5 : 1, fontSize: '14px' }}
                        >
                            Next ▶
                        </button>
                    </div>
                )}
            </div>

            {/* CỘT PHẢI: AI ASSIST CHUẨN ĐÉT THEO CSS CỦA BẠN */}
            <div>
                <div className="practice-ai-assist" style={{ position: 'sticky', top: '20px', marginTop: 0 }}>
                    <div className="practice-ai-head">
                        <div>
                            <div className="practice-ai-title">🤖 Penwin AI Assist</div>
                            <div className="practice-ai-sub">Hỏi AI về từ vựng hoặc ngữ cảnh câu hỏi này nhé!</div>
                        </div>
                        <div className="practice-ai-context">Part {selectedPart}</div>
                    </div>

                    <div className="practice-ai-thread">
                        {aiMessages.length === 0 ? (
                            <div className="practice-ai-empty">Chưa có câu hỏi nào. Chọn nhanh gợi ý hoặc nhập tin nhắn dưới đây để trò chuyện!</div>
                        ) : (
                            aiMessages.map((m, i) => (
                                <div key={i} className={`practice-ai-msg ${m.sender}`}>
                                    <div className="practice-ai-bubble">{m.text}</div>
                                </div>
                            ))
                        )}
                        {aiLoading && (
                            <div className="practice-ai-msg ai">
                                <div className="practice-ai-bubble" style={{ color: '#94a3b8' }}>Penwin AI đang soạn câu trả lời... 🐾</div>
                            </div>
                        )}
                        <div ref={threadEndRef} />
                    </div>

                    <div className="practice-ai-chips">
                        <button className="practice-ai-chip" onClick={() => handleSendAiMessage('Giải thích cấu trúc ngữ pháp và mẹo chọn đáp án câu hỏi này.')}>💡 Giải thích cấu trúc</button>
                        <button className="practice-ai-chip" onClick={() => handleSendAiMessage('Dịch nghĩa câu hỏi/đoạn văn này sang tiếng Việt giúp mình.')}>🇻🇳 Dịch câu này</button>
                        <button className="practice-ai-chip" onClick={() => handleSendAiMessage('Chỉ ra các từ vựng mới nâng cao xuất hiện trong bài này.')}>📚 Từ vựng khó</button>
                    </div>

                    <div className="practice-ai-input-row">
                        <textarea 
                            className="practice-ai-input" 
                            placeholder="Nhập câu hỏi cho AI về bài làm..."
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendAiMessage();
                                }
                            }}
                        />
                        <button 
                            className="practice-ai-send"
                            onClick={() => handleSendAiMessage()}
                            disabled={aiLoading || !aiInput.trim()}
                            style={{ backgroundColor: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                            Ask AI
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
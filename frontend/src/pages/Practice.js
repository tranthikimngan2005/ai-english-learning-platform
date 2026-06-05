import React, { useState, useEffect, useRef, useMemo } from 'react';
import { questionApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Review.css'; 

const normalize = (value) => String(value ?? '').trim().toLowerCase();

export default function Practice() {
    const toast = useToast();

    // State cấu hình bài học
    const [selectedPart, setSelectedPart] = useState(5);
    const [questionCount, setQuestionCount] = useState(10);
    const [isStarted, setIsStarted] = useState(false);
    
    // State dữ liệu câu hỏi
    const [questions, setQuestions] = useState([]);
    const [passages, setPassages] = useState([]);
    const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // State quản lý bài làm
    const [userAnswers, setUserAnswers] = useState({});
    const [checkedQuestions, setCheckedQuestions] = useState({});

    // State AI Tutor Assist
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const threadEndRef = useRef(null);

    // Đường dẫn ảnh tĩnh public
    const IMG_GRAMMAR_ICON = "/iconapp/gammaravt.png";
    const IMG_TESTTIME_ICON = "/iconapp/testtime.png";
    const IMG_VOCAB_ICON = "/iconapp/vocabavt.png";
    const IMG_PENWIN_ICON = "/iconapp/avt.png";
    const IMG_AI_ICON = "/iconapp/AItutoravt.png";
    const IMG_CORRECT_ICON = "/iconapp/usercorrect.png";
    const IMG_INCORRECT_ICON = "/iconapp/userincorrect.png";

    useEffect(() => {
        if (threadEndRef.current) {
            threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiMessages]);

    useEffect(() => {
        setCurrentQuestionIndex(0);
    }, [currentPassageIndex]);

    const handleStartPractice = async () => {
        setLoading(true);
        try {
            const response = await questionApi.startPractice(
                'reading', parseInt(questionCount), parseInt(selectedPart)
            );
            
            if (response?.passages?.length > 0) {
                setPassages(response.passages);
                setQuestions([]);
            } else {
                setQuestions(response?.questions || []);
                setPassages([]);
            }
            setIsStarted(true);
            setAiMessages([]);
            setUserAnswers({});
            setCheckedQuestions({});
            setCurrentPassageIndex(0);
            setCurrentQuestionIndex(0);
        } catch (err) {
            if (toast) toast('Không thể tải câu hỏi từ hệ thống!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const activeQuestions = useMemo(() => {
        return passages.length > 0 ? (passages[currentPassageIndex]?.questions || []) : questions;
    }, [passages, questions, currentPassageIndex]);

    const handleCheckAnswer = async (questionId) => {
        const answer = userAnswers[questionId];
        if (!answer) return;

        try {
            const response = await questionApi.submitAnswer(questionId, answer);
            setCheckedQuestions(prev => ({
                ...prev,
                [questionId]: response
            }));
        } catch (err) {
            console.error('Nộp bài lỗi:', err);
        }
    };

    const handleSendAiMessage = async (textToSend) => {
        const msg = textToSend || aiInput;
        if (!msg.trim()) return;

        setAiMessages(prev => [...prev, { sender: 'user', text: msg }]);
        if (!textToSend) setAiInput('');
        setAiLoading(true);

        try {
            const currentQ = activeQuestions[currentQuestionIndex];
            const context = currentQ ? `Câu hỏi: "${currentQ.content}"` : '';
            const res = questionApi.askAI ? await questionApi.askAI(msg, context) : null;
            
            setTimeout(() => {
                setAiMessages(prev => [...prev, { 
                    sender: 'ai', 
                    text: res?.answer || 'Penwin AI Tutor đã ghi nhận câu hỏi ngữ pháp của bạn! 🐾' 
                }]);
                setAiLoading(false);
            }, 600);
        } catch {
            setAiLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 🎴 1. MÀN HÌNH CHÍNH CHỌN PART
    // ─────────────────────────────────────────────────────────────
    if (!isStarted) {
        return (
            <div className="fade-up review-entry">
                <div className="page-header">
                    <h1 className="page-title">▶ Practice</h1>
                    <p className="page-sub">Choose TOEIC Reading part and question count to begin</p>
                </div>

                <div style={{ margin: '20px 0 10px 0', fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'left' }}>
                    TOEIC Reading Part
                </div>

                <div className="review-type-grid">
                    <button className={`card review-type-card ${selectedPart === 5 ? 'active' : ''}`} style={{ border: selectedPart === 5 ? '2px solid #2196b0' : '' }} onClick={() => setSelectedPart(5)}>
                        <img src={IMG_GRAMMAR_ICON} alt="Part 5" className="feedback-icon" style={{ marginBottom: '8px' }} />
                        <h2>Part 5</h2>
                        <p>Incomplete Sentences</p>
                    </button>

                    <button className={`card review-type-card ${selectedPart === 6 ? 'active' : ''}`} style={{ border: selectedPart === 6 ? '2px solid #2196b0' : '' }} onClick={() => setSelectedPart(6)}>
                        <img src={IMG_TESTTIME_ICON} alt="Part 6" className="feedback-icon" style={{ marginBottom: '8px' }} />
                        <h2>Part 6</h2>
                        <p>Text Completion</p>
                    </button>

                    <button className={`card review-type-card ${selectedPart === 7 ? 'active' : ''}`} style={{ border: selectedPart === 7 ? '2px solid #2196b0' : '' }} onClick={() => setSelectedPart(7)}>
                        <img src={IMG_VOCAB_ICON} alt="Part 7" className="feedback-icon" style={{ marginBottom: '8px' }} />
                        <h2>Part 7</h2>
                        <p>Reading Comprehension</p>
                    </button>
                </div>

                <div className="card review-main-card" style={{ marginTop: '20px', padding: '24px', textAlign: 'left' }}>
                    <label style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                        QUESTION COUNT: <span style={{ color: '#2196b0' }}>{questionCount}</span>
                    </label>
                    <input 
                        type="range" min="5" max="30" step="5" value={questionCount} 
                        onChange={(e) => setQuestionCount(e.target.value)}
                        style={{ width: '100%', accentColor: '#2196b0', marginTop: '10px' }}
                    />
                    <button onClick={handleStartPractice} disabled={loading} className="btn btn-primary" style={{ marginTop: '24px', width: '100%', background: '#2196b0', border: 'none', padding: '12px', fontWeight: 700 }}>
                        {loading ? 'Loading Questions...' : `▶ Start ${questionCount} questions - Part ${selectedPart}`}
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // 📝 2. MÀN HÌNH WORKSPACE LÀM BÀI
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="fade-up review-mode-wrap">
            <div className="review-queue-header">
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-blue">Reading</span>
                    <span className="badge badge-gray">Part {selectedPart}</span>
                    {selectedPart === 5 && <span className="badge badge-orange">fill blank</span>}
                    {passages.length > 0 && <span className="badge badge-orange">{currentPassageIndex + 1} / {passages.length} passages</span>}
                </div>
                <span className="badge badge-gray">✓ 0</span>
            </div>

            {/* CARD 1: ĐOẠN VĂN ĐỌC HIỂN THỊ */}
            {passages.length > 0 && passages[currentPassageIndex] && (
                <div className="card review-main-card" style={{ textAlign: 'left', padding: '24px' }}>
                    <div className="passage-header">
                        <span className="passage-label">📄 Passage</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '15px', color: '#334155' }}>
                        {passages[currentPassageIndex].passage}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={currentPassageIndex === 0} onClick={() => setCurrentPassageIndex(p => p - 1)}>◀ Prev Passage</button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={currentPassageIndex === passages.length - 1} onClick={() => setCurrentPassageIndex(p => p + 1)}>Next Passage ▶</button>
                    </div>
                </div>
            )}

            {/* CARD 2: CÂU HỎI VÀ ĐÁP ÁN */}
            <div className="card review-main-card" style={{ textAlign: 'left', padding: '24px' }}>
                <img src={IMG_PENWIN_ICON} alt="Penwin logo" className="practice-main-logo" style={{ width: '72px', height: '72px', display: 'block', margin: '0 auto 12px auto' }} />
                
                <div className="questions-grid-header" style={{ fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Questions in this passage</div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {activeQuestions.map((q, idx) => (
                        <span 
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`question-grid-item clickable ${currentQuestionIndex === idx ? 'active-q' : ''} ${userAnswers[q.id] ? 'answered' : ''}`}
                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Q{idx + 1}
                        </span>
                    ))}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>For Part 6, click blanks like (1), (2), (3) in the passage to jump to the question.</div>

                {activeQuestions.map((q, index) => {
                    const result = checkedQuestions[q.id];
                    const isSelectedAnswered = !!userAnswers[q.id];

                    return (
                        <div key={q.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px', fontSize: '15px' }}>Question {index + 1}</div>
                            <div style={{ color: '#334155', marginBottom: '14px', fontSize: '15px', fontWeight: 500 }}>{q.content || "archive"}</div>

                            {selectedPart === 5 ? (
                                <div style={{ marginBottom: '12px' }}>
                                    <textarea
                                        className="form-textarea"
                                        rows={2}
                                        value={userAnswers[q.id] || ''}
                                        placeholder="Enter your answer..."
                                        disabled={!!result}
                                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>
                            ) : (
                                <div className="review-options" style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        let optionText = q[`option_${opt.toLowerCase()}`] || q[opt];
                                        if (!optionText) return null;

                                        if (optionText.startsWith(opt) && optionText.length > 1) {
                                            optionText = optionText.substring(1).replace(/^[.\s:-]+/, '').trim();
                                        }

                                        const isSelected = userAnswers[q.id] === opt;
                                        const isCorrectOpt = result && result.correct_answer === opt;
                                        const isWrongOpt = result && isSelected && !result.is_correct;

                                        let optionStyleClass = "";
                                        if (isCorrectOpt) optionStyleClass = "opt-correct";
                                        else if (isWrongOpt) optionStyleClass = "opt-wrong";

                                        return (
                                            <button
                                                key={opt}
                                                disabled={!!result}
                                                onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                                className={`choice ${isSelected ? 'selected' : ''} ${optionStyleClass}`}
                                            >
                                                <span className="choice-letter">{opt}</span>
                                                {optionText}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="answer-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <span className="please-choose-label" style={{ fontSize: '13px', color: '#64748b' }}>Chọn hoặc nhập đáp án và bấm Check.</span>
                                {!result ? (
                                    <button
                                        onClick={() => handleCheckAnswer(q.id)}
                                        disabled={!isSelectedAnswered}
                                        className="check-single-answer-btn"
                                        style={{ padding: '6px 14px', background: isSelectedAnswered ? '#2196b0' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '6px', cursor: isSelectedAnswered ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                                    >
                                        Check Answer
                                    </button>
                                ) : (
                                    <div className={`answer-feedback-box ${result.is_correct ? 'correct' : 'incorrect'}`} style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '8px', background: result.is_correct ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${result.is_correct ? '#10b981' : '#ef4444'}` }}>
                                        <div className="feedback-header">
                                            <img src={result.is_correct ? IMG_CORRECT_ICON : IMG_INCORRECT_ICON} alt="status icon" className="feedback-icon" />
                                            <span style={{ color: result.is_correct ? '#065f46' : '#7f1d1d' }}>
                                                {result.is_correct ? 'Đúng rồi! +10 XP 🎉' : `Sai rồi! Đáp án đúng: ${result.correct_answer}`}
                                            </span>
                                        </div>
                                        {result.explanation && (
                                            <p className="explanation-paragraph" style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
                                                💡 {result.explanation}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }} className="practice-footer-actions">
                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(i => i - 1)}>◀ Prev</button>
                    <button className="btn btn-primary footer-action-submit-btn" style={{ padding: '8px 16px', background: '#2196b0', border: 'none' }} disabled={currentQuestionIndex === activeQuestions.length - 1} onClick={() => setCurrentQuestionIndex(i => i + 1)}>Next ▶</button>
                    <button className="btn btn-secondary footer-action-stop-btn" style={{ padding: '8px 16px' }} onClick={() => setIsStarted(false)}>Stop</button>
                </div>
            </div>

            {/* CARD 3: PENWIN AI TUTOR ASSIST */}
            <div className="card review-main-card" style={{ padding: '24px', textAlign: 'left' }}>
                <div className="practice-ai-head" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
                    <img src={IMG_AI_ICON} alt="AI" className="ai-head-icon" />
                    <div>
                        <div className="practice-ai-title" style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Penwin AI Assist</div>
                        <div className="practice-ai-sub" style={{ fontSize: '12.5px', color: '#64748b' }}>Hỏi AI về từ vựng hoặc ngữ cảnh bài làm nhé Ngân!</div>
                    </div>
                </div>

                <div className="practice-ai-thread" style={{ maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {aiMessages.length === 0 ? (
                        <div className="practice-ai-empty" style={{ fontSize: '13px', color: '#94a3b8', textStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Chọn gợi ý nhanh hoặc nhập câu hỏi bên dưới!</div>
                    ) : (
                        aiMessages.map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                                <div style={{ background: m.sender === 'user' ? '#e0f2fe' : '#fff', color: '#1e293b', border: m.sender === 'ai' ? '1px solid #e2e8f0' : 'none', padding: '8px 12px', borderRadius: '12px', fontSize: '13.5px', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                    {m.text}
                                </div>
                            </div>
                        ))
                    )}
                    {aiLoading && (
                        <div style={{ fontSize: '13px', color: '#94a3b8' }}>🐾 Penwin AI đang biên soạn câu trả lời...</div>
                    )}
                    <div ref={threadEndRef} />
                </div>

                <div className="practice-ai-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    <button className="practice-ai-chip" onClick={() => handleSendAiMessage('Giải thích chi tiết cấu trúc ngữ pháp và quy tắc chọn từ câu hỏi này.')}>💡 Giải thích cấu trúc</button>
                    <button className="practice-ai-chip" onClick={() => handleSendAiMessage('Dịch giúp mình toàn bộ nội dung đoạn văn/câu hỏi hiện tại sang tiếng Việt.')}>🇻🇳 Dịch câu này</button>
                    <button className="practice-ai-chip" onClick={() => handleSendAiMessage('Tổng hợp các từ vựng core cốt lõi cần nhớ trong bài luyện tập này.')}>📚 Từ vựng khó</button>
                </div>

                <div className="practice-ai-input-row" style={{ display: 'flex', gap: '8px' }}>
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
                        style={{ flex: 1, height: '42px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', resize: 'none' }}
                    />
                    <button 
                        className="btn btn-primary practice-ai-send" 
                        onClick={() => handleSendAiMessage()} 
                        disabled={aiLoading || !aiInput.trim()}
                        style={{ height: '42px', padding: '0 16px', background: '#475569', border: 'none', margin: 0 }}
                    >
                        Ask AI
                    </button>
                </div>
            </div>

            <div className="review-actions-row">
                <button className="btn btn-primary" style={{ background: '#2196b0', border: 'none' }} onClick={() => {
                    if (passages.length > 0 && currentPassageIndex + 1 < passages.length) {
                        setCurrentPassageIndex(p => p + 1);
                    } else {
                        if (toast) toast('Chúc mừng bạn đã hoàn thành bài luyện tập!', 'success');
                        setIsStarted(false);
                    }
                }}>
                    Next Block ▶
                </button>
                <button className="btn btn-ghost" onClick={() => setIsStarted(false)}>Đổi loại luyện tập</button>
            </div>
        </div>
    );
}
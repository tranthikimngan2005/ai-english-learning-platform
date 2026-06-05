import React, { useState, useEffect, useRef, useMemo } from 'react';
import { questionApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import IMG_GRAMMAR_ICON from '../assets/iconapp/gammaravt.png';
import IMG_TESTTIME_ICON from '../assets/iconapp/testtime.png';
import IMG_VOCAB_ICON from '../assets/iconapp/vocabavt.png';
import IMG_PENWIN_ICON from '../assets/iconapp/avt.png';
import './Practice.css';
export default function Practice() {
    const toast = useToast();

    // State cấu hình bài học ban đầu
    const [selectedPart, setSelectedPart] = useState(5);
    const [questionCount, setQuestionCount] = useState(10);
    const [isStarted, setIsStarted] = useState(false);
    
    // State quản lý danh sách câu hỏi đổ về từ hệ thống
    const [questions, setQuestions] = useState([]);
    const [passages, setPassages] = useState([]);
    const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Dùng làm tiêu điểm điều hướng đơn câu cho Part 5
    const [loading, setLoading] = useState(false);

    // State lưu trữ bài làm
    const [userAnswers, setUserAnswers] = useState({});
    const [checkedQuestions, setCheckedQuestions] = useState({});

    // State tương tác phân hệ AI Tutor
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const threadEndRef = useRef(null);

    useEffect(() => {
        if (threadEndRef.current) {
            threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiMessages]);

    // Tự động đặt lại chỉ mục câu hỏi nhỏ khi người dùng nhảy đoạn văn
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
            if (toast) toast('Failed to fetch questions. Please try again!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Khối câu hỏi đang hoạt động trên màn hình hiện hành
    const activeQuestions = useMemo(() => {
        return passages.length > 0 ? (passages[currentPassageIndex]?.questions || []) : questions;
    }, [passages, questions, currentPassageIndex]);

    // Hàm bóc tách mảng lựa chọn tương thích tuyệt đối với cấu trúc JSON Postgres
    const getQuestionOptions = (q) => {
        if (!q) return [];
        // Khôi phục nếu options là một mảng có sẵn
        if (Array.isArray(q.options)) return q.options;
        // Kiểm tra định dạng chuỗi JSON
        if (typeof q.options === 'string') {
            try {
                const parsed = JSON.parse(q.options);
                if (Array.isArray(parsed)) return parsed;
                if (typeof parsed === 'object') return Object.values(parsed);
            } catch (e) {}
        }
        // Fallback bốc trực tiếp từ các trường đơn lẻ hệ thống trả về
        const opts = [];
        ['A', 'B', 'C', 'D'].forEach(letter => {
            const val = q[`option_${letter.toLowerCase()}`] || q[letter];
            if (val) opts.push({ letter, text: val });
        });
        if (opts.length > 0) return opts;
        
        return [];
    };

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
            console.error('Submit answer failed:', err);
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
                    text: res?.answer || 'Penwin AI Tutor Assist đã ghi nhận câu hỏi của bạn! 🐾' 
                }]);
                setAiLoading(false);
            }, 600);
        } catch {
            setAiLoading(false);
        }
    };

    const handleNextStep = () => {
        if (selectedPart === 5) {
            if (currentQuestionIndex + 1 < activeQuestions.length) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                if (toast) toast('Chúc mừng bạn đã hoàn thành bài luyện tập Part 5!', 'success');
                setIsStarted(false);
            }
        } else {
            // Đối với Part 6/7 thì di chuyển khối đoạn văn đọc hiểu tiếp theo
            if (currentPassageIndex + 1 < passages.length) {
                setCurrentPassageIndex(prev => prev + 1);
            } else {
                if (toast) toast(`Chúc mừng bạn đã hoàn thành bài luyện tập Part ${selectedPart}!`, 'success');
                setIsStarted(false);
            }
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 🎴 1. MÀN HÌNH CHỌN CẤU HÌNH BÀI THI (MẪU REVIEW ĐỒNG BỘ)
    // ─────────────────────────────────────────────────────────────
    if (!isStarted) {
        return (
            <div className="fade-up review-entry">
                <div className="page-header">
                    <h1 className="page-title">▶ Practice Workspace</h1>
                    <p className="page-sub">Choose TOEIC Reading part and question count to begin</p>
                </div>

                <div style={{ margin: '20px 0 10px 0', fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'left' }}>
                    TOEIC Reading Part
                </div>

                <div className="review-type-grid">
                    <button className={`card review-type-card ${selectedPart === 5 ? 'active' : ''}`} style={{ border: selectedPart === 5 ? '2px solid #2196b0' : '' }} onClick={() => setSelectedPart(5)}>
                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>📝</div>
                        <h2>Part 5</h2>
                        <p>Incomplete Sentences</p>
                    </button>

                    <button className={`card review-type-card ${selectedPart === 6 ? 'active' : ''}`} style={{ border: selectedPart === 6 ? '2px solid #2196b0' : '' }} onClick={() => setSelectedPart(6)}>
                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>📖</div>
                        <h2>Part 6</h2>
                        <p>Text Completion</p>
                    </button>

                    <button className={`card review-type-card ${selectedPart === 7 ? 'active' : ''}`} style={{ border: selectedPart === 7 ? '2px solid #2196b0' : '' }} onClick={() => setSelectedPart(7)}>
                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>📊</div>
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
                        {loading ? 'Loading Questions...' : `▶ Start Luyện Tập - Part ${selectedPart}`}
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // 📝 2. MÀN HÌNH LÀM BÀI: THỰC THI CHUẨN DESIGN THEO YÊU CẦU NGÂN
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="fade-up review-mode-wrap" style={{ maxWidth: '1200px' }}>
            
            {/* Header thông số trạng thái */}
            <div className="review-queue-header">
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-blue">Reading</span>
                    <span className="badge badge-gray">Part {selectedPart}</span>
                    {selectedPart === 5 ? (
                        <span className="badge badge-orange">Câu hỏi {currentQuestionIndex + 1} / {activeQuestions.length}</span>
                    ) : (
                        <span className="badge badge-orange">Đoạn văn {currentPassageIndex + 1} / {passages.length}</span>
                    )}
                </div>
                <span className="badge badge-blue">✓ {Object.keys(checkedQuestions).length} Done</span>
            </div>

            {/* BỐ CỤC PHÂN TÁCH HAI BÊN (Dành cho Part 6 & Part 7 - ĐOẠN VĂN MỘT BÊN, CÂU HỎI MỘT BÊN) */}
            {selectedPart !== 5 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start', width: '100%' }}>
                    
                    {/* KHU VỰC TRÁI: ĐOẠN VĂN ĐỌC HIỂU */}
                    <div className="card review-main-card" style={{ textAlign: 'left', padding: '24px', position: 'sticky', top: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="passage-header">
                            <span className="passage-label">📄 Reading Passage</span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '15px', color: '#334155', marginTop: '12px' }}>
                            {passages[currentPassageIndex]?.passage}
                        </div>
                    </div>

                    {/* KHU VỰC PHẢI: TOÀN BỘ CÂU HỎI ĐI KÈM CỦA ĐOẠN VĂN ĐÓ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="card review-main-card" style={{ textAlign: 'left', padding: '24px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '12px', fontSize: '14.5px' }}>QUESTIONS IN THIS BLOCK:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                {activeQuestions.map((q, idx) => (
                                    <span 
                                        key={q.id}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`question-grid-item clickable ${currentQuestionIndex === idx ? 'active-q' : ''} ${userAnswers[q.id] ? 'answered' : ''}`}
                                        style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Q{idx + 1}
                                    </span>
                                ))}
                            </div>

                            {/* Duyệt hiển thị toàn bộ câu hỏi đổ dọc của đoạn văn */}
                            {activeQuestions.map((q, index) => {
                                const result = checkedQuestions[q.id];
                                const isSelected = !!userAnswers[q.id];
                                const optionsList = getQuestionOptions(q);

                                return (
                                    <div key={q.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 700, color: '#2196b0', marginBottom: '6px' }}>Question {index + 1}</div>
                                        <div style={{ marginBottom: '12px', fontWeight: 500, color: '#1e293b' }}>{q.content}</div>

                                        {/* OPTIONS LỰA CHỌN A, B, C, D */}
                                        <div className="review-options">
                                            {optionsList.map((item, idx) => {
                                                const letter = item.letter || ['A', 'B', 'C', 'D'][idx];
                                                const text = item.text || item;
                                                const isCurrentPicked = userAnswers[q.id] === letter;
                                                
                                                let optionClass = "";
                                                if (result && result.correct_answer === letter) optionClass = "opt-correct";
                                                else if (result && isCurrentPicked && !result.is_correct) optionClass = "opt-wrong";

                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={!!result}
                                                        className={`choice ${isCurrentPicked ? 'selected' : ''} ${optionClass}`}
                                                        onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: letter }))}
                                                    >
                                                        <span className="choice-letter">{letter}</span>
                                                        {text}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* CHECK TRẠNG THÁI ĐÚNG SAI TỪNG CÂU */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>Chọn đáp án và bấm Check.</span>
                                            {!result ? (
                                                <button
                                                    onClick={() => handleCheckAnswer(q.id)}
                                                    disabled={!isSelected}
                                                    className="check-single-answer-btn"
                                                    style={{ padding: '6px 12px', background: isSelected ? '#2196b0' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
                                                >
                                                    Check Answer
                                                </button>
                                            ) : (
                                                <div className={`answer-feedback-box ${result.is_correct ? 'correct' : 'incorrect'}`} style={{ width: '100%', marginTop: '8px', padding: '12px', borderRadius: '8px' }}>
                                                    <div className="feedback-header">
                                                        <span>{result.is_correct ? '🎉 Đúng rồi! +10 XP' : `❌ Sai rồi! Đáp án: ${result.correct_answer}`}</span>
                                                    </div>
                                                    {result.explanation && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>💡 {result.explanation}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                /* ⌨️ BỐ CỤC THIẾT KẾ CHO PART 5 (MỖI LẦN HIỂN THỊ DUY NYẾT 1 CÂU - HÌNH 2) */
                <div className="card review-main-card" style={{ textAlign: 'left', padding: '24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {activeQuestions.map((q, idx) => (
                            <span 
                                key={q.id}
                                className={`question-grid-item ${currentQuestionIndex === idx ? 'active-q' : ''} ${checkedQuestions[q.id] ? 'answered' : ''}`}
                                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}
                            >
                                Q{idx + 1}
                            </span>
                        ))}
                    </div>

                    {currentQuestion ? (
                        <div>
                            <div style={{ fontWeight: 700, color: '#2196b0', fontSize: '16px', marginBottom: '6px' }}>Question {currentQuestionIndex + 1}</div>
                            <div style={{ fontSize: '16px', color: '#1e293b', marginBottom: '14px', fontWeight: 600 }}>{currentQuestion.content}</div>

                            {/* Ô nhập Textarea điền từ */}
                            <textarea
                                className="form-textarea"
                                rows={2}
                                value={userAnswers[currentQuestion.id] || ''}
                                placeholder="Enter your answer..."
                                disabled={!!checkedQuestions[currentQuestion.id]}
                                onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '14px' }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>Nhập đáp án và bấm Check Answer để chấm điểm câu này.</span>
                                {!checkedQuestions[currentQuestion.id] ? (
                                    <button
                                        onClick={() => handleCheckAnswer(currentQuestion.id)}
                                        disabled={!userAnswers[currentQuestion.id]}
                                        className="check-single-answer-btn"
                                        style={{ padding: '8px 16px', background: userAnswers[currentQuestion.id] ? '#2196b0' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
                                    >
                                        Check Answer
                                    </button>
                                ) : (
                                    <div className={`answer-feedback-box ${checkedQuestions[currentQuestion.id].is_correct ? 'correct' : 'incorrect'}`} style={{ width: '100%', padding: '14px', borderRadius: '8px' }}>
                                        <div className="feedback-header">
                                            <strong>{checkedQuestions[currentQuestion.id].is_correct ? '🎉 Khớp đáp án! +10 XP' : `❌ Chưa chính xác! Đáp án đúng: ${checkedQuestions[currentQuestion.id].correct_answer}`}</strong>
                                        </div>
                                        {checkedQuestions[currentQuestion.id].explanation && (
                                            <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#475569' }}>💡 {checkedQuestions[currentQuestion.id].explanation}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">No questions found.</div>
                    )}
                </div>
            )}

            {/* CARD 3: TÍCH HỢP HỆ THỐNG AI TUTOR ASSIST (MẪU CHUẨN ĐỒNG BỘ) */}
            <div className="card review-main-card" style={{ padding: '24px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '22px' }}>🤖</span>
                    <div>
                        <div className="practice-ai-title" style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Penwin AI Assist</div>
                        <div className="practice-ai-sub" style={{ fontSize: '12.5px', color: '#64748b' }}>Giải thích ngữ pháp hoặc dịch câu tức thì tại đây nhé Ngân!</div>
                    </div>
                </div>

                <div className="practice-ai-thread" style={{ maxHeight: '160px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {aiMessages.length === 0 ? (
                        <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>Chọn phím tắt nhanh bên dưới để trao đổi với AI.</div>
                    ) : (
                        aiMessages.map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                                <div style={{ background: m.sender === 'user' ? '#e0f2fe' : '#fff', color: '#1e293b', border: m.sender === 'ai' ? '1px solid #e2e8f0' : 'none', padding: '8px 12px', borderRadius: '12px', fontSize: '13.5px', maxWidth: '85%' }}>
                                    {m.text}
                                </div>
                            </div>
                        ))
                    )}
                    {aiLoading && <div style={{ fontSize: '13px', color: '#94a3b8' }}>🐾 Penwin AI đang biên soạn lời giải...</div>}
                </div>

                <div className="practice-ai-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    <button className="practice-ai-chip" onClick={() => handleSendAiMessage('Giải thích chi tiết cấu trúc ngữ pháp và quy tắc câu này.')}>💡 Phân tích ngữ pháp</button>
                    <button className="practice-ai-chip" onClick={() => handleSendAiMessage('Dịch giúp mình toàn bộ nội dung câu hỏi/bài đọc này sang tiếng Việt.')}>🇻🇳 Dịch nghĩa câu</button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <textarea
                        className="practice-ai-input"
                        placeholder="Nhập câu hỏi cho AI..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAiMessage(); } }}
                        style={{ flex: 1, height: '42px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', resize: 'none' }}
                    />
                    <button className="btn btn-primary" style={{ height: '42px', background: '#475569', border: 'none', padding: '0 16px', margin: 0 }} onClick={() => handleSendAiMessage()} disabled={aiLoading || !aiInput.trim()}>Ask AI</button>
                </div>
            </div>

            {/* DI CHUYỂN CHUYỂN KHỐI / TIẾP TỤC CÂU (FOOTER CHUẨN CHỈ) */}
            <div className="review-actions-row">
                <button 
                    className="btn btn-primary" 
                    style={{ background: '#2196b0', border: 'none' }} 
                    onClick={handleNextStep}
                    disabled={selectedPart === 5 ? !checkedQuestions[currentQuestion?.id] : false}
                >
                    {selectedPart === 5 
                        ? (currentQuestionIndex + 1 === activeQuestions.length ? 'Finish Practice 🏁' : 'Next Question ▶') 
                        : 'Next Block / Passage ▶'
                    }
                </button>
                <button className="btn btn-ghost" onClick={() => setIsStarted(false)}>Đổi loại luyện tập</button>
            </div>
        </div>
    );
}
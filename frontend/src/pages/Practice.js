import React, { useState, useEffect, useRef } from 'react';
import { questionApi } from '../api/client'; // 🌟 Sửa đúng import ngoặc nhọn để không lỗi build Vercel
import './Practice.css';

export default function Practice() {
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
            // Gọi hàm từ đối tượng questionApi chuẩn của bạn
            const response = await questionApi.startPractice(
                'reading',
                parseInt(questionCount),
                parseInt(selectedPart)
            );
            
            if (response && response.passages && response.passages.length > 0) {
                setPassages(response.passages);
                setQuestions([]);
                setCurrentPassageIndex(0);
            } else {
                setQuestions((response && response.questions) || []);
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

        const newUserMessage = { sender: 'user', text: msg };
        setAiMessages(prev => [...prev, newUserMessage]);
        if (!textToSend) setAiInput('');
        setAiLoading(true);

        try {
            // Kết nối endpoint AI nếu cần, tạm thời tạo luồng phản hồi mẫu
            setTimeout(() => {
                setAiMessages(prev => [...prev, { sender: 'ai', text: 'Penwin AI Assist đã nhận được câu hỏi từ bạn! 🐾' }]);
                setAiLoading(false);
            }, 1000);
        } catch (err) {
            setAiLoading(false);
        }
    };

    // MÀN HÌNH SETUP - GIỮ NGUYÊN GIAO DIỆN GỐC CỦA BẠN
    if (!isStarted) {
        return (
            <div className="practice-page fade-up">
                <div className="practice-header-card card">
                    <div>
                        <div className="section-title">TOEIC Reading Practice</div>
                        <p className="section-subtitle">Chọn phần bài thi và số câu hỏi để bắt đầu luyện cùng phong cách màu sắc đồng bộ.</p>
                    </div>
                    <span className="badge badge-blue">Ready to practice</span>
                </div>

                <div className="practice-form-card card">
                    <label className="form-label">TOEIC Reading Part</label>
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

                    <div className="slider-container">
                        <label className="form-label">
                            QUESTION COUNT: <span className="count-highlight">{questionCount}</span>
                        </label>
                        <input 
                            type="range" min="5" max="30" step="5" value={questionCount} 
                            onChange={(e) => setQuestionCount(e.target.value)}
                            className="question-slider"
                        />
                    </div>

                    {error && <p className="error-text">❌ {error}</p>}

                    <button 
                        onClick={handleStartPractice} disabled={loading}
                        className="btn btn-primary start-practice-btn"
                    >
                        {loading ? 'Loading Questions...' : `▶ Start ${questionCount} questions - Part ${selectedPart}`}
                    </button>
                </div>
            </div>
        );
    }

    const activeQuestions = passages.length > 0 ? (passages[currentPassageIndex]?.questions || []) : questions;

    // MÀN HÌNH LÀM BÀI - GIỮ NGUYÊN HOÀN TOÀN CARD, ICON VÀ MÀU SẮC BAN ĐẦU CỦA BẠN
    return (
        <div className="practice-page practice-screen-layout fade-up">
            
            {/* KHU VỰC ĐỀ THI */}
            <div className="questions-column">
                
                {/* Nếu làm Part 6/7 thì hiển thị bài đọc */}
                {passages.length > 0 && passages[currentPassageIndex] && (
                    <div className="passage-display-box">
                        <h4>Passage</h4>
                        <div className="passage-text-content">
                            {passages[currentPassageIndex].passage}
                        </div>
                    </div>
                )}

                <div className="practice-questions-container">
                    <img src="https://cdn-icons-png.flaticon.com/512/3593/3593444.png" alt="Penwin Logo" className="practice-main-logo" style={{ width: '120px', height: '120px', display: 'block', margin: '0 auto 16px auto' }} />
                    
                    <div className="questions-grid-header">Questions in this passage</div>
                    <div className="questions-grid-row">
                        {activeQuestions.map((q, idx) => (
                            <span key={q.id} className={`question-grid-item ${userAnswers[q.id] ? 'answered' : ''} ${checkedQuestions[q.id] ? 'checked' : ''}`}>
                                Q{idx + 1}
                            </span>
                        ))}
                    </div>
                    <span className="part6-hint-text">For Part 6, click blanks like (1), (2), (3) in the passage to jump to the question.</span>

                    {/* VÒNG LẶP CÂU HỎI */}
                    {activeQuestions.map((q, index) => {
                        const result = checkedQuestions[q.id];

                        return (
                            <div key={q.id} className="single-question-block">
                                <div className="question-title">Question {index + 1}</div>
                                <div className="question-text">{q.content}</div>

                                {/* DANH SÁCH ĐÁP ÁN GỐC - CHỈ THÊM MARGIN-RIGHT CHỐNG DÍNH CHỮ */}
                                <div className="options-container">
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        const optionText = q[`option_${opt.toLowerCase()}`] || q[opt];
                                        if (!optionText) return null;

                                        return (
                                            <button 
                                                key={opt}
                                                disabled={!!result}
                                                className={`option-selection-btn ${userAnswers[q.id] === opt ? 'selected' : ''}`}
                                                onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                            >
                                                <strong style={{ marginRight: '6px' }}>{opt}</strong> {optionText}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="answer-action-row">
                                    <span className="please-choose-label">Please choose an answer.</span>
                                    {!result ? (
                                        <button 
                                            onClick={() => handleSubmitAnswer(q.id)}
                                            disabled={!userAnswers[q.id]}
                                            className="check-single-answer-btn"
                                        >
                                            Check Answer
                                        </button>
                                    ) : (
                                        <div className={`answer-feedback-box ${result.is_correct ? 'correct' : 'incorrect'}`}>
                                            <span>{result.is_correct ? '✅ Đúng rồi!' : `❌ Sai rồi! Đáp án đúng là: ${result.correct_answer}`}</span>
                                            {result.explanation && <p className="explanation-paragraph">💡 {result.explanation}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* NÚT ĐIỀU HƯỚNG ĐOẠN VĂN GỐC */}
                    {passages.length > 0 && (
                        <div className="passage-navigation-bar">
                            <button className="btn btn-secondary btn-sm" disabled={currentPassageIndex === 0} onClick={() => setCurrentPassageIndex(p => p - 1)}>◀ Previous Passage</button>
                            <span>Passage {currentPassageIndex + 1} / {passages.length}</span>
                            <button className="btn btn-secondary btn-sm" disabled={currentPassageIndex === passages.length - 1} onClick={() => setCurrentPassageIndex(p => p + 1)}>Next Passage ▶</button>
                        </div>
                    )}

                    <div className="practice-footer-actions">
                        <button className="btn btn-primary footer-action-submit-btn">Check Answer</button>
                        <button className="btn btn-secondary footer-action-stop-btn" onClick={() => setIsStarted(false)}>Stop</button>
                    </div>
                </div>
            </div>

            {/* KHU VỰC AI ASSIST CHUẨN LÊN THEO FILE CSS CỦA BẠN */}
            <div className="ai-assist-column">
                <div className="practice-ai-assist">
                    <div className="practice-ai-head">
                        <div>
                            <div className="practice-ai-title">🤖 Penwin AI Assist</div>
                            <div className="practice-ai-sub">Hỏi AI về từ vựng hoặc ngữ cảnh bài làm này nhé!</div>
                        </div>
                        <div className="practice-ai-context">Part {selectedPart}</div>
                    </div>

                    <div className="practice-ai-thread">
                        {aiMessages.length === 0 ? (
                            <div className="practice-ai-empty">Chưa có câu hỏi nào. Chọn gợi ý nhanh hoặc nhập tin nhắn dưới đây để trò chuyện!</div>
                        ) : (
                            aiMessages.map((m, i) => (
                                <div key={i} className={`practice-ai-msg ${m.sender}`}>
                                    <div className="practice-ai-bubble">{m.text}</div>
                                </div>
                            ))
                        )}
                        {aiLoading && (
                            <div className="practice-ai-msg ai"><div className="practice-ai-bubble" style={{ color: '#94a3b8' }}>Penwin AI đang soạn câu trả lời... 🐾</div></div>
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
                        <button className="btn btn-primary practice-ai-send" onClick={() => handleSendAiMessage()} disabled={aiLoading || !aiInput.trim()}>Ask AI</button>
                    </div>
                </div>
            </div>

        </div>
    );
}
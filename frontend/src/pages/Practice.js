import React, { useState, useEffect, useRef } from 'react';
import { questionApi } from '../api/client';
import IMG_GRAMMAR_ICON from '../../../iconapp/gammaravt.png';
import IMG_TESTTIME_ICON from '../../../iconapp/testtime.png';
import IMG_VOCAB_ICON from '../../../iconapp/vocabavt.png';
import IMG_PENWIN_ICON from '../../../iconapp/avt.png';
import IMG_AI_ICON from '../../../iconapp/AItutoravt.png';
import IMG_CORRECT_ICON from '../../../iconapp/usercorrect.png';
import IMG_INCORRECT_ICON from '../../../iconapp/userincorrect.png';
import './Practice.css';

export default function Practice() {
    const [selectedPart, setSelectedPart] = useState(5);
    const [questionCount, setQuestionCount] = useState(10);
    const [isStarted, setIsStarted] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [passages, setPassages] = useState([]);
    const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [checkedQuestions, setCheckedQuestions] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const threadEndRef = useRef(null);

    useEffect(() => {
        if (threadEndRef.current) {
            threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiMessages]);

    // Parse options từ nhiều format backend có thể trả về
    const parseOptions = (question) => {
        if (!question) return {};
        if (typeof question.options === 'string') {
            try { return JSON.parse(question.options); } catch { return {}; }
        }
        if (typeof question.options === 'object' && question.options !== null) {
            return question.options;
        }
        return {};
    };

    const handleStartPractice = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await questionApi.startPractice(
                'reading', parseInt(questionCount), parseInt(selectedPart)
            );
            if (response?.passages?.length > 0) {
                setPassages(response.passages);
                setQuestions([]);
                setCurrentPassageIndex(0);
            } else {
                setQuestions(response?.questions || []);
                setPassages([]);
            }
            setIsStarted(true);
            setAiMessages([]);
            setUserAnswers({});
            setCheckedQuestions({});
            setCurrentQuestionIndex(0);
        } catch (err) {
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
            setCheckedQuestions(prev => ({ ...prev, [questionId]: response }));
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
            const res = await questionApi.askAI
                ? await questionApi.askAI(msg, context)
                : null;
            setTimeout(() => {
                setAiMessages(prev => [...prev, {
                    sender: 'ai',
                    text: res?.answer || 'Penwin AI Assist đã nhận được câu hỏi! 🐾'
                }]);
                setAiLoading(false);
            }, 800);
        } catch {
            setAiLoading(false);
        }
    };

    const activeQuestions = passages.length > 0
        ? (passages[currentPassageIndex]?.questions || [])
        : questions;
    const currentQuestion = activeQuestions[currentQuestionIndex];

    // ── SETUP SCREEN ──
    if (!isStarted) {
        return (
            <div className="practice-page fade-up">
                <div className="practice-header-card card">
                    <div>
                        <div className="section-title">TOEIC Reading Practice</div>
                        <p className="section-subtitle">Chọn phần bài thi và số câu hỏi để bắt đầu luyện tập.</p>
                    </div>
                    <span className="badge badge-blue">Ready to practice</span>
                </div>

                <div className="practice-form-card card">
                    <label className="form-label">TOEIC Reading Part</label>
                    <div className="part-picker">
                        {[
                            { part: 5, icon: IMG_GRAMMAR_ICON, label: 'Part 5', sub: 'Incomplete Sentences' },
                            { part: 6, icon: IMG_TESTTIME_ICON, label: 'Part 6', sub: 'Text Completion' },
                            { part: 7, icon: IMG_VOCAB_ICON, label: 'Part 7', sub: 'Reading Comprehension' },
                        ].map(({ part, icon, label, sub }) => (
                            <button
                                key={part}
                                className={`part-pick-btn ${selectedPart === part ? 'active' : ''}`}
                                onClick={() => setSelectedPart(part)}
                            >
                                <img src={icon} alt={label} />
                                <span>{label}</span>
                                <span className="part-pick-sub">{sub}</span>
                            </button>
                        ))}
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

                    <button onClick={handleStartPractice} disabled={loading} className="btn btn-primary start-practice-btn">
                        {loading ? 'Loading Questions...' : `▶ Start ${questionCount} questions - Part ${selectedPart}`}
                    </button>
                </div>
            </div>
        );
    }

    // ── PRACTICE SCREEN ──
    return (
        <div className="practice-page practice-screen-layout fade-up">

            {/* CỘT ĐỀ THI */}
            <div className="questions-column">

                {/* PASSAGE (Part 6/7) */}
                {passages.length > 0 && passages[currentPassageIndex] && (
                    <div className="passage-display-box">
                        <div className="passage-header">
                            <span className="passage-label">📄 Passage {currentPassageIndex + 1} / {passages.length}</span>
                        </div>
                        <div className="passage-text-content">
                            {passages[currentPassageIndex].passage}
                        </div>
                        {/* Điều hướng passage */}
                        <div className="passage-navigation-bar">
                            <button className="btn btn-secondary btn-sm"
                                disabled={currentPassageIndex === 0}
                                onClick={() => { setCurrentPassageIndex(p => p - 1); setCurrentQuestionIndex(0); }}>
                                ◀ Prev Passage
                            </button>
                            <button className="btn btn-secondary btn-sm"
                                disabled={currentPassageIndex === passages.length - 1}
                                onClick={() => { setCurrentPassageIndex(p => p + 1); setCurrentQuestionIndex(0); }}>
                                Next Passage ▶
                            </button>
                        </div>
                    </div>
                )}

                {/* KHUNG CÂU HỎI */}
                <div className="practice-questions-container">

                    <img src={IMG_PENWIN_ICON} alt="Penwin" className="practice-main-logo" />

                    {/* Grid câu hỏi */}
                    <div className="questions-grid-header">Questions in this passage</div>
                    <div className="questions-grid-row">
                        {activeQuestions.map((q, idx) => (
                            <span
                                key={q.id}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`question-grid-item clickable
                                    ${currentQuestionIndex === idx ? 'active-q' : ''}
                                    ${userAnswers[q.id] ? 'answered' : ''}
                                    ${checkedQuestions[q.id] ? 'checked' : ''}`}
                            >
                                Q{idx + 1}
                            </span>
                        ))}
                    </div>

                    <div className="step-hint">Hoàn thành câu hiện tại trước khi chuyển sang câu tiếp theo. Làm đúng +10xp.</div>

                    {/* CARD CÂU HỎI */}
                    <div className="practice-question-card">
                        <div className="question-progress">
                            <span>Câu {currentQuestionIndex + 1} / {activeQuestions.length}</span>
                            <span>{checkedQuestions[currentQuestion?.id] ? '✅ Hoàn thành' : '⏳ Chưa xong'}</span>
                        </div>

                        {currentQuestion ? (
                            <>
                                <div className="question-title">Question {currentQuestionIndex + 1}</div>
                                <div className="question-text">{currentQuestion.content}</div>

                                {/* OPTIONS */}
                                <div className="options-container">
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        const parsed = parseOptions(currentQuestion);
                                        const optionText =
                                            parsed[opt] ||
                                            parsed[opt.toLowerCase()] ||
                                            currentQuestion[`option_${opt.toLowerCase()}`] ||
                                            currentQuestion[opt];
                                        if (!optionText) return null;

                                        const isSelected = userAnswers[currentQuestion.id] === opt;
                                        const result = checkedQuestions[currentQuestion.id];
                                        const isCorrectOpt = result && result.correct_answer === opt;
                                        const isWrongOpt = result && isSelected && !result.is_correct;

                                        return (
                                            <button
                                                key={opt}
                                                disabled={!!result}
                                                onClick={() => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }))}
                                                className={`option-selection-btn
                                                    ${isSelected ? 'selected' : ''}
                                                    ${isCorrectOpt ? 'opt-correct' : ''}
                                                    ${isWrongOpt ? 'opt-wrong' : ''}`}
                                            >
                                                <strong style={{ marginRight: 6 }}>{opt}</strong> {optionText}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* FEEDBACK */}
                                <div className="answer-action-row">
                                    {!checkedQuestions[currentQuestion.id] ? (
                                        <>
                                            <span className="please-choose-label">Chọn đáp án và bấm Check.</span>
                                            <button
                                                onClick={() => handleSubmitAnswer(currentQuestion.id)}
                                                disabled={!userAnswers[currentQuestion.id]}
                                                className="check-single-answer-btn"
                                            >
                                                Check Answer
                                            </button>
                                        </>
                                    ) : (
                                        <div className={`answer-feedback-box ${checkedQuestions[currentQuestion.id].is_correct ? 'correct' : 'incorrect'}`}>
                                            <div className="feedback-header">
                                                <img
                                                    src={checkedQuestions[currentQuestion.id].is_correct ? IMG_CORRECT_ICON : IMG_INCORRECT_ICON}
                                                    alt="result"
                                                    className="feedback-icon"
                                                />
                                                <span>
                                                    {checkedQuestions[currentQuestion.id].is_correct
                                                        ? 'Đúng rồi! +10 XP 🎉'
                                                        : `Sai rồi! Đáp án đúng: ${checkedQuestions[currentQuestion.id].correct_answer}`}
                                                </span>
                                            </div>
                                            {checkedQuestions[currentQuestion.id].explanation && (
                                                <p className="explanation-paragraph">
                                                    💡 {checkedQuestions[currentQuestion.id].explanation}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">Không tìm thấy câu hỏi. Vui lòng thử lại.</div>
                        )}
                    </div>

                    {/* FOOTER NAV */}
                    <div className="practice-footer-actions">
                        <button className="btn btn-secondary btn-sm"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(i => Math.max(i - 1, 0))}>
                            ◀ Prev
                        </button>
                        <button className="btn btn-primary footer-action-submit-btn"
                            disabled={!currentQuestion || !checkedQuestions[currentQuestion.id] || currentQuestionIndex === activeQuestions.length - 1}
                            onClick={() => setCurrentQuestionIndex(i => Math.min(i + 1, activeQuestions.length - 1))}>
                            Next ▶
                        </button>
                        <button className="btn btn-secondary footer-action-stop-btn"
                            onClick={() => setIsStarted(false)}>
                            Stop
                        </button>
                    </div>
                </div>
            </div>

            {/* CỘT AI ASSIST */}
            <div className="ai-assist-column">
                <div className="practice-ai-assist">
                    <div className="practice-ai-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={IMG_AI_ICON} alt="AI" className="ai-head-icon" />
                            <div>
                                <div className="practice-ai-title">Penwin AI Assist</div>
                                <div className="practice-ai-sub">Hỏi AI về từ vựng hoặc ngữ cảnh bài làm!</div>
                            </div>
                        </div>
                        <div className="practice-ai-context">Part {selectedPart}</div>
                    </div>

                    <div className="practice-ai-thread">
                        {aiMessages.length === 0 ? (
                            <div className="practice-ai-empty">Chọn gợi ý nhanh hoặc nhập câu hỏi bên dưới!</div>
                        ) : (
                            aiMessages.map((m, i) => (
                                <div key={i} className={`practice-ai-msg ${m.sender}`}>
                                    {m.sender === 'ai' && (
                                        <img src={IMG_AI_ICON} alt="AI" className="ai-bubble-icon" />
                                    )}
                                    <div className="practice-ai-bubble">{m.text}</div>
                                </div>
                            ))
                        )}
                        {aiLoading && (
                            <div className="practice-ai-msg ai">
                                <img src={IMG_AI_ICON} alt="AI" className="ai-bubble-icon" />
                                <div className="practice-ai-bubble" style={{ color: '#94a3b8' }}>
                                    Đang soạn câu trả lời... 🐾
                                </div>
                            </div>
                        )}
                        <div ref={threadEndRef} />
                    </div>

                    <div className="practice-ai-chips">
                        {currentQuestion && (
                            <button className="practice-ai-chip"
                                onClick={() => handleSendAiMessage(`"${currentQuestion.content}" nghĩa là gì?`)}>
                                ❓ Nghĩa từ này
                            </button>
                        )}
                        <button className="practice-ai-chip"
                            onClick={() => handleSendAiMessage('Giải thích cấu trúc ngữ pháp câu hỏi này.')}>
                            💡 Giải thích cấu trúc
                        </button>
                        <button className="practice-ai-chip"
                            onClick={() => handleSendAiMessage('Dịch câu hỏi/đoạn văn này sang tiếng Việt.')}>
                            🇻🇳 Dịch câu này
                        </button>
                        <button className="practice-ai-chip"
                            onClick={() => handleSendAiMessage('Chỉ ra các từ vựng khó trong bài này.')}>
                            📚 Từ vựng khó
                        </button>
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
                        <button className="btn btn-primary practice-ai-send"
                            onClick={() => handleSendAiMessage()}
                            disabled={aiLoading || !aiInput.trim()}>
                            Ask AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
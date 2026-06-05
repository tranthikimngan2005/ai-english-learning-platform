import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatApi, questionApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { IMG_VOCAB, IMG_PROGRESS, IMG_HERO } from '../assets/images';
import QuestionCard from '../components/QuestionCard';
import './Practice.css';

const SKILL_IMGS = { reading: IMG_VOCAB };
const TOEIC_PARTS = [
  { value: 5, label: 'Part 5', sub: 'Incomplete Sentences' },
  { value: 6, label: 'Part 6', sub: 'Text Completion' },
  { value: 7, label: 'Part 7', sub: 'Reading Comprehension' },
];

const normalizeAnswer = (v) => String(v ?? '').trim().toLowerCase();
const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };

const PRACTICE_AI_STATIC_PROMPTS = [
  'giải thích câu này ngắn gọn',
  'dịch sang tiếng Việt',
  'chỉ ra từ vựng khó',
];

const PRACTICE_AI_SYSTEM_PROMPT = `You are Pengwin AI inside a TOEIC practice screen. Help the learner understand the current question, passage, or vocabulary.`;

function resolveCorrectAnswer(question, rawAnswer) {
  const ans = String(rawAnswer ?? '').trim();
  const idx = letterToIndex[ans.toUpperCase()];
  if (Number.isInteger(idx) && Array.isArray(question?.options) && question.options[idx] != null) {
    return question.options[idx];
  }
  return ans;
}

function parseQuestionNumber(question, fallback) {
  const direct = Number(question?.question_number);
  if (Number.isInteger(direct) && direct > 0) return direct;
  const text = String(question?.question_text || question?.content || '');
  const bracketMatch = text.match(/\((\d+)\)/);
  if (bracketMatch) return Number(bracketMatch[1]);
  const leadingMatch = text.match(/^\s*(\d+)\s*[.)-]?\s*/);
  if (leadingMatch) return Number(leadingMatch[1]);
  return fallback + 1;
}

function buildPassageGroups(items) {
  const grouped = new Map();
  items.forEach((item, idx) => {
    const normalizedPassage = String(item?.passage || '').trim();
    const key = item?.passage_id || item?.passage_group_id || item?.question_group_id || (normalizedPassage ? `passage:${normalizedPassage}` : `single:${item?.id || idx}`);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  });
  return Array.from(grouped.entries()).map(([key, questions]) => {
    const sorted = questions.slice().sort((a, b) => parseQuestionNumber(a, 0) - parseQuestionNumber(b, 0) || Number(a?.id || 0) - Number(b?.id || 0))
      .map((question, qIndex) => ({ ...question, _groupKey: String(key), _questionKey: question?.id ? `id-${question.id}` : `${key}-${qIndex}`, _questionNo: parseQuestionNumber(question, qIndex) }));
    return { key: String(key), passage: sorted.find((q) => q?.passage)?.passage || '', part: Number(sorted[0]?.part || 0), questions: sorted };
  }).sort((a, b) => (a.questions[0]?._questionNo || 0) - (b.questions[0]?._questionNo || 0));
}

export default function Practice() {
  const [params] = useSearchParams();
  const toast = useToast();

  const [step, setStep] = useState('config');
  const [skill] = useState('reading');
  const [readingPart, setReadingPart] = useState(Number(params.get('part')) || 5);
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupIdx, setGroupIdx] = useState(0);
  const [groupAnswers, setGroupAnswers] = useState({});
  const [groupResults, setGroupResults] = useState({});
  const [checkedGroupKeys, setCheckedGroupKeys] = useState({});
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- TÍCH HỢP AI: STATE ---
  const [aiHelpMessages, setAiHelpMessages] = useState([]);
  const [aiHelpInput, setAiHelpInput] = useState('');
  const [aiHelpLoading, setAiHelpLoading] = useState(false);
  const aiHelpBottomRef = useRef(null);

  const questionListRef = useRef(null);
  const questionNodeRefs = useRef({});

  // --- TÍCH HỢP AI: HÀM XỬ LÝ ---
  const handleAiSubmit = async (prompt) => {
    const text = prompt || aiHelpInput;
    if (!text.trim() || aiHelpLoading) return;
    setAiHelpLoading(true);
    setAiHelpMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);
    try {
      const aiRes = await chatApi.generate(text, PRACTICE_AI_SYSTEM_PROMPT);
      setAiHelpMessages(prev => [...prev, aiRes]);
    } catch (e) { toast('Lỗi khi hỏi AI', 'error'); }
    finally { setAiHelpLoading(false); if (!prompt) setAiHelpInput(''); }
  };

  const renderAiBox = () => (
    <div className="practice-ai-box">
      <div className="practice-ai-header">
        <h3>AI hỏi nhanh ngay trong bài</h3>
        <p>Hỏi nghĩa từ, dịch câu, hoặc nhờ giải thích ngữ cảnh mà không cần rời khỏi Practice.</p>
      </div>
      <div className="practice-ai-chips">
        {PRACTICE_AI_STATIC_PROMPTS.map(p => <button key={p} className="chip" onClick={() => handleAiSubmit(p)}>{p}</button>)}
      </div>
      <div className="practice-ai-thread">
        {aiHelpMessages.map((m, i) => <div key={i} className={m.role}>{m.content}</div>)}
        <div ref={aiHelpBottomRef} />
      </div>
      <textarea value={aiHelpInput} onChange={e => setAiHelpInput(e.target.value)} placeholder="Nhập câu hỏi cho AI về từ/câu bạn đang làm..." />
      <button onClick={() => handleAiSubmit()} disabled={aiHelpLoading}>{aiHelpLoading ? '...' : 'Ask AI'}</button>
    </div>
  );

  const markPracticeFinished = useCallback(() => {
    const stamp = String(Date.now());
    localStorage.setItem('pengwin_last_practice_completed_at', stamp);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('pengwin:practice-finished'));
  }, []);

  useEffect(() => {
    if (![5, 6, 7].includes(Number(readingPart))) setReadingPart(5);
  }, [readingPart]);

  const isGroupMode = Number(readingPart) === 6 || Number(readingPart) === 7;
  const currentGroup = groups[groupIdx] || null;
  const currentGroupQuestions = currentGroup?.questions || [];
  const activeMetaQuestion = isGroupMode ? currentGroupQuestions[0] : questions[idx];

  const allGroupAnswered = useMemo(() => {
    if (!isGroupMode || !currentGroupQuestions.length) return false;
    return currentGroupQuestions.every((q) => normalizeAnswer(groupAnswers[q._questionKey]).length > 0);
  }, [isGroupMode, currentGroupQuestions, groupAnswers]);

  const currentGroupChecked = Boolean(currentGroup && checkedGroupKeys[currentGroup.key]);
  const groupCompletion = useMemo(() => {
    if (!isGroupMode || !groups.length) return { current: 0, total: 0 };
    return { current: groupIdx + 1, total: groups.length };
  }, [isGroupMode, groupIdx, groups.length]);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await questionApi.startPractice(skill, count, readingPart);
      setScore({ correct: 0, total: 0 }); setResult(null); setAnswer(''); setIdx(0);
      if (Number(readingPart) === 6 || Number(readingPart) === 7) {
        const grouped = buildPassageGroups(Array.isArray(data?.questions) ? data.questions : []);
        setGroups(grouped); setGroupIdx(0); setGroupAnswers({}); setGroupResults({}); setCheckedGroupKeys({}); setQuestions([]);
      } else {
        setQuestions((Array.isArray(data?.questions) ? data.questions : []).filter(q => Number(q?.part) === Number(readingPart)));
        setGroups([]);
      }
      setStep('playing');
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [skill, count, readingPart, toast]);

  const handleSingleSubmit = async () => {
    if (!answer.trim()) return toast('Please select or enter an answer.', 'error');
    const currentQ = questions[idx];
    if (!currentQ) return;
    setSubmitting(true);
    try {
      if (currentQ.id) {
        const res = await questionApi.submitAnswer(currentQ.id, answer);
        const normalizedCorrect = resolveCorrectAnswer(currentQ, res.correct_answer);
        const normalizedRes = { ...res, correct_answer: normalizedCorrect, is_correct: normalizeAnswer(answer) === normalizeAnswer(normalizedCorrect) };
        setResult(normalizedRes);
        setScore((s) => ({ correct: s.correct + (normalizedRes.is_correct ? 1 : 0), total: s.total + 1 }));
      }
    } catch (e) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleSingleNext = () => {
    if (idx + 1 >= questions.length) { markPracticeFinished(); setStep('done'); return; }
    setIdx((i) => i + 1); setAnswer(''); setResult(null);
  };

  const handleCheckGroup = () => {
    if (!currentGroup || currentGroupChecked || !allGroupAnswered) return;
    const resultByQuestion = {};
    let correctCount = 0;
    currentGroupQuestions.forEach((question) => {
      const selected = groupAnswers[question._questionKey] || '';
      const correctAnswer = resolveCorrectAnswer(question, question.correct_answer);
      const isCorrect = normalizeAnswer(selected) === normalizeAnswer(correctAnswer);
      resultByQuestion[question._questionKey] = { is_correct: isCorrect, correct_answer: correctAnswer, explanation: question.explanation || null };
      if (isCorrect) correctCount += 1;
    });
    setGroupResults((prev) => ({ ...prev, [currentGroup.key]: resultByQuestion }));
    setCheckedGroupKeys((prev) => ({ ...prev, [currentGroup.key]: true }));
    setScore((prev) => ({ correct: prev.correct + correctCount, total: prev.total + currentGroupQuestions.length }));
  };

  const handleNextGroup = () => {
    if (!groups.length) return;
    if (groupIdx + 1 >= groups.length) { markPracticeFinished(); setStep('done'); return; }
    setGroupIdx((i) => i + 1);
  };

  const scrollToQuestion = (questionNo) => {
    const target = currentGroupQuestions.find((q) => Number(q._questionNo) === Number(questionNo));
    if (target) questionNodeRefs.current[target._questionKey]?.scrollIntoView({ behavior: 'smooth' });
  };

  if (step === 'config') return (
    <div className="fade-up practice-config">
        <div className="page-header"><h1 className="page-title">▶ Practice</h1></div>
        <div className="card"><button className="btn btn-primary" onClick={startSession}>Bắt đầu</button></div>
    </div>
  );

  return (
    <div className="fade-up">
      {isGroupMode ? (
        <div className="practice-reading-layout">
          <div className="passage-card card">{currentGroup?.passage}</div>
          <div className="question-card card">
            {currentGroupQuestions.map(q => (
                <QuestionCard key={q._questionKey} ref={el => questionNodeRefs.current[q._questionKey] = el} question={q} 
                    selectedAnswer={groupAnswers[q._questionKey]} 
                    onSelectAnswer={(v) => setGroupAnswers({...groupAnswers, [q._questionKey]: v})}
                    showFeedback={checkedGroupKeys[currentGroup.key]}
                    result={groupResults[currentGroup?.key]?.[q._questionKey]}
                />
            ))}
            <button className="btn btn-primary" onClick={handleCheckGroup}>Check Answer</button>
            {renderAiBox()}
          </div>
        </div>
      ) : (
        <div className="question-card card">
          <p className="q-text">{questions[idx]?.content}</p>
          <button className="btn btn-primary" onClick={handleSingleSubmit}>Check</button>
          {renderAiBox()}
        </div>
      )}
    </div>
  );
}
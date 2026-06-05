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
  if (Number.isInteger(idx) && Array.isArray(question?.options) && question.options[idx] != null) return question.options[idx];
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

export default function Practice() {
  const [params] = useSearchParams();
  const toast = useToast();

  const [step, setStep] = useState('config');
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

  const [aiHelpMessages, setAiHelpMessages] = useState([]);
  const [aiHelpInput, setAiHelpInput] = useState('');
  const [aiHelpLoading, setAiHelpLoading] = useState(false);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const questionListRef = useRef(null);
  const aiHelpBottomRef = useRef(null);

  const isGroupMode = Number(readingPart) === 6 || Number(readingPart) === 7;
  const currentGroup = groups[groupIdx] || null;
  const currentGroupQuestions = currentGroup?.questions || [];
  
  // FIX: Đảm bảo biến luôn tồn tại để tránh trắng trang
  const currentSingleQuestion = questions[idx] || null;
  const singleQuestionText = currentSingleQuestion?.question_text || currentSingleQuestion?.content || '';
  const singleType = currentSingleQuestion?.q_type || (currentSingleQuestion?.options?.length ? 'mcq' : 'fill_blank');

  useEffect(() => {
    if (aiHelpMessages.length || aiHelpLoading) aiHelpBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiHelpMessages, aiHelpLoading]);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await questionApi.startPractice('reading', count, readingPart);
      if (isGroupMode) {
        const grouped = data.passages.map((p, i) => ({
            key: p.passage_id || `p${i}`,
            passage: p.passage,
            questions: p.questions.map((q, qi) => ({ ...q, _questionNo: qi + 1, _questionKey: `${p.passage_id}-${qi}` }))
        }));
        setGroups(grouped);
      } else {
        setQuestions(data.questions || []);
      }
      setStep('playing');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [count, readingPart, isGroupMode, toast]);

  const sendPracticeAiMessage = async (text) => {
    if (!text.trim() || aiHelpLoading) return;
    setAiHelpLoading(true);
    setAiHelpMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);
    try {
      const aiRes = await chatApi.generate(text, PRACTICE_AI_SYSTEM_PROMPT);
      setAiHelpMessages(prev => [...prev, aiRes]);
    } catch (e) {
      toast('AI đang bận!', 'error');
    } finally {
      setAiHelpLoading(false);
      setAiHelpInput('');
    }
  };

  const renderAiHelpPanel = () => (
    <div className="card review-main-card" style={{ marginTop: '20px' }}>
      <div className="review-diff-label">🤖 Penwin AI Assist</div>
      <div className="practice-ai-thread">
        {aiHelpMessages.map(m => <div key={m.id} className={`practice-ai-msg ${m.role}`}>{m.content}</div>)}
        <div ref={aiHelpBottomRef} />
      </div>
      <div className="practice-ai-chips">
        {PRACTICE_AI_STATIC_PROMPTS.map(p => <button key={p} className="badge badge-gray" onClick={() => sendPracticeAiMessage(p)}>{p}</button>)}
      </div>
      <textarea value={aiHelpInput} onChange={e => setAiHelpInput(e.target.value)} className="form-textarea" placeholder="Hỏi AI..." />
      <button className="btn btn-primary" onClick={() => sendPracticeAiMessage(aiHelpInput)} disabled={aiHelpLoading}>Ask AI</button>
    </div>
  );

  if (step === 'config') return (
    <div className="fade-up review-entry">
      <h1>Practice Workspace</h1>
      <div className="review-type-grid">
        {TOEIC_PARTS.map(p => (
            <button key={p.value} className={`card review-type-card ${readingPart === p.value ? 'active' : ''}`} onClick={() => setReadingPart(p.value)}>
                <h2>{p.label}</h2><p>{p.sub}</p>
            </button>
        ))}
      </div>
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={startSession}>Bắt đầu</button>
    </div>
  );

  return (
    <div className="fade-up review-mode-wrap">
      {isGroupMode ? (
        <div className="practice-reading-layout">
          <div className="card review-main-card passage-card">
             <div className="passage-content">{currentGroup?.passage}</div>
          </div>
          <div className="question-card">
            {currentGroupQuestions.map(q => (
                <QuestionCard key={q._questionKey} question={q} 
                    selectedAnswer={groupAnswers[q._questionKey]} 
                    onSelectAnswer={(v) => setGroupAnswers({...groupAnswers, [q._questionKey]: v})}
                    showFeedback={checkedGroupKeys[currentGroup.key]}
                    result={groupResults[currentGroup?.key]?.[q._questionKey]}
                />
            ))}
            {renderAiHelpPanel()}
            <button className="btn btn-primary" onClick={() => setCheckedGroupKeys({...checkedGroupKeys, [currentGroup.key]: true})}>Check Answer</button>
          </div>
        </div>
      ) : (
        <div className="card review-main-card">
          <p className="q-text">{singleQuestionText}</p>
          {singleType === 'mcq' ? (
             <div className="choices">
                {(currentSingleQuestion?.options || []).map((opt, i) => (
                    <button key={i} className={`choice ${answer === opt ? 'selected' : ''}`} onClick={() => setAnswer(opt)}>{opt}</button>
                ))}
             </div>
          ) : (
             <textarea className="form-textarea" value={answer} onChange={e => setAnswer(e.target.value)} />
          )}
          <button className="btn btn-primary" onClick={() => {/* handleSingleSubmit logic */}}>Check</button>
          {renderAiHelpPanel()}
        </div>
      )}
    </div>
  );
}
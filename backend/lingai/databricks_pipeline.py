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

const PRACTICE_AI_SYSTEM_PROMPT = `You are Pengwin AI inside a TOEIC practice screen.
Help the learner understand the current question, passage, or vocabulary.
If the user asks about a word or phrase, give the Vietnamese meaning first, then a short explanation and one simple example.
If the user asks to translate, translate clearly and concisely.
If the user asks for an explanation, keep the answer short, practical, and related to the current exercise.
If the user asks in Vietnamese, answer mainly in Vietnamese.
Do not drift into unrelated topics.`;

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
    const key =
      item?.passage_id ||
      item?.passage_group_id ||
      item?.question_group_id ||
      (normalizedPassage ? `passage:${normalizedPassage}` : `single:${item?.id || idx}`);

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(item);
  });

  return Array.from(grouped.entries())
    .map(([key, questions]) => {
      const sorted = questions
        .slice()
        .sort((a, b) => parseQuestionNumber(a, 0) - parseQuestionNumber(b, 0) || Number(a?.id || 0) - Number(b?.id || 0))
        .map((question, qIndex) => ({
          ...question,
          _groupKey: String(key),
          _questionKey: question?.id ? `id-${question.id}` : `${key}-${qIndex}`,
          _questionNo: parseQuestionNumber(question, qIndex),
        }));

      return {
        key: String(key),
        passage: sorted.find((q) => q?.passage)?.passage || '',
        part: Number(sorted[0]?.part || 0),
        questions: sorted,
      };
    })
    .sort((a, b) => (a.questions[0]?._questionNo || 0) - (b.questions[0]?._questionNo || 0));
}

function compactText(text, maxLength = 240) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function buildQuestionFocusPrompt(question) {
  const rawText = compactText(question?.question_text || question?.content || '', 120);
  if (!rawText) return 'từ/câu này nghĩa là gì?';

  const cleaned = rawText.replace(/[\s.?!,:;"'`~()[\]{}<>-]+/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length <= 6) {
    return `${cleaned} nghĩa là gì?`;
  }

  const firstChunk = words.slice(0, 6).join(' ');
  return `giải thích câu này: ${firstChunk}${words.length > 6 ? '...' : ''}`;
}

function buildPracticeAiContext({ isGroupMode, currentGroup, currentGroupQuestions, singleQuestion, answer }) {
  const pieces = [];

  if (isGroupMode) {
    if (currentGroup?.passage) {
      pieces.push(`Passage: ${compactText(currentGroup.passage, 420)}`);
    }

    if (currentGroupQuestions.length) {
      const questionSummary = currentGroupQuestions
        .map((question) => {
          const questionText = compactText(question?.question_text || question?.content || '', 180);
          const optionText = Array.isArray(question?.options) && question.options.length
            ? ` | Options: ${question.options.map((option) => compactText(option, 40)).join(' | ')}`
            : '';
          return `Q${question._questionNo}: ${questionText}${optionText}`;
        })
        .join('\n');
      pieces.push(`Questions:\n${questionSummary}`);
    }
  } else if (singleQuestion) {
    const questionText = compactText(singleQuestion.question_text || singleQuestion.content || '', 220);
    pieces.push(`Question: ${questionText}`);

    if (singleQuestion.passage) {
      pieces.push(`Passage: ${compactText(singleQuestion.passage, 420)}`);
    }

    if (Array.isArray(singleQuestion.options) && singleQuestion.options.length) {
      pieces.push(`Options: ${singleQuestion.options.map((option) => compactText(option, 60)).join(' | ')}`);
    }
  }

  if (answer?.trim()) {
    pieces.push(`Student draft/answer: ${compactText(answer, 160)}`);
  }

  return pieces.join('\n');
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
  const [aiHelpMessages, setAiHelpMessages] = useState([]);
  const [aiHelpInput, setAiHelpInput] = useState('');
  const [aiHelpLoading, setAiHelpLoading] = useState(false);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const questionListRef = useRef(null);
  const questionNodeRefs = useRef({});
  const aiHelpBottomRef = useRef(null);

  const markPracticeFinished = useCallback(() => {
    const stamp = String(Date.now());
    localStorage.setItem('pengwin_last_practice_completed_at', stamp);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pengwin:practice-finished'));
    }
  }, []);

  useEffect(() => {
    if (![5, 6, 7].includes(Number(readingPart))) {
      setReadingPart(5);
    }
  }, [readingPart]);

  const isGroupMode = Number(readingPart) === 6 || Number(readingPart) === 7;

  const currentGroup = groups[groupIdx] || null;
  const currentGroupQuestions = currentGroup?.questions || [];
  const activeMetaQuestion = isGroupMode ? currentGroupQuestions[0] : questions[idx];
  const currentSingleQuestion = questions[idx] || null;
  const activeAiQuestion = isGroupMode ? currentGroupQuestions[0] || null : currentSingleQuestion;

  const allGroupAnswered = useMemo(() => {
    if (!isGroupMode || !currentGroupQuestions.length) return false;
    return currentGroupQuestions.every((q) => normalizeAnswer(groupAnswers[q._questionKey]).length > 0);
  }, [isGroupMode, currentGroupQuestions, groupAnswers]);

  const currentGroupChecked = Boolean(currentGroup && checkedGroupKeys[currentGroup.key]);

  useEffect(() => {
    if (step !== 'playing') {
      setAiHelpMessages([]);
      setAiHelpInput('');
      return;
    }

    setAiHelpMessages([]);
    setAiHelpInput('');
  }, [step, idx, groupIdx, readingPart]);

  useEffect(() => {
    if (!aiHelpMessages.length && !aiHelpLoading) return;
    aiHelpBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [aiHelpMessages, aiHelpLoading]);

  const groupCompletion = useMemo(() => {
    if (!isGroupMode || !groups.length) return { current: 0, total: 0 };
    return { current: groupIdx + 1, total: groups.length };
  }, [isGroupMode, groupIdx, groups.length]);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await questionApi.startPractice(skill, count, readingPart);

      setScore({ correct: 0, total: 0 });
      setResult(null);
      setAnswer('');
      setIdx(0);

      if (Number(readingPart) === 6 || Number(readingPart) === 7) {
        const apiPassages = Array.isArray(data?.passages) ? data.passages : [];
        const groupedFromApi = apiPassages.map((passageObject, passageIndex) => {
          const questionsInPassage = Array.isArray(passageObject?.questions) ? passageObject.questions : [];
          const sorted = questionsInPassage
            .slice()
            .sort((a, b) => parseQuestionNumber(a, 0) - parseQuestionNumber(b, 0) || Number(a?.id || 0) - Number(b?.id || 0))
            .map((question, qIndex) => ({
              ...question,
              _groupKey: String(passageObject?.passage_id || `passage-${passageIndex}`),
              _questionKey: question?.id ? `id-${question.id}` : `passage-${passageIndex}-${qIndex}`,
              _questionNo: parseQuestionNumber(question, qIndex),
            }));

          return {
            key: String(passageObject?.passage_id || `passage-${passageIndex}`),
            passage: String(passageObject?.passage || ''),
            part: Number(passageObject?.part || readingPart),
            questions: sorted,
          };
        }).filter((group) => group.questions.length > 0);

        const legacyQuestions = Array.isArray(data?.questions) ? data.questions : [];
        const grouped = groupedFromApi.length ? groupedFromApi : buildPassageGroups(legacyQuestions);

        if (!grouped.length) {
          toast('No grouped passages found for this part.', 'error');
          return;
        }

        setGroups(grouped);
        setGroupIdx(0);
        setGroupAnswers({});
        setGroupResults({});
        setCheckedGroupKeys({});
        setQuestions([]);
      } else {
        const pickedQuestions = (Array.isArray(data?.questions) ? data.questions : []).filter(
          (q) => Number(q?.part) === Number(readingPart)
        );
        if (!pickedQuestions.length) {
          toast('No questions available for this selection.', 'error');
          return;
        }
        setQuestions(pickedQuestions);
        setGroups([]);
      }

      setStep('playing');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [skill, count, readingPart, toast]);

  const persistReadingPartProgress = useCallback((part, isCorrect) => {
    const key = 'pengwin_reading_part_progress';
    const current = JSON.parse(localStorage.getItem(key) || '{}');
    const partKey = `part${Number(part)}`;
    const prev = current[partKey] || { done: 0, correct: 0 };
    current[partKey] = {
      done: prev.done + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    };
    localStorage.setItem(key, JSON.stringify(current));
  }, []);

  const handleSingleSubmit = async () => {
    if (!answer.trim()) {
      toast('Please select or enter an answer.', 'error');
      return;
    }

    const currentQ = questions[idx];
    if (!currentQ) return;

    setSubmitting(true);
    try {
      if (currentQ.id) {
        const res = await questionApi.submitAnswer(currentQ.id, answer);
        const normalizedCorrect = resolveCorrectAnswer(currentQ, res.correct_answer);
        const normalizedRes = {
          ...res,
          correct_answer: normalizedCorrect,
          is_correct: normalizeAnswer(answer) === normalizeAnswer(normalizedCorrect),
        };

        setResult(normalizedRes);
        setScore((s) => ({
          correct: s.correct + (normalizedRes.is_correct ? 1 : 0),
          total: s.total + 1,
        }));
        if (currentQ.skill === 'reading' && [5, 6, 7].includes(Number(currentQ.part))) {
          persistReadingPartProgress(currentQ.part, normalizedRes.is_correct);
        }
      } else {
        const correctAnswer = resolveCorrectAnswer(currentQ, currentQ.correct_answer);
        const isCorrect = normalizeAnswer(answer) === normalizeAnswer(correctAnswer);
        const localResult = {
          is_correct: isCorrect,
          correct_answer: correctAnswer,
          explanation: currentQ.explanation || null,
          ai_feedback: null,
          xp_gained: isCorrect ? 10 : 2,
        };
        setResult(localResult);
        setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
      }
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleNext = () => {
    if (idx + 1 >= questions.length) {
      markPracticeFinished();
      setStep('done');
      return;
    }
    setIdx((i) => i + 1);
    setAnswer('');
    setResult(null);
  };

  const handleGroupAnswerChange = (questionKey, value) => {
    if (!currentGroup || currentGroupChecked) return;
    setGroupAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const handleCheckGroup = () => {
    if (!currentGroup) return;
    if (currentGroupChecked) return;

    if (!allGroupAnswered) {
      toast('Please answer all questions in this passage before checking.', 'error');
      return;
    }

    const resultByQuestion = {};
    let correctCount = 0;

    currentGroupQuestions.forEach((question) => {
      const selected = groupAnswers[question._questionKey] || '';
      const correctAnswer = resolveCorrectAnswer(question, question.correct_answer);
      const isCorrect = normalizeAnswer(selected) === normalizeAnswer(correctAnswer);

      resultByQuestion[question._questionKey] = {
        is_correct: isCorrect,
        correct_answer: correctAnswer,
        explanation: question.explanation || null,
      };

      if (isCorrect) correctCount += 1;
      persistReadingPartProgress(question.part, isCorrect);
    });

    setGroupResults((prev) => ({ ...prev, [currentGroup.key]: resultByQuestion }));
    setCheckedGroupKeys((prev) => ({ ...prev, [currentGroup.key]: true }));
    setScore((prev) => ({
      correct: prev.correct + correctCount,
      total: prev.total + currentGroupQuestions.length,
    }));
  };

  const handleNextGroup = () => {
    if (!groups.length) return;
    if (groupIdx + 1 >= groups.length) {
      markPracticeFinished();
      setStep('done');
      return;
    }
    setGroupIdx((i) => i + 1);
    requestAnimationFrame(() => {
      if (questionListRef.current) questionListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const scrollToQuestion = (questionNo) => {
    const target = currentGroupQuestions.find((q) => Number(q._questionNo) === Number(questionNo));
    if (!target) return;

    const node = questionNodeRefs.current[target._questionKey];
    const container = questionListRef.current;
    if (!node || !container) return;

    const offset = Math.max(node.offsetTop - container.offsetTop - 10, 0);
    container.scrollTo({ top: offset, behavior: 'smooth' });
  };

  const sendPracticeAiMessage = useCallback(
    async (rawInput) => {
      const text = String(rawInput ?? '').trim();
      if (!text || aiHelpLoading) return;

      const context = buildPracticeAiContext({
        isGroupMode,
        currentGroup,
        currentGroupQuestions,
        singleQuestion: currentSingleQuestion,
        answer,
      });
      const userPrompt = context
        ? `Please answer based on the practice context below.\n\n${context}\n\nStudent question: ${text}`
        : text;

      setAiHelpLoading(true);
      setAiHelpInput('');

      try {
        const savedUserMessage = await chatApi.send(text);
        setAiHelpMessages((prev) => [...prev, savedUserMessage]);

        const savedAiMessage = await chatApi.generate(userPrompt, PRACTICE_AI_SYSTEM_PROMPT);
        setAiHelpMessages((prev) => [...prev, savedAiMessage]);
      } catch (e) {
        toast(e.message || 'Could not ask AI right now.', 'error');
      } finally {
        setAiHelpLoading(false);
      }
    },
    [aiHelpLoading, answer, currentGroup, currentGroupQuestions, currentSingleQuestion, isGroupMode, toast]
  );

  const handleAiHelpSubmit = async () => {
    await sendPracticeAiMessage(aiHelpInput);
  };

  const renderPassageWithInteractiveBlanks = (passageText) => {
    const text = String(passageText || '');
    if (!text) return null;

    const regex = /\((\d+)\)/g;
    const nodes = [];
    let cursor = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = regex.lastIndex;
      const blankNo = Number(match[1]);
      const hasQuestion = currentGroupQuestions.some((q) => Number(q._questionNo) === blankNo);

      if (matchStart > cursor) {
        nodes.push(
          <span key={`txt-${cursor}`}>{text.slice(cursor, matchStart)}</span>
        );
      }

      if (hasQuestion) {
        nodes.push(
          <button
            type="button"
            key={`blank-${matchStart}`}
            className="passage-blank"
            onClick={() => scrollToQuestion(blankNo)}
            title={`Go to Question ${blankNo}`}
          >
            ({blankNo})
          </button>
        );
      } else {
        nodes.push(
          <span key={`blank-static-${matchStart}`} className="passage-blank static">
            ({blankNo})
          </span>
        );
      }

      cursor = matchEnd;
    }

    if (cursor < text.length) {
      nodes.push(<span key={`txt-end-${cursor}`}>{text.slice(cursor)}</span>);
    }

    return <>{nodes}</>;
  };

  const renderAiHelpPanel = () => (
    <div className="practice-ai-assist">
      <div className="practice-ai-head">
        <div>
          <div className="practice-ai-title">AI hỏi nhanh ngay trong bài</div>
          <div className="practice-ai-sub">
            Hỏi nghĩa từ, dịch câu, hoặc nhờ giải thích ngữ cảnh mà không cần rời khỏi Practice.
          </div>
        </div>
        {activeAiQuestion && (
          <div className="practice-ai-context">
            {isGroupMode ? `Passage ${groupIdx + 1}` : `Question ${idx + 1}`}
          </div>
        )}
      </div>

      <div className="practice-ai-chips">
        {[buildQuestionFocusPrompt(activeAiQuestion), ...PRACTICE_AI_STATIC_PROMPTS].map((prompt) => (
          <button key={prompt} type="button" className="practice-ai-chip" onClick={() => sendPracticeAiMessage(prompt)} disabled={aiHelpLoading}>
            {prompt}
          </button>
        ))}
      </div>

      <div className="practice-ai-thread">
        {aiHelpMessages.length === 0 ? (
          <div className="practice-ai-empty">
            Ví dụ: hỏi “giải thích câu này ngắn gọn”.
          </div>
        ) : (
          aiHelpMessages.map((message) => (
            <div key={message.id} className={`practice-ai-msg ${message.role === 'user' ? 'user' : 'ai'}`}>
              <div className="practice-ai-bubble">{message.content}</div>
            </div>
          ))
        )}
        {aiHelpLoading && (
          <div className="practice-ai-msg ai">
            <div className="practice-ai-bubble">Đang trả lời...</div>
          </div>
        )}
        <div ref={aiHelpBottomRef} />
      </div>

      <div className="practice-ai-input-row">
        <textarea
          className="practice-ai-input"
          placeholder="Nhập câu hỏi cho AI về từ/câu bạn đang làm..."
          value={aiHelpInput}
          onChange={(e) => setAiHelpInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAiHelpSubmit();
            }
          }}
          disabled={aiHelpLoading}
          rows={2}
        />
        <button className="btn btn-primary practice-ai-send" onClick={handleAiHelpSubmit} disabled={aiHelpLoading || !aiHelpInput.trim()}>
          {aiHelpLoading ? <span className="spinner" /> : 'Ask AI'}
        </button>
      </div>
    </div>
  );

  if (step === 'config') {
    return (
      <div className="fade-up practice-config">
        <div className="page-header">
          <h1 className="page-title">▶ Practice</h1>
          <p className="page-sub">Choose TOEIC Reading part and question count to begin</p>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <div className="form-group" style={{ marginBottom: 22 }}>
            <label className="form-label">TOEIC Reading Part</label>
            <div className="part-picker">
              {TOEIC_PARTS.map((p) => (
                <button
                  key={p.value}
                  className={`skill-pick-btn part-pick-btn ${readingPart === p.value ? 'active' : ''}`}
                  onClick={() => setReadingPart(p.value)}
                >
                  <span>{p.label}</span>
                  <small className="part-pick-sub">{p.sub}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label className="form-label">
              Question count: <strong style={{ color: 'var(--ocean)', fontSize: 15 }}>{count}</strong>
            </label>
            <input
              type="range"
              min={5}
              max={30}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--ocean)', marginTop: 8 }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--text3)',
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              <span>5</span>
              <span>30</span>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={startSession} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />Loading...
              </>
            ) : (
              `▶ Start ${count} questions · Part ${readingPart}`
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="fade-up practice-done">
        <div className="done-card card">
          <img className="done-mascot" src={score.correct / score.total >= 0.7 ? IMG_PROGRESS : IMG_HERO} alt="" />
          <h2 className="done-title">
            {score.correct === score.total ? 'Perfect!' : score.correct / score.total >= 0.7 ? 'Great job!' : 'Keep going!'}
          </h2>
          <div className="done-score">
            <span className="done-num accent">{score.correct}</span>
            <span className="done-slash">/</span>
            <span className="done-num">{score.total}</span>
          </div>
          <div className="done-pct">{Math.round((score.correct / Math.max(score.total, 1)) * 100)}% correct</div>
          <p className="done-msg">
            {score.correct === score.total
              ? 'Excellent! You got everything right!'
              : score.correct / Math.max(score.total, 1) >= 0.7
              ? 'Nice work! Keep reviewing!'
              : 'Check the Review section to study more!'}
          </p>
          <div className="done-actions">
            <button className="btn btn-primary" onClick={startSession}>▶ Làm thêm</button>
            <button className="btn btn-secondary" onClick={() => setStep('config')}>⚙ Change Part</button>
          </div>
        </div>
      </div>
    );
  }

  const singleQuestion = questions[idx];
  const singleQuestionText = singleQuestion?.question_text || singleQuestion?.content || '';
  const singleType = singleQuestion?.q_type || ((singleQuestion?.options && singleQuestion.options.length) ? 'mcq' : null);

  return (
    <div className="fade-up">
      <div className="practice-header">
        <div className="practice-meta">
          <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{activeMetaQuestion?.skill}</span>
          <span className="badge badge-purple">{activeMetaQuestion?.level}</span>
          {activeMetaQuestion?.part && <span className="badge badge-yellow">Part {activeMetaQuestion.part}</span>}
          <span className="badge badge-gray">
            {isGroupMode ? `${groupCompletion.current} / ${groupCompletion.total} passages` : singleType?.replace('_', ' ')}
          </span>
        </div>
        <div className="practice-progress">
          <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 700 }}>
            {isGroupMode ? `${groupCompletion.current} / ${groupCompletion.total}` : `${idx + 1} / ${questions.length}`}
          </span>
          <div className="progress-wrap" style={{ width: 120 }}>
            <div
              className="progress-fill"
              style={{
                width: `${isGroupMode
                  ? (groupCompletion.current / Math.max(groupCompletion.total, 1)) * 100
                  : ((idx + 1) / Math.max(questions.length, 1)) * 100
                }%`,
              }}
            />
          </div>
          <span style={{ fontSize: 13, color: 'var(--mint2)', fontWeight: 800 }}>✓ {score.correct}</span>
        </div>
      </div>

      <div className="step-dots">
        {(isGroupMode ? groups : questions).map((_, i) => (
          <div
            key={i}
            className={`step-dot ${i < (isGroupMode ? groupIdx : idx) ? 'done' : i === (isGroupMode ? groupIdx : idx) ? 'current' : ''}`}
          />
        ))}
      </div>

      {isGroupMode ? (
        <div className="practice-reading-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start', textAlign: 'left' }}>
          {/* CỘT TRÁI: HIỂN THỊ ĐOẠN VĂN ĐỌC HIỂU (STICKY) */}
          <div className="passage-card card" style={{ position: 'sticky', top: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
            <div className="passage-title">Passage</div>
            <div className="passage-content" style={{ lineHeight: 1.7, fontSize: '15px' }}>
              {renderPassageWithInteractiveBlanks(currentGroup?.passage)}
            </div>
          </div>

          {/* CỘT PHẢI: HIỂN THỊ DANH SÁCH CÂU HỎI ĐỔ DỌC CHUẨN CARD VÀ NÚT BẤM */}
          <div className="question-card card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="question-list-title">Questions in this passage</div>
            <div className="question-list-mini" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {currentGroupQuestions.map((question) => {
                const qResult = groupResults[currentGroup?.key]?.[question._questionKey];
                const isAnswered = normalizeAnswer(groupAnswers[question._questionKey]).length > 0;
                return (
                  <button
                    key={question._questionKey}
                    type="button"
                    className={`mini-q-btn ${isAnswered ? 'answered' : ''} ${
                      currentGroupChecked && qResult?.is_correct ? 'correct' : ''
                    } ${currentGroupChecked && qResult && !qResult.is_correct ? 'wrong' : ''}`}
                    onClick={() => scrollToQuestion(question._questionNo)}
                    style={{ padding: '6px 12px', borderRadius: '6px', fontWeight: 700 }}
                  >
                    Q{question._questionNo}
                  </button>
                );
              })}
            </div>

            <div className="match-hint" style={{ marginBottom: 12, fontSize: '12px', color: 'var(--text3)' }}>
              For Part 6, click blanks like (1), (2), (3) in the passage to jump to the question.
            </div>

            <div className="question-scroll" ref={questionListRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentGroupQuestions.map((question) => {
                const result = groupResults[currentGroup?.key]?.[question._questionKey];
                const optionsList = getQuestionOptions(question);
                
                return (
                  <div
                    key={question._questionKey}
                    className="group-question-block"
                    ref={(el) => {
                      questionNodeRefs.current[question._questionKey] = el;
                    }}
                    style={{ borderBottom: '1px solid var(--sky2)', paddingBottom: '16px', textAlign: 'left' }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--ocean)', marginBottom: '6px' }}>Question {question._questionNo}</div>
                    <div style={{ marginBottom: '12px', fontWeight: 600, color: 'var(--navy)' }}>{question.question_text || question.content}</div>

                    <div className="choices" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {optionsList.map((opt, i) => {
                        const letter = ['A', 'B', 'C', 'D'][i];
                        const isCurrentPicked = groupAnswers[question._questionKey] === opt;

                        let optionClass = "";
                        if (result && result.correct_answer === opt) optionClass = "correct";
                        else if (result && isCurrentPicked && !result.is_correct) optionClass = "wrong";

                        return (
                          <button
                            key={i}
                            disabled={currentGroupChecked}
                            className={`choice ${isCurrentPicked ? 'selected' : ''} ${optionClass}`}
                            onClick={() => handleGroupAnswerChange(question._questionKey, opt)}
                            style={{ textAlign: 'left', width: '100%' }}
                          >
                            <span className="choice-letter" style={{
                              background: optionClass === 'correct' ? '#10b981' : optionClass === 'wrong' ? '#ef4444' : '',
                              color: optionClass ? '#fff' : ''
                            }}>{letter}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {renderAiHelpPanel()}
          </div>
        </div>
      ) : (
        /* ⌨️ KHU VỰC HIỂN THỊ ĐƠN CÂU CHO PART 5 (MẪU CHUẨN REVIEW - ẤN CHỌN ĐƯỢC ĐÁP ÁN) */
        <div className="question-card card" style={{ textAlign: 'left', padding: '24px' }}>
          {singleQuestion?.passage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: 14, color: 'var(--text2)' }}>{singleQuestion.passage}</div>
              <div>
                <p className="q-text">{singleQuestionText}</p>

                {singleType === 'mcq' && (
                  <div className="choices" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(singleQuestion.options || []).map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      let optionClass = "";
                      if (result && opt === result.correct_answer) optionClass = "correct";
                      else if (result && answer === opt && !result.is_correct) optionClass = "wrong";

                      return (
                        <button 
                          key={i} 
                          disabled={!!result} 
                          className={`choice ${answer === opt ? 'selected' : ''} ${optionClass}`} 
                          onClick={() => setAnswer(opt)}
                          style={{ textAlign: 'left', width: '100%' }}
                        >
                          <span className="choice-letter" style={{
                            background: optionClass === 'correct' ? '#10b981' : optionClass === 'wrong' ? '#ef4444' : '',
                            color: optionClass ? '#fff' : ''
                          }}>{letter}</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
                {singleType !== 'mcq' && (
                  <textarea
                    className="form-textarea"
                    placeholder="Enter your answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={!!result}
                    rows={2}
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="q-text">{singleQuestionText}</p>

              {singleType === 'mcq' && (
                <div className="choices" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(singleQuestion.options || []).map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    let optionClass = "";
                    if (result && opt === result.correct_answer) optionClass = "correct";
                    else if (result && answer === opt && !result.is_correct) optionClass = "wrong";

                    return (
                      <button 
                        key={i} 
                        disabled={!!result} 
                        className={`choice ${answer === opt ? 'selected' : ''} ${optionClass}`} 
                        onClick={() => setAnswer(opt)}
                        style={{ textAlign: 'left', width: '100%' }}
                      >
                        <span className="choice-letter" style={{
                          background: optionClass === 'correct' ? '#10b981' : optionClass === 'wrong' ? '#ef4444' : '',
                          color: optionClass ? '#fff' : ''
                        }}>{letter}</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {singleType !== 'mcq' && (
                <textarea
                  className="form-textarea"
                  placeholder="Enter your answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!!result}
                  rows={2}
                />
              )}
            </>
          )}

          {result && (
            <div className={`feedback ${result.is_correct ? 'correct-fb' : 'wrong-fb'}`} style={{ marginTop: '14px', display: 'flex', gap: '10px', padding: '12px', borderRadius: '8px' }}>
              <div className="feedback-icon">{result.is_correct ? '✅' : '❌'}</div>
              <div>
                <div className="feedback-title" style={{ fontWeight: 700 }}>{result.is_correct ? `Correct! +${result.xp_gained} XP` : 'Incorrect'}</div>
                {!result.is_correct && <div className="feedback-answer">Answer: <strong>{result.correct_answer}</strong></div>}
                {result.explanation && <div className="feedback-explain" style={{ marginTop: '4px', color: 'var(--text2)' }}>💡 {result.explanation}</div>}
              </div>
            </div>
          )}

          {renderAiHelpPanel()}
        </div>
      )}

      <div className="practice-actions">
        {isGroupMode ? (
          !currentGroupChecked ? (
            <button className="btn btn-primary" onClick={handleCheckGroup} disabled={submitting || !allGroupAnswered}>
              Check Answer
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNextGroup}>
              {groupIdx + 1 >= groups.length ? 'View results →' : 'Next passage →'}
            </button>
          )
        ) : !result ? (
          <button className="btn btn-primary" onClick={handleSingleSubmit} disabled={submitting || !answer.trim()}>
            {submitting ? 'Grading...' : 'Submit'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSingleNext}>
            {idx + 1 >= questions.length ? 'View results →' : 'Next question →'}
          </button>
        )}

        <button className="btn btn-ghost" onClick={() => setStep('config')}>Stop</button>
      </div>
    </div>
  );
}
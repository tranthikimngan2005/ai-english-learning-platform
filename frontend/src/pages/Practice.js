import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { questionApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Practice.css';

const SKILLS  = ['reading','listening','writing','speaking'];
const SKILL_ICONS = { reading:'📖', listening:'🎧', writing:'✍️', speaking:'🗣️' };

export default function Practice() {
  const [params] = useSearchParams();
  const toast    = useToast();

  const [step,      setStep]      = useState('config'); // config | playing | done
  const [skill,     setSkill]     = useState(params.get('skill') || 'reading');
  const [count,     setCount]     = useState(10);
  const [questions, setQuestions] = useState([]);
  const [idx,       setIdx]       = useState(0);
  const [answer,    setAnswer]    = useState('');
  const [result,    setResult]    = useState(null); // { is_correct, correct_answer, explanation, xp_gained }
  const [score,     setScore]     = useState({ correct: 0, total: 0 });
  const [loading,   setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await questionApi.startPractice(skill, count);
      if (!data.questions.length) {
        toast('Không có câu hỏi nào được duyệt cho kỹ năng này!', 'error');
        return;
      }
      setQuestions(data.questions);
      setIdx(0);
      setAnswer('');
      setResult(null);
      setScore({ correct: 0, total: 0 });
      setStep('playing');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [skill, count, toast]);

  const handleSubmit = async () => {
    if (!answer.trim()) { toast('Vui lòng chọn hoặc nhập câu trả lời', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await questionApi.submitAnswer(questions[idx].id, answer);
      setResult(res);
      setScore(s => ({
        correct: s.correct + (res.is_correct ? 1 : 0),
        total:   s.total + 1,
      }));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) { setStep('done'); return; }
    setIdx(i => i + 1);
    setAnswer('');
    setResult(null);
  };

  const q = questions[idx];

  /* ── Config screen ── */
  if (step === 'config') return (
    <div className="fade-up practice-config">
      <div className="page-header">
        <h1 className="page-title">Luyện tập</h1>
        <p className="page-sub">Chọn kỹ năng và số câu hỏi</p>
      </div>

      <div className="config-card card">
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Kỹ năng</label>
          <div className="skill-picker">
            {SKILLS.map(s => (
              <button key={s} className={`skill-pick-btn ${skill === s ? 'active' : ''}`}
                onClick={() => setSkill(s)}>
                <span>{SKILL_ICONS[s]}</span>
                <span style={{ textTransform: 'capitalize' }}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 28 }}>
          <label className="form-label">Số câu hỏi: <strong style={{ color: 'var(--accent)' }}>{count}</strong></label>
          <input type="range" min={5} max={30} value={count}
            onChange={e => setCount(+e.target.value)}
            style={{ width:'100%', accentColor:'var(--accent)' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginTop:4 }}>
            <span>5</span><span>30</span>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={startSession} disabled={loading} style={{ width:'100%' }}>
          {loading ? <><span className="spinner" />Đang tải...</> : `▶  Bắt đầu ${count} câu · ${skill}`}
        </button>
      </div>
    </div>
  );

  /* ── Done screen ── */
  if (step === 'done') return (
    <div className="fade-up practice-done">
      <div className="done-card card">
        <div className="done-icon">{score.correct / score.total >= 0.8 ? '🎉' : score.correct / score.total >= 0.5 ? '👍' : '💪'}</div>
        <h2 className="done-title">Hoàn thành!</h2>
        <div className="done-score">
          <span className="done-num" style={{ color:'var(--accent)' }}>{score.correct}</span>
          <span className="done-slash">/</span>
          <span className="done-num">{score.total}</span>
        </div>
        <p className="done-pct">{Math.round(score.correct/score.total*100)}% chính xác</p>
        <p className="done-msg">
          {score.correct === score.total ? 'Xuất sắc! Làm đúng tất cả!' :
           score.correct / score.total >= 0.7 ? 'Tốt lắm! Tiếp tục ôn nhé!' :
           'Cần ôn thêm — hãy xem lại phần Review!'}
        </p>
        <div className="done-actions">
          <button className="btn btn-primary" onClick={startSession}>▶  Luyện thêm</button>
          <button className="btn btn-secondary" onClick={() => setStep('config')}>⚙  Đổi kỹ năng</button>
        </div>
      </div>
    </div>
  );

  /* ── Playing screen ── */
  return (
    <div className="fade-up">
      <div className="practice-header">
        <div className="practice-meta">
          <span className="badge badge-green" style={{ textTransform:'capitalize' }}>{q?.skill}</span>
          <span className="badge badge-blue">{q?.level}</span>
          <span className="badge badge-gray" style={{ textTransform:'capitalize' }}>{q?.q_type?.replace('_',' ')}</span>
        </div>
        <div className="practice-progress">
          <span style={{ fontSize:13, color:'var(--text2)' }}>{idx+1} / {questions.length}</span>
          <div className="progress-wrap" style={{ width: 120 }}>
            <div className="progress-fill" style={{ width:`${((idx+1)/questions.length)*100}%` }} />
          </div>
          <span style={{ fontSize:13, color:'var(--accent)' }}>✓ {score.correct}</span>
        </div>
      </div>

      {/* Step dots */}
      <div className="step-dots">
        {questions.map((_,i) => (
          <div key={i} className={`step-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}`} />
        ))}
      </div>

      <div className="question-card card">
        <p className="q-text">{q?.content}</p>

        {/* MCQ */}
        {q?.q_type === 'mcq' && !result && (
          <div className="choices">
            {(q.options || []).map((opt, i) => (
              <button key={i}
                className={`choice ${answer === opt ? 'selected' : ''}`}
                onClick={() => setAnswer(opt)}>
                <span className="choice-letter">{String.fromCharCode(65+i)}</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* MCQ after submit */}
        {q?.q_type === 'mcq' && result && (
          <div className="choices">
            {(q.options || []).map((opt, i) => (
              <div key={i} className={`choice static
                ${opt === result.correct_answer ? 'correct' : ''}
                ${opt === answer && !result.is_correct ? 'wrong' : ''}`}>
                <span className="choice-letter">{String.fromCharCode(65+i)}</span>
                {opt}
              </div>
            ))}
          </div>
        )}

        {/* Fill blank / writing / speaking */}
        {(q?.q_type === 'fill_blank' || q?.q_type === 'writing' || q?.q_type === 'speaking') && (
          <textarea className="form-textarea"
            placeholder={q.q_type === 'fill_blank' ? 'Nhập câu trả lời...' : 'Viết câu trả lời của bạn...'}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            disabled={!!result}
            rows={q.q_type === 'writing' ? 5 : 2}
          />
        )}

        {/* Feedback */}
        {result && (
          <div className={`feedback ${result.is_correct ? 'correct' : 'wrong'}`}>
            <div className="feedback-icon">{result.is_correct ? '✅' : '❌'}</div>
            <div className="feedback-body">
              <div className="feedback-title">
                {result.is_correct ? `Chính xác! +${result.xp_gained} XP` : 'Chưa đúng'}
              </div>
              {!result.is_correct && (
                <div className="feedback-answer">Đáp án: <strong>{result.correct_answer}</strong></div>
              )}
              {result.explanation && <div className="feedback-explain">{result.explanation}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="practice-actions">
        {!result ? (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !answer.trim()}>
            {submitting ? <><span className="spinner" />Đang chấm...</> : 'Nộp bài'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext}>
            {idx + 1 >= questions.length ? 'Xem kết quả →' : 'Câu tiếp theo →'}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setStep('config')}>Dừng lại</button>
      </div>
    </div>
  );
}

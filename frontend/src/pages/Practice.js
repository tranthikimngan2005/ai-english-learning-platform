import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { questionApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { IMG_VOCAB, IMG_LISTEN, IMG_GRAMMAR, IMG_CHAT, IMG_PROGRESS, IMG_HERO } from '../assets/images';
import './Practice.css';

const SKILLS = ['reading','listening','writing','speaking'];
const SKILL_IMGS = { reading:IMG_VOCAB, listening:IMG_LISTEN, writing:IMG_GRAMMAR, speaking:IMG_CHAT };

export default function Practice() {
  const [params]  = useSearchParams();
  const toast     = useToast();
  const [step,      setStep]      = useState('config');
  const [skill,     setSkill]     = useState(params.get('skill')||'reading');
  const [count,     setCount]     = useState(10);
  const [questions, setQuestions] = useState([]);
  const [idx,       setIdx]       = useState(0);
  const [answer,    setAnswer]    = useState('');
  const [result,    setResult]    = useState(null);
  const [score,     setScore]     = useState({correct:0,total:0});
  const [loading,   setLoading]   = useState(false);
  const [submitting,setSubmitting]= useState(false);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await questionApi.startPractice(skill, count);
      if (!data.questions.length) { toast('No questions available. Add some questions first.','error'); return; }
      setQuestions(data.questions); setIdx(0); setAnswer(''); setResult(null); setScore({correct:0,total:0}); setStep('playing');
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [skill, count, toast]);

  const handleSubmit = async () => {
    if (!answer.trim()) { toast('Please select or enter an answer.','error'); return; }
    setSubmitting(true);
    try {
      const res = await questionApi.submitAnswer(questions[idx].id, answer);
      setResult(res);
      setScore(s=>({correct:s.correct+(res.is_correct?1:0), total:s.total+1}));
    } catch(e) { toast(e.message,'error'); }
    finally { setSubmitting(false); }
  };

  const handleNext = () => {
    if (idx+1 >= questions.length) { setStep('done'); return; }
    setIdx(i=>i+1); setAnswer(''); setResult(null);
  };

  const q = questions[idx];

  if (step==='config') return (
    <div className="fade-up practice-config">
      <div className="page-header">
        <h1 className="page-title">▶ Practice</h1>
        <p className="page-sub">Choose a skill and question count to begin</p>
      </div>
      <div className="card" style={{padding:28}}>
        <div className="form-group" style={{marginBottom:22}}>
          <label className="form-label">Skill</label>
          <div className="skill-picker">
            {SKILLS.map(s=>(
              <button key={s} className={`skill-pick-btn ${skill===s?'active':''}`} onClick={()=>setSkill(s)}>
                <img src={SKILL_IMGS[s]} alt={s} />
                <span style={{textTransform:'capitalize'}}>{s}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="form-group" style={{marginBottom:28}}>
          <label className="form-label">Question count: <strong style={{color:'var(--ocean)',fontSize:15}}>{count}</strong></label>
          <input type="range" min={5} max={30} value={count}
            onChange={e=>setCount(+e.target.value)}
            style={{width:'100%',accentColor:'var(--ocean)',marginTop:8}} />
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text3)',marginTop:4,fontWeight:600}}>
            <span>5</span><span>30</span>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={startSession} disabled={loading}>
          {loading ? <><span className="spinner"/>Loading...</> : `▶ Start ${count} questions · ${skill}`}
        </button>
      </div>
    </div>
  );

  if (step==='done') return (
    <div className="fade-up practice-done">
      <div className="done-card card">
        <img className="done-mascot" src={score.correct/score.total>=0.7?IMG_PROGRESS:IMG_HERO} alt="" />
        <h2 className="done-title">
          {score.correct===score.total ? '🎉 Perfect!' : score.correct/score.total>=0.7 ? '👍 Great job!' : '💪 Keep going!'}
        </h2>
        <div className="done-score">
          <span className="done-num accent">{score.correct}</span>
          <span className="done-slash">/</span>
          <span className="done-num">{score.total}</span>
        </div>
        <div className="done-pct">{Math.round(score.correct/score.total*100)}% correct</div>
        <p className="done-msg">
          {score.correct===score.total ? 'Excellent! You got everything right!'
           : score.correct/score.total>=0.7 ? 'Nice work! Keep reviewing!'
           : 'Check the Review section to study more!'}
        </p>
        <div className="done-actions">
          <button className="btn btn-primary" onClick={startSession}>▶ Làm thêm</button>
          <button className="btn btn-secondary" onClick={()=>setStep('config')}>⚙ Change skill</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-up">
      <div className="practice-header">
        <div className="practice-meta">
          <span className="badge badge-blue" style={{textTransform:'capitalize'}}>{q?.skill}</span>
          <span className="badge badge-purple">{q?.level}</span>
          <span className="badge badge-gray">{q?.q_type?.replace('_',' ')}</span>
        </div>
        <div className="practice-progress">
          <span style={{fontSize:13,color:'var(--text2)',fontWeight:700}}>{idx+1} / {questions.length}</span>
          <div className="progress-wrap" style={{width:120}}>
            <div className="progress-fill" style={{width:`${((idx+1)/questions.length)*100}%`}} />
          </div>
          <span style={{fontSize:13,color:'var(--mint2)',fontWeight:800}}>✓ {score.correct}</span>
        </div>
      </div>

      <div className="step-dots">
        {questions.map((_,i)=>(
          <div key={i} className={`step-dot ${i<idx?'done':i===idx?'current':''}`} />
        ))}
      </div>

      <div className="question-card card">
        <img className="question-bg-img" src={SKILL_IMGS[q?.skill]||IMG_VOCAB} alt="" />
        <p className="q-text">{q?.content}</p>

        {q?.q_type==='mcq' && !result && (
          <div className="choices">
            {(q.options||[]).map((opt,i)=>(
              <button key={i} className={`choice ${answer===opt?'selected':''}`} onClick={()=>setAnswer(opt)}>
                <span className="choice-letter">{String.fromCharCode(65+i)}</span>{opt}
              </button>
            ))}
          </div>
        )}
        {q?.q_type==='mcq' && result && (
          <div className="choices">
            {(q.options||[]).map((opt,i)=>(
              <div key={i} className={`choice static ${opt===result.correct_answer?'correct':''}${opt===answer&&!result.is_correct?' wrong':''}`}>
                <span className="choice-letter">{String.fromCharCode(65+i)}</span>{opt}
              </div>
            ))}
          </div>
        )}
        {(q?.q_type==='fill_blank'||q?.q_type==='writing'||q?.q_type==='speaking') && (
          <textarea className="form-textarea"
            placeholder={q.q_type==='fill_blank'?'Enter your answer...':'Write your answer...'}
            value={answer} onChange={e=>setAnswer(e.target.value)}
            disabled={!!result} rows={q.q_type==='writing'?5:2} />
        )}

        {result && (
          <div className={`feedback ${result.is_correct?'correct-fb':'wrong-fb'}`}>
            <div className="feedback-icon">{result.is_correct?'✅':'❌'}</div>
            <div>
              <div className="feedback-title">{result.is_correct?`Correct! +${result.xp_gained} XP 🎉`:'Not quite!'}</div>
              {!result.is_correct && <div className="feedback-answer">Answer: <strong>{result.correct_answer}</strong></div>}
              {result.explanation && <div className="feedback-explain">{result.explanation}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="practice-actions">
        {!result ? (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting||!answer.trim()}>
            {submitting?<><span className="spinner"/>Grading...</>:'Submit'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext}>
            {idx+1>=questions.length?'View results →':'Next question →'}
          </button>
        )}
        <button className="btn btn-ghost" onClick={()=>setStep('config')}>Stop</button>
      </div>
    </div>
  );
}

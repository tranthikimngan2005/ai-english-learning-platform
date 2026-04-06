import { useEffect, useState } from 'react';
import { reviewApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { IMG_LISTEN, IMG_HERO } from '../assets/images';
import './Review.css';

const GRADES = [
  { key:'again', label:'Again', sub:'< 1 ngày', color:'#ff5a5a' },
  { key:'hard',  label:'Hard',  sub:'~3 ngày',  color:'#ff8c42' },
  { key:'good',  label:'Good',  sub:'~6 ngày',  color:'#2196b0' },
  { key:'easy',  label:'Easy',  sub:'~15 ngày', color:'#4ecb8d' },
];

export default function Review() {
  const toast = useToast();
  const [cards,   setCards]   = useState([]);
  const [idx,     setIdx]     = useState(0);
  const [step,    setStep]    = useState('loading');
  const [showing, setShowing] = useState(false);
  const [grading, setGrading] = useState(false);
  const [stats,   setStats]   = useState({done:0,again:0});

  useEffect(()=>{
    reviewApi.due()
      .then(data=>{ setCards(data); setStep(data.length?'idle':'done'); })
      .catch(e=>{ toast(e.message,'error'); setStep('done'); });
  },[toast]);

  const card = cards[idx];
  const q    = card?.question;

  const handleGrade = async (result) => {
    if (grading) return;
    setGrading(true);
    try {
      await reviewApi.submit(cards[idx].id, result);
      setStats(s=>({done:s.done+1, again:s.again+(result==='again'?1:0)}));
      if (idx+1>=cards.length) setStep('done');
      else { setIdx(i=>i+1); setShowing(false); }
    } catch(e) { toast(e.message,'error'); }
    finally { setGrading(false); }
  };

  if (step==='loading') return <div className="loading-page"><div className="spinner spinner-lg"/></div>;

  if (step==='idle') return (
    <div className="fade-up review-idle">
      <div className="page-header">
        <h1 className="page-title">🔁 Ôn tập</h1>
        <p className="page-sub">Spaced Repetition — ôn đúng lúc, nhớ lâu hơn</p>
      </div>
      <div className="idle-card card">
        <img src={IMG_LISTEN} className="idle-mascot" alt="" />
        <div className="idle-count">{cards.length}</div>
        <div className="idle-label">thẻ cần ôn hôm nay</div>
        <div className="idle-est">Ước tính ~{Math.ceil(cards.length*0.8)} phút</div>
        <div className="idle-preview">
          {cards.slice(0,3).map(c=>(
            <div key={c.id} className="idle-preview-item">
              <span className="badge badge-blue">{c.question?.level}</span>
              <span className="idle-preview-text">{c.question?.content?.slice(0,55)}…</span>
              <span style={{fontSize:11,color:'var(--text3)',fontWeight:700}}>+{c.interval_days}d</span>
            </div>
          ))}
          {cards.length>3 && <div style={{fontSize:13,color:'var(--text3)',textAlign:'center',fontWeight:600}}>và {cards.length-3} thẻ nữa...</div>}
        </div>
        <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={()=>{setIdx(0);setShowing(false);setStep('reviewing');}}>
          Bắt đầu ôn tập →
        </button>
      </div>
    </div>
  );

  if (step==='done') return (
    <div className="fade-up review-idle">
      <div className="idle-card card" style={{textAlign:'center'}}>
        <img src={IMG_HERO} style={{width:100,animation:'float 3s ease-in-out infinite',marginBottom:16}} alt="" />
        <h2 style={{fontFamily:'var(--font-head)',fontSize:22,color:'var(--navy)',marginBottom:8}}>
          {cards.length===0 ? 'Không có thẻ hôm nay!' : 'Ôn tập hoàn thành! 🎊'}
        </h2>
        <p style={{fontSize:14,color:'var(--text2)',fontWeight:600,marginBottom:24}}>
          {cards.length===0 ? 'Làm thêm bài luyện tập để tạo thẻ mới.' : `Đã ôn ${stats.done} thẻ · Cần ôn lại: ${stats.again}`}
        </p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <a href="/practice" className="btn btn-primary">▶ Luyện tập thêm</a>
          <a href="/dashboard" className="btn btn-secondary">🏠 Dashboard</a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-up">
      <div className="review-header">
        <span className="badge badge-gray">{idx+1} / {cards.length}</span>
        <div className="progress-wrap" style={{flex:1,maxWidth:200}}>
          <div className="progress-fill" style={{width:`${(idx/cards.length)*100}%`}} />
        </div>
        <span style={{fontSize:13,color:'var(--text2)',fontWeight:700}}>Streak: {card?.repetitions??0}×</span>
      </div>

      <div className="review-card card">
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {q?.skill && <span className="badge badge-green" style={{textTransform:'capitalize'}}>{q.skill}</span>}
          {q?.level && <span className="badge badge-blue">{q.level}</span>}
        </div>
        <p className="review-q">{q?.content}</p>
        {!showing
          ? <button className="btn btn-secondary" style={{alignSelf:'center'}} onClick={()=>setShowing(true)}>👀 Xem đáp án</button>
          : <div className="review-answer fade-in">
              <div className="answer-label">✅ Đáp án đúng</div>
              <div className="answer-text">{q?.correct_answer}</div>
              {q?.explanation && <div className="answer-explain">{q.explanation}</div>}
            </div>
        }
      </div>

      {showing && (
        <div className="grade-row fade-in">
          <p style={{fontSize:13,color:'var(--text2)',fontWeight:700,marginBottom:12}}>🤔 Bạn nhớ tốt đến đâu?</p>
          <div className="grade-btns">
            {GRADES.map(g=>(
              <button key={g.key} className="grade-btn" style={{'--gc':g.color}}
                onClick={()=>handleGrade(g.key)} disabled={grading}>
                <span className="grade-label">{g.label}</span>
                <span className="grade-sub">{g.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IMG_VOCAB, IMG_LISTEN, IMG_GRAMMAR, IMG_CHAT, IMG_STREAK, IMG_PROGRESS } from '../assets/images';
import './Profile.css';

const SKILL_META = {
  reading:   { img:IMG_VOCAB,   color:'#2196b0' },
  listening: { img:IMG_LISTEN,  color:'#ff8c42' },
  writing:   { img:IMG_GRAMMAR, color:'#9b6ff5' },
  speaking:  { img:IMG_CHAT,    color:'#4ecb8d' },
};

export default function Profile() {
  const { user } = useAuth();
  const [dash,    setDash]    = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    userApi.dashboard()
      .then(setDash)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"/></div>;
  const streak   = dash?.streak;
  const profiles = dash?.skill_profiles||[];

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">🐧 Profile</h1>
      </div>
      <div className="profile-hero card">
        <div className="profile-avatar-lg">{user?.username?.[0]?.toUpperCase()}</div>
        <div className="profile-info">
          <h2 className="profile-name">{user?.username}</h2>
          <p className="profile-email">{user?.email||'—'}</p>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <span className={`badge badge-${user?.role==='admin'?'yellow':user?.role==='creator'?'blue':'green'}`}>{user?.role}</span>
          </div>
        </div>
        <div className="profile-streak">
          <img src={IMG_STREAK} alt="streak" className="profile-streak-img" />
          <div>
            <div style={{fontFamily:'var(--font-head)',fontSize:32,color:'#ff6b35',lineHeight:1}}>{streak?.current_streak??0}</div>
            <div style={{fontSize:11,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Day Streak</div>
            {streak?.longest_streak>0 && <div style={{fontSize:11,color:'var(--text3)',fontWeight:600,marginTop:4}}>Best: {streak.longest_streak}d</div>}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{marginBottom:24}}>
        <div className="stat-card">
          <img className="stat-card-img" src={IMG_PROGRESS} alt="" style={{animation:'float 3s ease-in-out infinite'}} />
          <div><div className="stat-label">Tổng câu đã làm</div><div className="stat-value">{dash?.total_questions_done??0}</div></div>
        </div>
        <div className="stat-card">
          <img className="stat-card-img" src={IMG_LISTEN} alt="" style={{animation:'float 3.3s ease-in-out infinite'}} />
          <div><div className="stat-label">Thẻ ôn hôm nay</div><div className="stat-value warning">{dash?.due_reviews??0}</div></div>
        </div>
        <div className="stat-card">
          <img className="stat-card-img" src={IMG_STREAK} alt="" style={{animation:'float 2.8s ease-in-out infinite'}} />
          <div><div className="stat-label">Streak dài nhất</div><div className="stat-value accent">{streak?.longest_streak??0}</div></div>
        </div>
      </div>

      <div className="section-title">⭐ Kỹ năng</div>
      <div className="grid-4">
        {profiles.map(p=>{
          const m=SKILL_META[p.skill];
          const pct=p.questions_done===0?0:Math.round(p.questions_correct/Math.max(p.questions_done,1)*100);
          return (
            <div key={p.skill} className="card" style={{textAlign:'center',padding:18}}>
              <img src={m.img} style={{width:56,height:56,objectFit:'contain',animation:'float 3s ease-in-out infinite',marginBottom:8}} alt="" />
              <div style={{fontFamily:'var(--font-head)',fontSize:22,color:m.color}}>{p.current_level}</div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--text2)',textTransform:'capitalize',marginBottom:8}}>{p.skill}</div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{width:`${pct}%`,background:m.color}} />
              </div>
              <div style={{fontSize:11,color:'var(--text3)',fontWeight:600,marginTop:5}}>{pct}% · {p.questions_done} câu</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

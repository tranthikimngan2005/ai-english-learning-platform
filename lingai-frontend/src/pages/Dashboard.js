import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, chatApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IMG_HERO, IMG_STREAK, IMG_VOCAB, IMG_LISTEN, IMG_GRAMMAR, IMG_CHAT, IMG_PROGRESS } from '../assets/images';
import './Dashboard.css';

const SKILL_META = {
  reading:   { img:IMG_VOCAB,    color:'#2196b0', label:'Reading' },
  listening: { img:IMG_LISTEN,   color:'#ff8c42', label:'Listening' },
  writing:   { img:IMG_GRAMMAR,  color:'#9b6ff5', label:'Writing' },
  speaking:  { img:IMG_CHAT,     color:'#4ecb8d', label:'Speaking' },
};

function SkillCard({ p, onClick }) {
  const m = SKILL_META[p.skill];
  const pct = p.questions_done === 0 ? 0
    : Math.min(100, Math.round(p.questions_correct / Math.max(p.questions_done,1) * 100));
  return (
    <div className="skill-card" style={{'--sc': m.color}} onClick={onClick}>
      <div className="skill-card-top">
        <img src={m.img} className="skill-card-img" alt={p.skill} />
        <span className="badge" style={{background:`${m.color}22`, color:m.color}}>{p.current_level}</span>
      </div>
      <div className="skill-card-name">{m.label}</div>
      <div className="skill-card-sub">{p.questions_done} questions done</div>
      <div className="progress-wrap" style={{marginTop:8}}>
        <div className="progress-fill" style={{width:`${pct}%`, background:m.color}} />
      </div>
      <div className="skill-card-pct">{pct}% accuracy</div>
    </div>
  );
}

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [data, setData]     = useState(null);
  const [chatDone, setChatDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userApi.dashboard(), chatApi.history()])
      .then(([dashboard, history]) => {
        setData(dashboard);

        const now = new Date();
        const hasUserMessageToday = (history || []).some(m => {
          if (m?.role !== 'user' || !m?.created_at) return false;
          const d = new Date(m.created_at);
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
          );
        });
        setChatDone(hasUserMessageToday);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greet = hour<12 ? 'Good morning' : hour<18 ? 'Good afternoon' : 'Good evening';

  const profiles = data?.skill_profiles || [];
  const readingDone = (profiles.find(p => p.skill === 'reading')?.questions_done || 0) > 0;
  const listeningDone = (profiles.find(p => p.skill === 'listening')?.questions_done || 0) > 0;
  const reviewDone = (data?.due_reviews ?? 0) === 0;

  if (loading) return (
    <div className="loading-page">
      <img className="penguin-cutout" src={IMG_HERO} style={{width:80,animation:'float 3s ease-in-out infinite'}} alt="" />
      <span>Loading...</span>
    </div>
  );

  return (
    <div className="fade-up">
      {/* Hero banner */}
      <div className="hero-banner">
        <span className="hero-star sp1">⭐</span>
        <span className="hero-star sp2">✨</span>
        <span className="hero-star sp3">🌟</span>
        <img className="hero-mascot" src={IMG_HERO} alt="Pengwin" />
        <div className="hero-body">
          <div className="hero-greeting">{greet}, <span>{user?.username}</span>! 👋</div>
          <div className="hero-sub">
            {data?.streak?.current_streak > 0
              ? `🔥 Streak ${data.streak.current_streak} days — great work!`
              : 'Start your first lesson today!'}
          </div>
          <div className="hero-stats">
            {[
              { n:data?.streak?.current_streak??0, l:'Streak' },
              { n:data?.total_questions_done??0,   l:'Questions done' },
              { n:data?.due_reviews??0,            l:'Review cards' },
            ].map(s=>(
              <div key={s.l} className="hero-stat">
                <div className="hero-stat-num">{s.n}</div>
                <div className="hero-stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill cards */}
      <div className="section-title">⭐ Your skills</div>
      <div className="grid-4" style={{marginBottom:26}}>
        {profiles.map(p=>(
          <SkillCard key={p.skill} p={p}
            onClick={()=>navigate(`/practice?skill=${p.skill}`)} />
        ))}
      </div>

      {/* Today tasks */}
      <div className="section-title">📋 Today&apos;s tasks</div>
      <div className="tasks-card">
        {[
          {
            done: readingDone,
            label: 'Reading — Practice',
            badge: readingDone ? 'Done' : 'Not done',
            bc: readingDone ? 'badge-green' : 'badge-orange',
          },
          {
            done: listeningDone,
            label: 'Listening — Practice',
            badge: listeningDone ? 'Done' : 'Not done',
            bc: listeningDone ? 'badge-green' : 'badge-orange',
          },
          {
            done: reviewDone,
            label: `Review — ${data?.due_reviews??0} cards today`,
            badge: reviewDone ? 'Done' : 'Not done',
            bc: reviewDone ? 'badge-green' : 'badge-orange',
          },
          {
            done: chatDone,
            label: 'AI Chat — Writing practice',
            badge: chatDone ? 'Done' : 'New',
            bc: chatDone ? 'badge-green' : 'badge-purple',
          },
        ].map((t,i)=>(
          <div key={i} className="task-item">
            <div className={`task-check ${t.done?'done':'todo'}`}>{t.done?'✓':'○'}</div>
            <span className="task-label">{t.label}</span>
            <span className={`badge ${t.bc} task-badge-right`}>{t.badge}</span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="section-title">⚡ Quick actions</div>
      <div className="quick-grid">
        {[
          { img:IMG_VOCAB,    title:'Practice now',   sub:'New questions by level', to:'/practice', color:'var(--ocean)' },
          { img:IMG_LISTEN,   title:'Review cards',   sub:`${data?.due_reviews??0} cards pending`, to:'/review', color:'var(--orange)' },
          { img:IMG_CHAT,     title:'Chat with AI',   sub:'Free writing practice',  to:'/chat',     color:'var(--mint)' },
          { img:IMG_PROGRESS, title:'View progress',  sub:'CEFR A1 → C2 track',   to:'/progress', color:'var(--purple)' },
        ].map(a=>(
          <div key={a.title} className="quick-card" style={{'--qc':a.color}}
            onClick={()=>navigate(a.to)}>
            <img className="quick-img" src={a.img} alt={a.title} />
            <div className="quick-body">
              <div className="quick-title">{a.title}</div>
              <div className="quick-sub">{a.sub}</div>
            </div>
            <span className="quick-arrow">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

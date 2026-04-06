import { useEffect, useState } from 'react';
import { userApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Progress.css';

const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const SKILL_META = {
  reading:   { icon:'📖', color:'#2dd4a0' },
  listening: { icon:'🎧', color:'#60a5fa' },
  writing:   { icon:'✍️', color:'#a78bfa' },
  speaking:  { icon:'🗣️', color:'#fb923c' },
};

function LevelBar({ profile }) {
  const meta  = SKILL_META[profile.skill];
  const lvIdx = LEVELS.indexOf(profile.current_level);
  const pct   = profile.questions_done === 0 ? 0
    : Math.min(100, Math.round(profile.questions_correct / Math.max(profile.questions_done,1) * 100));
  const toNextLevel = 50 - profile.questions_done;

  return (
    <div className="prog-card card">
      <div className="prog-header">
        <span className="prog-icon">{meta.icon}</span>
        <div>
          <div className="prog-skill">{profile.skill.charAt(0).toUpperCase()+profile.skill.slice(1)}</div>
          <div className="prog-level" style={{ color: meta.color }}>
            {profile.current_level} {lvIdx < 5 ? `→ ${LEVELS[lvIdx+1]}` : '· Max Level!'}
          </div>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ fontSize:22, fontWeight:600, color:'var(--text)' }}>{pct}%</div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>accuracy</div>
        </div>
      </div>

      {/* CEFR track */}
      <div className="cefr-track">
        {LEVELS.map((l, i) => (
          <div key={l} className={`cefr-node ${i < lvIdx ? 'past' : i === lvIdx ? 'current' : 'future'}`}
            style={{ '--node-color': meta.color }}>
            <div className="cefr-dot" />
            <div className="cefr-label">{l}</div>
          </div>
        ))}
        <div className="cefr-line" />
      </div>

      <div className="prog-stats">
        <div className="prog-stat">
          <span className="prog-stat-val">{profile.questions_done}</span>
          <span className="prog-stat-key">câu đã làm</span>
        </div>
        <div className="prog-stat">
          <span className="prog-stat-val" style={{ color: meta.color }}>{profile.questions_correct}</span>
          <span className="prog-stat-key">đúng</span>
        </div>
        <div className="prog-stat">
          <span className="prog-stat-val">{Math.max(0, toNextLevel)}</span>
          <span className="prog-stat-key">còn lại để lên cấp</span>
        </div>
      </div>

      <div className="progress-wrap" style={{ marginTop: 12 }}>
        <div className="progress-fill" style={{ width:`${Math.min(100, profile.questions_done/50*100)}%`, background: meta.color }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginTop:5 }}>
        <span>0 câu</span><span>50 câu (cần ≥75% đúng)</span>
      </div>
    </div>
  );
}

export default function Progress() {
  const toast = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    userApi.progress()
      .then(setProfiles)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg" /></div>;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">Tiến độ học</h1>
        <p className="page-sub">CEFR level progression · Cần 50 câu + 75% accuracy để lên cấp</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {profiles.map(p => <LevelBar key={p.skill} profile={p} />)}
      </div>
    </div>
  );
}

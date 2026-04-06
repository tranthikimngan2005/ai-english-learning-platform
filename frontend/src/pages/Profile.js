import { useEffect, useState } from 'react';
import { userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Profile.css';

const SKILL_META = {
  reading:   { icon:'📖', color:'#2dd4a0' },
  listening: { icon:'🎧', color:'#60a5fa' },
  writing:   { icon:'✍️', color:'#a78bfa' },
  speaking:  { icon:'🗣️', color:'#fb923c' },
};

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [dash,    setDash]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.dashboard()
      .then(setDash)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg" /></div>;

  const streak  = dash?.streak;
  const profiles = dash?.skill_profiles || [];

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="profile-hero card">
        <div className="profile-avatar-lg">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{user?.username}</h2>
          <p className="profile-email">{user?.email || '—'}</p>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <span className={`badge badge-${user?.role === 'admin' ? 'yellow' : user?.role === 'creator' ? 'blue' : 'green'}`}>
              {user?.role}
            </span>
            <span className="badge badge-gray">ID #{user?.id}</span>
          </div>
        </div>
        <div className="profile-streak">
          <div className="streak-fire">🔥</div>
          <div className="streak-count">{streak?.current_streak ?? 0}</div>
          <div className="streak-label">day streak</div>
          {streak?.longest_streak > 0 && (
            <div className="streak-best">Best: {streak.longest_streak} days</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom:24 }}>
        <div className="stat-card">
          <div className="stat-label">Tổng câu đã làm</div>
          <div className="stat-value">{dash?.total_questions_done ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Thẻ cần ôn hôm nay</div>
          <div className="stat-value warning">{dash?.due_reviews ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Streak dài nhất</div>
          <div className="stat-value accent">{streak?.longest_streak ?? 0} ngày</div>
        </div>
      </div>

      {/* Skill levels */}
      <div className="section-label">Kỹ năng</div>
      <div className="skill-level-grid">
        {profiles.map(p => {
          const meta = SKILL_META[p.skill];
          const pct  = p.questions_done === 0 ? 0
            : Math.round(p.questions_correct / Math.max(p.questions_done, 1) * 100);
          return (
            <div key={p.skill} className="skill-level-card card">
              <div className="slc-top">
                <span style={{ fontSize:24 }}>{meta.icon}</span>
                <span className="slc-level" style={{ color: meta.color }}>{p.current_level}</span>
              </div>
              <div className="slc-name" style={{ textTransform:'capitalize' }}>{p.skill}</div>
              <div className="progress-wrap" style={{ margin:'10px 0 6px' }}>
                <div className="progress-fill" style={{ width:`${pct}%`, background: meta.color }} />
              </div>
              <div className="slc-stats">{p.questions_done} câu · {pct}% đúng</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

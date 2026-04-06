import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Dashboard.css';

const SKILL_META = {
  reading:   { icon: '📖', color: '#2dd4a0', label: 'Reading' },
  listening: { icon: '🎧', color: '#60a5fa', label: 'Listening' },
  writing:   { icon: '✍️', color: '#a78bfa', label: 'Writing' },
  speaking:  { icon: '🗣️', color: '#fb923c', label: 'Speaking' },
};

const LEVEL_PROGRESS = { A1:0, A2:1, B1:2, B2:3, C1:4, C2:5 };
const LEVEL_LABELS   = ['A1','A2','B1','B2','C1','C2'];

function SkillCard({ profile, onClick }) {
  const meta = SKILL_META[profile.skill];
  const pct  = profile.questions_done === 0 ? 0
    : Math.min(100, Math.round((profile.questions_correct / Math.max(profile.questions_done,1)) * 100));
  return (
    <div className="skill-card" onClick={onClick} style={{ '--accent-skill': meta.color }}>
      <div className="skill-card-top">
        <span className="skill-icon">{meta.icon}</span>
        <span className="badge" style={{ background: `${meta.color}20`, color: meta.color, fontSize: 11 }}>
          {profile.current_level}
        </span>
      </div>
      <div className="skill-name">{meta.label}</div>
      <div className="skill-sub">{profile.questions_done} câu đã làm</div>
      <div className="progress-wrap" style={{ marginTop: 10 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: meta.color }} />
      </div>
      <div className="skill-pct">{pct}% accuracy</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    userApi.dashboard()
      .then(setData)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="loading-page"><div className="spinner spinner-lg" /><span>Đang tải...</span></div>
  );

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">{greet}, {user?.username} 👋</h1>
        <p className="page-sub">Đừng để streak bị gián đoạn — hãy học ít nhất 1 bài hôm nay!</p>
      </div>

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">🔥 Streak</div>
          <div className="stat-value accent">{data?.streak?.current_streak ?? 0} ngày</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng câu đã làm</div>
          <div className="stat-value">{data?.total_questions_done ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📅 Cần ôn tập</div>
          <div className="stat-value warning">{data?.due_reviews ?? 0} thẻ</div>
        </div>
      </div>

      {/* Skills */}
      <div className="section-title">Kỹ năng của bạn</div>
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {(data?.skill_profiles || []).map(p => (
          <SkillCard key={p.skill} profile={p}
            onClick={() => navigate(`/practice?skill=${p.skill}`)} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="section-title">Hành động nhanh</div>
      <div className="quick-actions">
        {[
          { label: '▶  Luyện tập ngay',      sub: 'Làm câu hỏi mới',        to: '/skills',    cls: 'btn-primary' },
          { label: '↻  Ôn tập thẻ hôm nay', sub: `${data?.due_reviews??0} thẻ đang chờ`, to: '/review',    cls: 'btn-secondary' },
          { label: '✦  Chat với AI',          sub: 'Luyện writing tự do',     to: '/chat',      cls: 'btn-secondary' },
          { label: '▲  Xem tiến độ',          sub: 'CEFR level progression',  to: '/progress',  cls: 'btn-secondary' },
        ].map(a => (
          <div key={a.label} className="quick-card" onClick={() => navigate(a.to)}>
            <button className={`btn ${a.cls}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              {a.label}
            </button>
            <p className="quick-sub">{a.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

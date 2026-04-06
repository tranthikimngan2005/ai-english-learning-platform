import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Skills.css';

const SKILL_META = {
  reading:   { icon:'📖', color:'#2dd4a0', desc:'Đọc hiểu văn bản, báo, tài liệu học thuật' },
  listening: { icon:'🎧', color:'#60a5fa', desc:'Nghe và hiểu hội thoại, bài giảng, podcast' },
  writing:   { icon:'✍️', color:'#a78bfa', desc:'Viết đoạn văn, email, bài luận có cấu trúc' },
  speaking:  { icon:'🗣️', color:'#fb923c', desc:'Phát âm, hội thoại và diễn đạt ý kiến' },
};

export default function Skills() {
  const navigate = useNavigate();
  const toast = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    userApi.progress()
      .then(setProfiles)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"/></div>;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">Chọn kỹ năng</h1>
        <p className="page-sub">Chọn một kỹ năng để bắt đầu luyện tập hoặc ôn tập</p>
      </div>

      <div className="skills-grid">
        {profiles.map(p => {
          const meta = SKILL_META[p.skill];
          const pct  = p.questions_done === 0 ? 0
            : Math.round(p.questions_correct / Math.max(p.questions_done,1) * 100);

          return (
            <div key={p.skill} className="skill-full-card"
              style={{'--sc':meta.color}}
              onClick={() => navigate(`/practice?skill=${p.skill}`)}>
              <div className="sfc-icon">{meta.icon}</div>
              <div className="sfc-body">
                <div className="sfc-name">{p.skill.charAt(0).toUpperCase()+p.skill.slice(1)}</div>
                <div className="sfc-desc">{meta.desc}</div>
              </div>
              <div className="sfc-right">
                <div className="sfc-level" style={{color:meta.color}}>{p.current_level}</div>
                <div className="sfc-pct">{pct}%</div>
                <div className="progress-wrap" style={{width:80}}>
                  <div className="progress-fill" style={{width:`${pct}%`,background:meta.color}} />
                </div>
              </div>
              <div className="sfc-arrow">→</div>
            </div>
          );
        })}
      </div>

      <div style={{marginTop:32,display:'flex',gap:12}}>
        <button className="btn btn-primary" onClick={()=>navigate('/practice')}>
          ▶ Luyện tập tổng hợp
        </button>
        <button className="btn btn-secondary" onClick={()=>navigate('/review')}>
          ↻ Ôn tập hôm nay
        </button>
      </div>
    </div>
  );
}

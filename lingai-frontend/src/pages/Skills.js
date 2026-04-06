import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/client';
import { IMG_VOCAB, IMG_LISTEN, IMG_GRAMMAR, IMG_CHAT } from '../assets/images';
import './Skills.css';

const SKILL_META = {
  reading:   { img:IMG_VOCAB,   color:'#2196b0', desc:'Đọc hiểu văn bản, báo, tài liệu học thuật' },
  listening: { img:IMG_LISTEN,  color:'#ff8c42', desc:'Nghe hiểu hội thoại, bài giảng, podcast' },
  writing:   { img:IMG_GRAMMAR, color:'#9b6ff5', desc:'Viết đoạn văn, email, bài luận có cấu trúc' },
  speaking:  { img:IMG_CHAT,    color:'#4ecb8d', desc:'Phát âm, hội thoại và diễn đạt ý kiến' },
};

export default function Skills() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  useEffect(() => {
    userApi.progress()
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"/></div>;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">⭐ Chọn kỹ năng</h1>
        <p className="page-sub">Click vào kỹ năng để bắt đầu luyện tập</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
        {profiles.map(p=>{
          const m   = SKILL_META[p.skill];
          const pct = p.questions_done===0?0:Math.round(p.questions_correct/Math.max(p.questions_done,1)*100);
          return (
            <div key={p.skill} className="skill-full-card card" style={{'--sc':m.color}}
              onClick={()=>navigate(`/practice?skill=${p.skill}`)}>
              <img className="sfc-img" src={m.img} alt={p.skill} />
              <div className="sfc-body">
                <div className="sfc-name">{p.skill.charAt(0).toUpperCase()+p.skill.slice(1)}</div>
                <div className="sfc-desc">{m.desc}</div>
              </div>
              <div className="sfc-right">
                <div className="sfc-level" style={{color:m.color}}>{p.current_level}</div>
                <div className="progress-wrap" style={{width:90,marginTop:6}}>
                  <div className="progress-fill" style={{width:`${pct}%`,background:m.color}} />
                </div>
                <div style={{fontSize:11,color:'var(--text3)',fontWeight:600,marginTop:4,textAlign:'right'}}>{pct}%</div>
              </div>
              <span className="sfc-arrow">→</span>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:12}}>
        <button className="btn btn-primary" onClick={()=>navigate('/practice')}>▶ Luyện tập tổng hợp</button>
        <button className="btn btn-yellow"  onClick={()=>navigate('/review')}>🔁 Ôn tập hôm nay</button>
      </div>
    </div>
  );
}

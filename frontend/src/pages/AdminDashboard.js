import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Admin.css';

export default function AdminDashboard() {
  const toast = useToast();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(e=>toast(e.message,'error')).finally(()=>setLoading(false));
  }, [toast]);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"/></div>;

  const cards = [
    { label:'Tổng users',          value: stats?.total_users,       cls:'' },
    { label:'Users mới (7 ngày)',  value: stats?.active_users_7d,   cls:'accent' },
    { label:'Tổng câu hỏi',        value: stats?.total_questions,   cls:'' },
    { label:'Chờ duyệt (câu hỏi)',value: stats?.pending_questions, cls:'warning' },
    { label:'Tổng bài học',        value: stats?.total_lessons,     cls:'' },
    { label:'Chờ duyệt (bài học)', value: stats?.pending_lessons,   cls:'warning' },
  ];

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-sub">Tổng quan hệ thống LingAI</p>
      </div>

      <div className="grid-3" style={{marginBottom:32}}>
        {cards.map(c=>(
          <div key={c.label} className="stat-card">
            <div className="stat-label">{c.label}</div>
            <div className={`stat-value ${c.cls}`}>{c.value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="admin-quick-nav">
        <p style={{fontSize:12,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text3)',marginBottom:12}}>
          Điều hướng nhanh
        </p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <a href="/admin/users"   className="btn btn-secondary">⬡ Quản lý users</a>
          <a href="/admin/content" className="btn btn-secondary">⬡ Duyệt nội dung</a>
        </div>
      </div>
    </div>
  );
}

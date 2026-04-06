import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { IMG_HERO, IMG_GRAMMAR, IMG_PROGRESS } from '../assets/images';
import './Admin.css';

export default function AdminDashboard() {
  const toast=useToast();
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{adminApi.stats().then(setStats).catch(e=>toast(e.message,'error')).finally(()=>setLoading(false));}, [toast]);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"/></div>;

  const cards=[
    {img:IMG_HERO,     label:'Tổng users',           value:stats?.total_users,       cls:'accent'},
    {img:IMG_GRAMMAR,  label:'Câu hỏi chờ duyệt',    value:stats?.pending_questions, cls:'warning'},
    {img:IMG_PROGRESS, label:'Bài học chờ duyệt',     value:stats?.pending_lessons,   cls:''},
    {img:IMG_HERO,     label:'Users mới (7 ngày)',    value:stats?.active_users_7d,   cls:'mint'},
    {img:IMG_GRAMMAR,  label:'Tổng câu hỏi',          value:stats?.total_questions,   cls:''},
    {img:IMG_PROGRESS, label:'Tổng bài học',           value:stats?.total_lessons,     cls:''},
  ];

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">🛡️ Admin Dashboard</h1>
        <p className="page-sub">Tổng quan hệ thống LingAI</p>
      </div>
      <div className="grid-3" style={{marginBottom:28}}>
        {cards.map((c,i)=>(
          <div key={i} className="stat-card" style={{animationDelay:`${i*0.07}s`}}>
            <img className="stat-card-img" src={c.img} alt="" style={{animation:`float ${3+i*0.2}s ease-in-out infinite`}}/>
            <div>
              <div className="stat-label">{c.label}</div>
              <div className={`stat-value ${c.cls}`}>{c.value??'—'}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="admin-quick-nav card">
        <p style={{fontSize:12,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text3)',marginBottom:12}}>⚡ Điều hướng nhanh</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <a href="/admin/users"   className="btn btn-secondary">👥 Quản lý users</a>
          <a href="/admin/content" className="btn btn-secondary">✅ Duyệt nội dung</a>
        </div>
      </div>
    </div>
  );
}

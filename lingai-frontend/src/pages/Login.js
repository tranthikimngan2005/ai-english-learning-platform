import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { IMG_HERO } from '../assets/images';
import './Auth.css';

const STARS = [
  { top:'8%', left:'10%', delay:'0s' },
  { top:'15%', right:'12%', delay:'0.5s' },
  { top:'70%', left:'6%',  delay:'1s' },
  { top:'80%', right:'8%', delay:'1.5s' },
  { top:'45%', left:'90%', delay:'0.8s' },
];

export default function Login() {
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Vui lòng nhập email hoặc username';
    if (!form.password) e.password = 'Vui lòng nhập password';
    return e;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const data = await authApi.login(form.email, form.password);
      login(data.access_token, { id:data.user_id, username:data.username, role:data.role });
      toast('Chào mừng trở lại! 🐧');
      navigate('/dashboard');
    } catch(err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const set = k => ev => { setForm(f=>({...f,[k]:ev.target.value})); setErrors(e=>({...e,[k]:''})); };

  return (
    <div className="auth-page">
      <div className="auth-cloud auth-cloud-1" />
      <div className="auth-cloud auth-cloud-2" />
      <div className="auth-cloud auth-cloud-3" />
      <div className="auth-stars">
        {STARS.map((s,i) => <span key={i} className="auth-star" style={{top:s.top,left:s.left,right:s.right,animationDelay:s.delay}}>✨</span>)}
      </div>

      <div style={{ position:'relative', zIndex:1 }}>
        <div className="auth-mascot-wrap">
          <img className="auth-mascot" src={IMG_HERO} alt="Pengwin" />
        </div>
        <div className="auth-card">
          <div className="auth-logo">
            <span className="logo-text">Ling<span>AI</span></span>
          </div>
          <h2 className="auth-title">Chào mừng trở lại!</h2>
          <p className="auth-sub">Đăng nhập để tiếp tục hành trình học tiếng Anh 🎓</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email hoặc Username</label>
              <input className={`form-input ${errors.email?'error':''}`}
                type="text" placeholder="you@email.com"
                value={form.email} onChange={set('email')} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className={`form-input ${errors.password?'error':''}`}
                type="password" placeholder="••••••••"
                value={form.password} onChange={set('password')} />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading}>
              {loading ? <><span className="spinner"/>Đang đăng nhập...</> : '🐧 Đăng nhập'}
            </button>
          </form>

          <div className="auth-demo">
            <div className="auth-demo-title">🎮 Tài khoản demo</div>
            <div className="demo-accounts">
              {[
                { label:'Student',  email:'an@lingai.com',      pw:'student123', cls:'badge-green' },
                { label:'Creator',  email:'creator@lingai.com', pw:'creator123', cls:'badge-blue' },
                { label:'Admin',    email:'admin@lingai.com',   pw:'admin123',   cls:'badge-yellow' },
              ].map(a => (
                <button key={a.label} className="demo-btn"
                  onClick={() => setForm({email:a.email, password:a.pw})}>
                  <span className={`badge ${a.cls}`}>{a.label}</span>
                  <span>{a.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

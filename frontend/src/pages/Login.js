import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast     = useToast();
  const navigate  = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email hoặc username là bắt buộc';
    if (!form.password) e.password = 'Password là bắt buộc';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const data = await authApi.login(form.email, form.password);
      login(data.access_token, {
        id: data.user_id, username: data.username, role: data.role,
      });
      toast('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (ev) => {
    setForm(f => ({ ...f, [k]: ev.target.value }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb orb1" />
        <div className="auth-orb orb2" />
      </div>

      <div className="auth-card fade-up">
        <div className="auth-logo">
          <span className="logo-text">Pengwin</span>
        </div>
        <h2 className="auth-title">Chào mừng trở lại</h2>
        <p className="auth-sub">Đăng nhập để tiếp tục học</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email hoặc Username</label>
            <input
              className={`form-input ${errors.email ? 'error' : ''}`}
              type="text" placeholder="you@email.com"
              value={form.email} onChange={set('email')}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input ${errors.password ? 'error' : ''}`}
              type="password" placeholder="••••••••"
              value={form.password} onChange={set('password')}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><span className="spinner" />Đang đăng nhập...</> : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-demo">
          <p className="auth-demo-title">Tài khoản demo</p>
          <div className="demo-accounts">
            {[
              { label: 'Student', email: 'an@pengwin.com', pw: 'student123' },
              { label: 'Creator', email: 'creator@pengwin.com', pw: 'creator123' },
              { label: 'Admin',   email: 'admin@pengwin.com',   pw: 'admin123' },
            ].map(acc => (
              <button key={acc.label} className="demo-btn"
                onClick={() => setForm({ email: acc.email, password: acc.pw })}>
                <span className={`badge badge-${acc.label === 'Admin' ? 'yellow' : acc.label === 'Creator' ? 'blue' : 'green'}`}>
                  {acc.label}
                </span>
                <span>{acc.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}


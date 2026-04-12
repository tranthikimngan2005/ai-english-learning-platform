import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Admin.css';

const ROLES = ['student','creator','admin'];

export default function AdminUsers() {
  const toast = useToast();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await adminApi.users()); }
    catch (e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (id, role) => {
    try { await adminApi.changeRole(id, role); toast('Role updated!'); load(); }
    catch (e) { toast(e.message,'error'); }
  };

  const toggleBan = async (user) => {
    const msg = user.is_active ? `Ban user "${user.username}"?` : `Unban user "${user.username}"?`;
    if (!window.confirm(msg)) return;
    try { await adminApi.ban(user.id, !user.is_active); toast(user.is_active ? 'User banned!' : 'User unbanned!'); load(); }
    catch (e) { toast(e.message,'error'); }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">Manage users</h1>
        <p className="page-sub">{users.length} users</p>
      </div>

      <div style={{marginBottom:16}}>
        <input className="form-input" style={{maxWidth:320}}
          placeholder="Search username or email..."
          value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading-page" style={{height:200}}><div className="spinner spinner-lg"/></div> : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created at</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u=>(
                <tr key={u.id}>
                  <td style={{color:'var(--text3)'}}>{u.id}</td>
                  <td style={{fontWeight:500,color:'var(--text)'}}>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <select className="form-select" style={{width:110,padding:'4px 8px',fontSize:12}}
                      value={u.role}
                      onChange={e=>changeRole(u.id,e.target.value)}>
                      {ROLES.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td style={{fontSize:12,color:'var(--text3)'}}>
                    {new Date(u.created_at).toLocaleDateString('en-US')}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={()=>toggleBan(u)}>
                      {u.is_active ? 'Ban' : 'Unban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

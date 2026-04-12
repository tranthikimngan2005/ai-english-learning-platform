import { useEffect, useState, useCallback } from 'react';
import { lessonApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Creator.css';

const SKILLS = ['reading','listening','writing','speaking'];
const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const STATUS_BADGE = { pending:'badge-yellow', approved:'badge-green', rejected:'badge-red' };
const EMPTY_FORM = { title:'', skill:'reading', level:'B1', content:'', audio_url:'' };

export default function CreatorLessons() {
  const toast = useToast();
  const [lessons,  setLessons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setLessons(await lessonApi.list()); }
    catch (e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (l) => {
    setForm({ title:l.title, skill:l.skill, level:l.level, content:l.content, audio_url:l.audio_url||'' });
    setEditId(l.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast('Title and content are required','error'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, audio_url: form.audio_url||null };
      if (editId) await lessonApi.update(editId, payload);
      else        await lessonApi.create(payload);
      toast(editId ? 'Lesson updated!' : 'Lesson created — waiting for admin review!');
      setShowForm(false); load();
    } catch (e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lesson?')) return;
    try { await lessonApi.delete(id); toast('Deleted!'); load(); }
    catch (e) { toast(e.message,'error'); }
  };

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  return (
    <div className="fade-up">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h1 className="page-title">Lesson management</h1>
          <p className="page-sub">Create and edit lessons; waiting for admin review</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>✚ Create lesson</button>
      </div>

      {loading ? <div className="loading-page" style={{height:200}}><div className="spinner spinner-lg"/></div> : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Skill</th><th>Level</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {lessons.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text3)',padding:'32px 0'}}>
                  No lessons yet
                </td></tr>
              ) : lessons.map(l=>(
                <tr key={l.id}>
                  <td className="td-content"><strong style={{color:'var(--text)'}}>{l.title}</strong></td>
                  <td><span className="badge badge-green" style={{textTransform:'capitalize'}}>{l.skill}</span></td>
                  <td><span className="badge badge-blue">{l.level}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[l.status]}`}>{l.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(l)}>✎ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(l.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit lesson' : 'Create new lesson'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{marginBottom:14}}>
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="Lesson title..."
                  value={form.title} onChange={set('title')} />
              </div>
              <div className="grid-2" style={{gap:10,marginBottom:14}}>
                <div className="form-group">
                  <label className="form-label">Skill</label>
                  <select className="form-select" value={form.skill} onChange={set('skill')}>
                    {SKILLS.map(s=><option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select className="form-select" value={form.level} onChange={set('level')}>
                    {LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{marginBottom:14}}>
                <label className="form-label">Lesson content</label>
                <textarea className="form-textarea" rows={5}
                  placeholder="Enter the full lesson content..."
                  value={form.content} onChange={set('content')} />
              </div>
              <div className="form-group" style={{marginBottom:14}}>
                <label className="form-label">Audio URL (optional, for Listening)</label>
                <input className="form-input" placeholder="/audio/lesson_01.mp3"
                  value={form.audio_url} onChange={set('audio_url')} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner"/>Saving...</> : editId ? 'Update' : 'Create lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

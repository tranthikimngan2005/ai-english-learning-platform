import { useEffect, useState, useCallback } from 'react';
import { questionApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Creator.css';

const SKILLS  = ['reading','listening','writing','speaking'];
const LEVELS  = ['A1','A2','B1','B2','C1','C2'];
const TYPES   = ['mcq','fill_blank','writing','speaking'];
const STATUS_BADGE = { pending:'badge-yellow', approved:'badge-green', rejected:'badge-red' };

const EMPTY_FORM = {
  skill:'reading', level:'B1', q_type:'mcq',
  content:'', options:['','','',''], correct_answer:'', explanation:'', ai_prompt:'',
};

export default function CreatorQuestions() {
  const toast = useToast();
  const [questions, setQuestions]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [showForm,  setShowForm]    = useState(false);
  const [editId,    setEditId]      = useState(null);
  const [form,      setForm]        = useState(EMPTY_FORM);
  const [saving,    setSaving]      = useState(false);
  const [filterSkill, setFilterSkill] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSkill) params.skill = filterSkill;
      if (filterLevel) params.level = filterLevel;
      const data = await questionApi.list(params);
      setQuestions(data);
    } catch (e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [filterSkill, filterLevel, toast]);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (q) => {
    setForm({
      skill: q.skill, level: q.level, q_type: q.q_type,
      content: q.content,
      options: q.options || ['','','',''],
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      ai_prompt: q.ai_prompt || '',
    });
    setEditId(q.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.content.trim() || !form.correct_answer.trim()) {
      toast('Vui lòng điền đầy đủ nội dung và đáp án','error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        options: form.q_type === 'mcq' ? form.options.filter(Boolean) : null,
      };
      if (editId) await questionApi.update(editId, payload);
      else        await questionApi.create(payload);
      toast(editId ? 'Đã cập nhật câu hỏi!' : 'Đã tạo câu hỏi — chờ admin duyệt!');
      setShowForm(false);
      load();
    } catch (e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;
    try { await questionApi.delete(id); toast('Đã xóa!'); load(); }
    catch (e) { toast(e.message,'error'); }
  };

  const setOpt = (i, val) => setForm(f => {
    const opts = [...f.options]; opts[i] = val; return { ...f, options: opts };
  });

  return (
    <div className="fade-up">
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="page-title">Quản lý câu hỏi</h1>
          <p className="page-sub">Tạo và chỉnh sửa câu hỏi · chờ admin duyệt trước khi hiển thị</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>✚ Tạo câu hỏi</button>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <select className="form-select" style={{ width:160 }}
          value={filterSkill} onChange={e=>setFilterSkill(e.target.value)}>
          <option value="">Tất cả kỹ năng</option>
          {SKILLS.map(s=><option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
        </select>
        <select className="form-select" style={{ width:140 }}
          value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}>
          <option value="">Tất cả level</option>
          {LEVELS.map(l=><option key={l}>{l}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--text3)' }}>{questions.length} câu hỏi</span>
      </div>

      {/* Table */}
      {loading ? <div className="loading-page" style={{height:200}}><div className="spinner spinner-lg"/></div> : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nội dung</th><th>Kỹ năng</th><th>Level</th>
                <th>Loại</th><th>Trạng thái</th><th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text3)',padding:'32px 0'}}>
                  Chưa có câu hỏi nào
                </td></tr>
              ) : questions.map(q=>(
                <tr key={q.id}>
                  <td className="td-content">{q.content.slice(0,70)}{q.content.length>70?'…':''}</td>
                  <td><span className="badge badge-green" style={{textTransform:'capitalize'}}>{q.skill}</span></td>
                  <td><span className="badge badge-blue">{q.level}</span></td>
                  <td><span className="badge badge-gray">{q.q_type.replace('_',' ')}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[q.status]}`}>{q.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(q)}>✎ Sửa</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(q.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowForm(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="grid-3" style={{gap:10,marginBottom:16}}>
                <div className="form-group">
                  <label className="form-label">Kỹ năng</label>
                  <select className="form-select" value={form.skill}
                    onChange={e=>setForm(f=>({...f,skill:e.target.value}))}>
                    {SKILLS.map(s=><option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select className="form-select" value={form.level}
                    onChange={e=>setForm(f=>({...f,level:e.target.value}))}>
                    {LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Loại câu hỏi</label>
                  <select className="form-select" value={form.q_type}
                    onChange={e=>setForm(f=>({...f,q_type:e.target.value}))}>
                    {TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{marginBottom:16}}>
                <label className="form-label">Nội dung câu hỏi</label>
                <textarea className="form-textarea" rows={3}
                  placeholder="Nhập nội dung câu hỏi..."
                  value={form.content}
                  onChange={e=>setForm(f=>({...f,content:e.target.value}))} />
              </div>

              {form.q_type === 'mcq' && (
                <div style={{marginBottom:16}}>
                  <label className="form-label" style={{display:'block',marginBottom:8}}>Các lựa chọn (MCQ)</label>
                  {form.options.map((opt,i)=>(
                    <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                      <span style={{width:24,fontSize:13,color:'var(--text3)',fontWeight:600}}>
                        {String.fromCharCode(65+i)}.
                      </span>
                      <input className="form-input" placeholder={`Lựa chọn ${String.fromCharCode(65+i)}`}
                        value={opt} onChange={e=>setOpt(i,e.target.value)} />
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group" style={{marginBottom:16}}>
                <label className="form-label">Đáp án đúng</label>
                <input className="form-input" placeholder="Nhập đáp án chính xác..."
                  value={form.correct_answer}
                  onChange={e=>setForm(f=>({...f,correct_answer:e.target.value}))} />
              </div>

              <div className="form-group" style={{marginBottom:16}}>
                <label className="form-label">Giải thích (tùy chọn)</label>
                <textarea className="form-textarea" rows={2}
                  placeholder="Giải thích tại sao đáp án này đúng..."
                  value={form.explanation}
                  onChange={e=>setForm(f=>({...f,explanation:e.target.value}))} />
              </div>

              {(form.q_type==='writing'||form.q_type==='speaking') && (
                <div className="form-group" style={{marginBottom:16}}>
                  <label className="form-label">AI Evaluation Prompt</label>
                  <textarea className="form-textarea" rows={2}
                    placeholder="Prompt hướng dẫn AI chấm bài..."
                    value={form.ai_prompt}
                    onChange={e=>setForm(f=>({...f,ai_prompt:e.target.value}))} />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner"/>Đang lưu...</> : editId ? 'Cập nhật' : 'Tạo câu hỏi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

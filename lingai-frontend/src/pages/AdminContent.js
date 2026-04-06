import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './Admin.css';

function ContentTable({ title, items, onApprove, onReject, loading }) {
  return (
    <div style={{marginBottom:32}}>
      <h2 style={{fontSize:15,fontWeight:600,color:'var(--text)',marginBottom:12}}>
        {title}
        <span className="badge badge-yellow" style={{marginLeft:10}}>{items.length} chờ duyệt</span>
      </h2>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nội dung</th><th>Kỹ năng</th><th>Level</th>
              <th>Creator ID</th><th>Ngày tạo</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:'center',padding:'32px 0'}}>
                <div className="spinner" style={{margin:'0 auto'}}/>
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text3)',padding:'32px 0'}}>
                ✓ Không có nội dung nào cần duyệt
              </td></tr>
            ) : items.map(item=>(
              <tr key={item.id}>
                <td className="td-content">
                  {(item.title || item.content || '').slice(0,70)}
                  {(item.title || item.content || '').length > 70 ? '…' : ''}
                </td>
                <td><span className="badge badge-green" style={{textTransform:'capitalize'}}>{item.skill}</span></td>
                <td><span className="badge badge-blue">{item.level}</span></td>
                <td style={{color:'var(--text3)'}}>#{item.creator_id}</td>
                <td style={{fontSize:12,color:'var(--text3)'}}>
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <div style={{display:'flex',gap:6}}>
                    <button className="btn btn-sm" style={{background:'rgba(45,212,160,0.15)',color:'var(--accent)',border:'1px solid rgba(45,212,160,0.3)'}}
                      onClick={()=>onApprove(item.id)}>✓ Duyệt</button>
                    <button className="btn btn-danger btn-sm"
                      onClick={()=>onReject(item.id)}>✕ Từ chối</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminContent() {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [lessons,   setLessons]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [qs, ls] = await Promise.all([
        adminApi.pendingQuestions(),
        adminApi.pendingLessons(),
      ]);
      setQuestions(qs); setLessons(ls);
    } catch (e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const approveQ = async (id) => {
    try { await adminApi.moderateQ(id,'approved'); toast('Đã duyệt câu hỏi!'); load(); }
    catch (e) { toast(e.message,'error'); }
  };
  const rejectQ = async (id) => {
    try { await adminApi.moderateQ(id,'rejected'); toast('Đã từ chối!'); load(); }
    catch (e) { toast(e.message,'error'); }
  };
  const approveL = async (id) => {
    try { await adminApi.moderateL(id,'approved'); toast('Đã duyệt bài học!'); load(); }
    catch (e) { toast(e.message,'error'); }
  };
  const rejectL = async (id) => {
    try { await adminApi.moderateL(id,'rejected'); toast('Đã từ chối!'); load(); }
    catch (e) { toast(e.message,'error'); }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1 className="page-title">Kiểm duyệt nội dung</h1>
        <p className="page-sub">Duyệt hoặc từ chối câu hỏi và bài học từ creators</p>
      </div>

      <ContentTable title="Câu hỏi" items={questions} loading={loading}
        onApprove={approveQ} onReject={rejectQ} />
      <ContentTable title="Bài học" items={lessons} loading={loading}
        onApprove={approveL} onReject={rejectL} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { CATEGORIES, money, monthLabel, thisMonth } from '../utils';

const cls = { Safe: 'safe', 'Near Limit': 'near', 'Limit Reached': 'limit', Exceeded: 'exceeded' };

export default function Budgets() {
  const { user } = useAuth();
  const { refreshKey, refresh } = useOutletContext();
  const [month, setMonth] = useState(thisMonth());
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/budgets', { params: { month } }).then((r) => setBudgets(r.data));
  }, [month, refreshKey]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!(Number(form.limit) > 0)) return setError('Limit must be greater than 0');
    try {
      await api.post('/budgets', { category: form.category, limit: Number(form.limit), month });
      setForm(null);
      refresh();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete budget for ${b.category}?`)) return;
    await api.delete(`/budgets/${b._id}`);
    refresh();
  };

  const over = budgets.filter((b) => b.percent > 100);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{monthLabel(month)} Budget Summary</h1>
          <p>Set monthly limits per category and track how much is used.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          <button className="btn primary" onClick={() => setForm({ category: CATEGORIES.expense[0], limit: '' })}><Plus size={16} /> Set budget</button>
        </div>
      </div>

      {over.length > 0 && (
        <div className="alert">Warning: you exceeded the budget for {over.map((b) => b.category).join(', ')}.</div>
      )}

      {budgets.length === 0 ? (
        <div className="card empty">No budgets for this month. Click "Set budget" to add one.</div>
      ) : (
        <div className="grid grid-2">
          {budgets.map((b) => {
            const c = cls[b.status];
            return (
              <div className="card" key={b._id}>
                <div className="between">
                  <h3>{b.category}</h3>
                  <button className="icon-btn sm" onClick={() => remove(b)} aria-label="Delete"><Trash2 size={15} color="var(--red)" /></button>
                </div>
                <div className="prog-row">
                  <div className="progress"><div className={`bar-${c === 'safe' ? 'safe' : c === 'near' ? 'near' : c === 'limit' ? 'limit' : 'exceeded'}`} style={{ width: `${Math.min(b.percent, 100)}%` }} /></div>
                  <strong>{b.percent}%</strong>
                </div>
                <div className="between">
                  <span className="muted">{money(b.spent, user.currency)} / {money(b.limit, user.currency)}</span>
                  <span className={`status ${c}`}>{b.status}</span>
                </div>
                <button className="btn mt" style={{ padding: '6px 12px' }} onClick={() => setForm({ category: b.category, limit: b.limit })}>Edit limit</button>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <Modal title="Set budget" onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <label className="field">
              <span>Category</span>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.expense.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Monthly limit ({user.currency})</span>
              <input className="input" type="number" min="1" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} autoFocus />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

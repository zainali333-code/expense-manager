import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { fmtDate, money } from '../utils';

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(null); // new goal
  const [adding, setAdding] = useState(null); // { goal, amount }
  const [error, setError] = useState('');

  const load = () => api.get('/goals').then((r) => setGoals(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Goal name is required');
    if (!(Number(form.targetAmount) > 0)) return setError('Target must be greater than 0');
    try {
      await api.post('/goals', { name: form.name, targetAmount: Number(form.targetAmount), savedAmount: Number(form.savedAmount) || 0, deadline: form.deadline });
      setForm(null);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const addSavings = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/goals/${adding.goal._id}/add`, { amount: Number(adding.amount) });
      setAdding(null);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (g) => {
    if (!window.confirm(`Delete goal "${g.name}"?`)) return;
    await api.delete(`/goals/${g._id}`);
    load();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Savings Goals</h1>
          <p>Save for a laptop, phone, car or anything else.</p>
        </div>
        <button className="btn primary" onClick={() => { setError(''); setForm({ name: '', targetAmount: '', savedAmount: '', deadline: '' }); }}><Plus size={16} /> New goal</button>
      </div>

      {goals.length === 0 ? (
        <div className="card empty">No goals yet. Create your first one.</div>
      ) : (
        <div className="grid grid-2">
          {goals.map((g) => {
            const pct = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
            return (
              <div className="card" key={g._id}>
                <div className="between">
                  <h3>{g.name}</h3>
                  <button className="icon-btn sm" onClick={() => remove(g)} aria-label="Delete"><Trash2 size={15} color="var(--red)" /></button>
                </div>
                <div className="prog-row">
                  <div className="progress"><div className={pct >= 100 ? 'bar-safe' : 'bar-limit'} style={{ width: `${pct}%` }} /></div>
                  <strong>{pct}%</strong>
                </div>
                <div className="between">
                  <span className="muted">{money(g.savedAmount, user.currency)} / {money(g.targetAmount, user.currency)}</span>
                  {g.deadline && <span className="muted">By {fmtDate(g.deadline)}</span>}
                </div>
                <button className="btn mt" style={{ padding: '6px 12px' }} onClick={() => { setError(''); setAdding({ goal: g, amount: '' }); }}>Add savings</button>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <Modal title="New savings goal" onClose={() => setForm(null)}>
          <form onSubmit={create}>
            <label className="field"><span>Goal name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></label>
            <div className="row">
              <label className="field"><span>Target amount</span><input className="input" type="number" min="1" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></label>
              <label className="field"><span>Already saved</span><input className="input" type="number" min="0" value={form.savedAmount} onChange={(e) => setForm({ ...form, savedAmount: e.target.value })} /></label>
            </div>
            <label className="field"><span>Deadline (optional)</span><input className="input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>Create goal</button>
          </form>
        </Modal>
      )}

      {adding && (
        <Modal title={`Add to ${adding.goal.name}`} onClose={() => setAdding(null)}>
          <form onSubmit={addSavings}>
            <label className="field"><span>Amount ({user.currency})</span><input className="input" type="number" min="1" value={adding.amount} onChange={(e) => setAdding({ ...adding, amount: e.target.value })} autoFocus /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>Add</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

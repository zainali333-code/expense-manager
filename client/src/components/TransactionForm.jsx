import { useState } from 'react';
import Modal from './Modal.jsx';
import api, { errMsg } from '../api';
import { CATEGORIES, METHODS, today } from '../utils';

export default function TransactionForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(
    initial
      ? {
          type: initial.type,
          title: initial.title,
          amount: initial.amount,
          category: initial.category,
          paymentMethod: initial.paymentMethod,
          date: initial.date.slice(0, 10),
          note: initial.note || '',
        }
      : { type: 'expense', title: '', amount: '', category: 'Food', paymentMethod: 'Cash', date: today(), note: '' }
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const setType = (type) => setF({ ...f, type, category: CATEGORIES[type][0] });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.title.trim()) return setError('Title is required');
    if (!(Number(f.amount) > 0)) return setError('Amount must be greater than 0');
    setBusy(true);
    try {
      const body = { ...f, amount: Number(f.amount) };
      if (initial) await api.put(`/transactions/${initial._id}`, body);
      else await api.post('/transactions', body);
      onSaved();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="seg">
          {['expense', 'income'].map((t) => (
            <button type="button" key={t} className={f.type === t ? `active ${t}` : ''} onClick={() => setType(t)}>
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Title</span>
          <input className="input" value={f.title} onChange={set('title')} placeholder="e.g. Lunch, Salary" autoFocus />
        </label>
        <div className="row">
          <label className="field">
            <span>Amount</span>
            <input className="input" type="number" min="0" step="0.01" value={f.amount} onChange={set('amount')} />
          </label>
          <label className="field">
            <span>Date</span>
            <input className="input" type="date" value={f.date} onChange={set('date')} />
          </label>
        </div>
        <div className="row">
          <label className="field">
            <span>Category</span>
            <select className="input" value={f.category} onChange={set('category')}>
              {CATEGORIES[f.type].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Payment method</span>
            <select className="input" value={f.paymentMethod} onChange={set('paymentMethod')}>
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Description (optional)</span>
          <input className="input" value={f.note} onChange={set('note')} />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Saving...' : 'Save'}
        </button>
      </form>
    </Modal>
  );
}

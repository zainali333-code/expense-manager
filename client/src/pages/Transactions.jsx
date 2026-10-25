import { useCallback, useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import { ALL_CATEGORIES, METHODS, fmtDate, money } from '../utils';

export default function Transactions() {
  const { user } = useAuth();
  const { refreshKey, refresh } = useOutletContext();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ search: params.get('search') || '', type: '', category: '', method: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [editing, setEditing] = useState(null); // null | 'new' | transaction
  const [error, setError] = useState('');

  // Sync with topbar search
  useEffect(() => {
    setFilters((f) => ({ ...f, search: params.get('search') || '' }));
    setPage(1);
  }, [params]);

  const query = useCallback(() => {
    const p = { ...filters, page, limit: 10 };
    Object.keys(p).forEach((k) => p[k] === '' && delete p[k]);
    return p;
  }, [filters, page]);

  useEffect(() => {
    api.get('/transactions', { params: query() }).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [query, refreshKey]);

  const setF = (k) => (e) => {
    setFilters({ ...filters, [k]: e.target.value });
    setPage(1);
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    try {
      await api.delete(`/transactions/${t._id}`);
      refresh();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const exportCsv = async () => {
    const { page: _p, limit: _l, ...rest } = query();
    const r = await api.get('/transactions/export', { params: rest, responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p>You can manage your income and expenses here.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={exportCsv}><Download size={16} /> Export CSV</button>
          <button className="btn primary" onClick={() => setEditing('new')}><Plus size={16} /> Add new transaction</button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <input className="input" style={{ minWidth: 200 }} placeholder="Search title" value={filters.search} onChange={setF('search')} />
          <select className="input" value={filters.type} onChange={setF('type')}>
            <option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>
          <select className="input" value={filters.category} onChange={setF('category')}>
            <option value="">All categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input" value={filters.method} onChange={setF('method')}>
            <option value="">All methods</option>
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
          <input className="input" type="date" value={filters.from} onChange={setF('from')} title="From" />
          <input className="input" type="date" value={filters.to} onChange={setF('to')} title="To" />
        </div>
        {error && <div className="form-error">{error}</div>}

        {data.items.length === 0 ? (
          <div className="empty">No transactions found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Date', 'Amount', 'Payment name', 'Method', 'Category', ''].map((h, i) => <th key={i} className="th-green">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t._id}>
                    <td>{fmtDate(t.date)}</td>
                    <td className={t.type === 'income' ? 'amount-in' : 'amount-out'}>{t.type === 'income' ? '+' : '-'}{money(t.amount, user.currency)}</td>
                    <td>{t.title}</td>
                    <td><span className={`tag ${t.paymentMethod.toLowerCase()}`}>{t.paymentMethod}</span></td>
                    <td><span className="tag cat">{t.category}</span></td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn sm" onClick={() => setEditing(t)} aria-label="Edit"><Pencil size={15} /></button>
                        <button className="icon-btn sm" onClick={() => remove(t)} aria-label="Delete"><Trash2 size={15} color="var(--red)" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pager">
          <span>{data.total} transactions</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
            <span>Page {page} of {data.pages}</span>
            <button className="btn" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>

      {editing && (
        <TransactionForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

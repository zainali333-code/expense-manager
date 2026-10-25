import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext.jsx';
import { CHART_COLORS, money, monthLabel, thisMonth } from '../utils';

const tip = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 };

export default function Statistics() {
  const { user } = useAuth();
  const { refreshKey } = useOutletContext();
  const [month, setMonth] = useState(thisMonth());
  const [cats, setCats] = useState([]);
  const [sum, setSum] = useState(null);
  const [yearly, setYearly] = useState([]);
  const cur = user.currency;
  const year = Number(month.slice(0, 4));

  useEffect(() => {
    api.get('/stats/categories', { params: { month } }).then((r) => setCats(r.data));
    api.get('/stats/summary', { params: { month } }).then((r) => setSum(r.data));
  }, [month, refreshKey]);

  useEffect(() => {
    api.get('/stats/monthly', { params: { year } }).then((r) => setYearly(r.data));
  }, [year, refreshKey]);

  const totalSpent = cats.reduce((s, c) => s + c.total, 0);
  const top = cats[0];
  const compare = sum ? [{ name: monthLabel(month), Income: sum.income, Outgoings: sum.expense }] : [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Statistics</h1>
          <p>Reports and analytics for {monthLabel(month)}.</p>
        </div>
        <input className="input" type="month" style={{ width: 'auto' }} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </div>

      <div className="grid grid-3">
        <div className="card"><div className="stat-label">Highest spending category</div><div className="big-stat" style={{ marginTop: 12 }}>{top ? top.category : '-'}</div><div className="muted">{top ? money(top.total, cur) : 'No expenses'}</div></div>
        <div className="card"><div className="stat-label">Total spent</div><div className="big-stat" style={{ marginTop: 12 }}>{money(totalSpent, cur)}</div></div>
        <div className="card"><div className="stat-label">Savings this month</div><div className={`big-stat ${sum && sum.saved < 0 ? 'red' : 'green'}`} style={{ marginTop: 12 }}>{sum ? money(sum.saved, cur) : '-'}</div></div>
      </div>

      <div className="grid grid-2 mt">
        <div className="card">
          <h2 className="card-head">Spending by Category</h2>
          {cats.length === 0 ? (
            <div className="empty">No expenses this month</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={cats} dataKey="total" nameKey="category" outerRadius={100} stroke="var(--card)" strokeWidth={2}>
                    {cats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(v, cur)} contentStyle={tip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {cats.map((c, i) => (
                  <span key={c.category}><i style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{c.category} ({Math.round((c.total / totalSpent) * 100)}%)</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2 className="card-head">Income vs Outgoings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compare}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} width={55} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(v) => money(v, cur)} contentStyle={tip} cursor={{ fill: 'var(--soft)' }} />
              <Bar dataKey="Income" fill="#4ade80" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Outgoings" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="legend"><span><i style={{ background: '#4ade80' }} />Income</span><span><i style={{ background: '#f43f5e' }} />Outgoings</span></div>
        </div>
      </div>

      <div className="card mt">
        <h2 className="card-head">Yearly report ({year})</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={yearly}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} width={55} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
            <Tooltip formatter={(v) => money(v, cur)} contentStyle={tip} cursor={{ fill: 'var(--soft)' }} />
            <Bar dataKey="income" name="Income" fill="#4ade80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

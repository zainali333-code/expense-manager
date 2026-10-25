import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight } from "lucide-react";
import api from "../api";
import { useAuth } from "../AuthContext.jsx";
import { fmtDate, money } from "../utils";

function StatCard({ label, value, change, good, note }) {
  let pill = <span className="pill neutral">{note}</span>;
  if (change !== null && change !== undefined) {
    const up = change >= 0;
    const positive = good === "up" ? up : !up;
    pill = (
      <span className={`pill ${positive ? "up" : "down"}`}>
        {up ? "↑" : "↓"} {Math.abs(change)}%
      </span>
    );
  }
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className="stat-row">
        <div className="stat-value">{value}</div>
        {pill}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { refreshKey } = useOutletContext();
  const [sum, setSum] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [recent, setRecent] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const cur = user.currency;

  useEffect(() => {
    api.get("/stats/summary").then((r) => setSum(r.data));
    api
      .get("/transactions", { params: { limit: 6 } })
      .then((r) => setRecent(r.data.items));
  }, [refreshKey]);

  useEffect(() => {
    api
      .get("/stats/monthly", { params: { year } })
      .then((r) => setMonthly(r.data));
  }, [year, refreshKey]);

  if (!sum) return <div className="page muted">Loading...</div>;

  const donut = [
    { name: "Saved", value: Math.max(sum.saved, 0), color: "#2563eb" },
    { name: "Spent", value: sum.expense, color: "#f97316" },
  ];
  const years = Array.from(
    { length: 4 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hello, {user.name.split(" ")[0]}</h1>
          <p>Here is your money overview.</p>
        </div>
      </div>

      <div className="grid grid-3">
        <StatCard
          label="Income (this month)"
          value={money(sum.income, cur)}
          change={sum.incomeChange}
          good="up"
          note="vs last month"
        />
        <StatCard
          label="Expenses (this month)"
          value={money(sum.expense, cur)}
          change={sum.expenseChange}
          good="down"
          note="vs last month"
        />
        <StatCard
          label="Balance (all time)"
          value={money(sum.balance, cur)}
          note="Income - Expenses"
        />
      </div>

      <div className="grid grid-main mt">
        <div className="card">
          <div className="card-head">
            <h2>Income vs Expenses</h2>
            <select
              className="input chart-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
          <div
            className="legend"
            style={{ justifyContent: "flex-start", margin: "0 0 8px" }}
          >
            <span>
              <i style={{ background: "#2563eb" }} />
              Income
            </span>
            <span>
              <i style={{ background: "#f97316" }} />
              Expenses
            </span>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
              />
              <Tooltip
                formatter={(v) => money(v, cur)}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#gi)"
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#ge)"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Cash flow</h2>
            <span className="muted">This month</span>
          </div>
          {sum.income === 0 && sum.expense === 0 ? (
            <div className="empty">No transactions this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                  cornerRadius={8}
                  stroke="none"
                >
                  {donut.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => money(v, cur)}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="legend">
            {donut.map((d) => (
              <span key={d.name}>
                <i style={{ background: d.color }} />
                {d.name}: {money(d.value, cur)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt">
        <div className="card-head">
          <h2>Recent transactions</h2>
          <Link
            to="/transactions"
            className="btn"
            style={{ padding: "6px 12px" }}
          >
            See all <ChevronRight size={16} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty">
            No transactions yet. Click "Add money" to start.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Pay</th>
                  <th>Category</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong>{t.title}</strong>
                    </td>
                    <td
                      className={
                        t.type === "income" ? "amount-in" : "amount-out"
                      }
                    >
                      {t.type === "income" ? "+" : "-"}
                      {money(t.amount, cur)}
                    </td>
                    <td>
                      <span className={`tag ${t.paymentMethod.toLowerCase()}`}>
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className="tag cat">{t.category}</span>
                    </td>
                    <td>{fmtDate(t.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

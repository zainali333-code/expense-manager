import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password);
      else await register(f.name, f.email, f.password);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-logo">S</div> SpendWise
        </div>
        <h1>{isLogin ? 'Welcome back' : 'Create account'}</h1>
        <p className="sub">{isLogin ? 'Log in to manage your money.' : 'Start tracking income, expenses and budgets.'}</p>
        {!isLogin && (
          <label className="field">
            <span>Name</span>
            <input className="input" value={f.name} onChange={set('name')} required />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" value={f.email} onChange={set('email')} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" minLength={6} value={f.password} onChange={set('password')} required />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
        </button>
        <div className="switch">
          {isLogin ? (
            <>No account? <Link to="/register">Sign up</Link></>
          ) : (
            <>Already registered? <Link to="/login">Log in</Link></>
          )}
        </div>
        {isLogin && <div className="hint">Demo data: run <code>npm run seed</code> in the server folder, then log in with demo@example.com / demo123</div>}
      </form>
    </div>
  );
}

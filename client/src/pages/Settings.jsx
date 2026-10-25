import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { CURRENCIES } from '../utils';

export default function Settings() {
  const { user, theme, saveProfile } = useAuth();
  const [profile, setProfile] = useState({ name: user.name, currency: user.currency });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pMsg, setPMsg] = useState(null);
  const [wMsg, setWMsg] = useState(null);

  const submitProfile = async (e) => {
    e.preventDefault();
    try {
      await saveProfile(profile);
      setPMsg({ ok: true, text: 'Profile updated' });
    } catch (err) {
      setPMsg({ ok: false, text: errMsg(err) });
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      setWMsg({ ok: true, text: 'Password changed' });
    } catch (err) {
      setWMsg({ ok: false, text: errMsg(err) });
    }
  };

  const msg = (m) => m && <div className={m.ok ? 'alert ok' : 'form-error'}>{m.text}</div>;

  return (
    <div className="page">
      <div className="page-head"><div><h1>Settings</h1><p>Profile, currency, theme and password.</p></div></div>
      <div className="grid grid-2">
        <form className="card" onSubmit={submitProfile}>
          <h2 className="card-head">Profile</h2>
          <label className="field"><span>Name</span><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
          <label className="field"><span>Email</span><input className="input" value={user.email} disabled /></label>
          <label className="field">
            <span>Currency</span>
            <select className="input" value={profile.currency} onChange={(e) => setProfile({ ...profile, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Theme</span>
            <select className="input" value={theme} onChange={(e) => saveProfile({ theme: e.target.value })}>
              <option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </label>
          {msg(pMsg)}
          <button className="btn primary">Save profile</button>
        </form>

        <form className="card" onSubmit={submitPassword}>
          <h2 className="card-head">Change password</h2>
          <label className="field"><span>Current password</span><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
          <label className="field"><span>New password</span><input className="input" type="password" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
          {msg(wMsg)}
          <button className="btn primary">Update password</button>
        </form>
      </div>
    </div>
  );
}

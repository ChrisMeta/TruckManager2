import React, { useState } from 'react';
import { api } from '../../api/client';

export default function LoginForm({ onLoggedIn }){
  const [usernameOrEmail, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');

  async function submit(e){
    e.preventDefault(); setErr('');
    try{
      await api.post('/auth/login', { usernameOrEmail, password });
      onLoggedIn && onLoggedIn();
    } catch(e){ setErr(e.response?.data?.error || 'Login failed'); }
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div><label className="text-sm">Username or Email</label><input className="input" value={usernameOrEmail} onChange={e=>setU(e.target.value)} /></div>
      <div><label className="text-sm">Password</label><input className="input" type="password" value={password} onChange={e=>setP(e.target.value)} /></div>
      {err && <div className="text-red-400 text-sm">{err}</div>}
      <button className="btn btn-primary w-full" type="submit">Login</button>
    </form>
  );
}

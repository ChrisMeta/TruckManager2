import React, { useState } from 'react';
import { api } from '../../api/client';

export default function RegisterForm({ onRegistered }){
  const [username, setU] = useState('');
  const [email, setE] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  async function submit(e){
    e.preventDefault(); setErr(''); setOk(false);
    try{
      await api.post('/auth/register', { username, email, password });
      setOk(true);
      onRegistered && onRegistered();
    } catch(e){ setErr(e.response?.data?.error || 'Registration failed'); }
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div><label className="text-sm">Username</label><input className="input" value={username} onChange={e=>setU(e.target.value)} /></div>
      <div><label className="text-sm">Email</label><input className="input" type="email" value={email} onChange={e=>setE(e.target.value)} /></div>
      <div><label className="text-sm">Password</label><input className="input" type="password" value={password} onChange={e=>setP(e.target.value)} /></div>
      {err && <div className="text-red-400 text-sm">{err}</div>}
      {ok && <div className="text-green-400 text-sm">Registered! Please log in.</div>}
      <button className="btn btn-primary w-full" type="submit">Create account</button>
    </form>
  );
}

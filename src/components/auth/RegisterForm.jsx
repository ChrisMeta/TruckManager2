import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../api/client';

export default function RegisterForm({ onRegistered }){
  const { t } = useLanguage();
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
    } catch(e){ setErr(e.response?.data?.error || t('registrationFailed')); }
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div><label className="text-sm">{t('username')}</label><input className="input" value={username} onChange={e=>setU(e.target.value)} /></div>
      <div><label className="text-sm">{t('email')}</label><input className="input" type="email" value={email} onChange={e=>setE(e.target.value)} /></div>
      <div><label className="text-sm">{t('password')}</label><input className="input" type="password" value={password} onChange={e=>setP(e.target.value)} /></div>
      {err && <div className="text-red-400 text-sm">{err}</div>}
      {ok && <div className="text-green-400 text-sm">{t('registered')}</div>}
      <button className="btn btn-primary w-full" type="submit">{t('createAccount')}</button>
    </form>
  );
}
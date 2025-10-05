import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SupabaseResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg('Password updated. You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e) {
      setErr(e.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h2>Set New Password</h2>
        {err && <div style={{ color: '#dc3545', marginBottom: 12 }}>{err}</div>}
        {msg && <div style={{ color: '#28a745', marginBottom: 12 }}>{msg}</div>}
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="New password" maxLength={64} required />
          <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="Confirm new password" maxLength={64} required />
          <button disabled={loading} type="submit">{loading ? 'Saving...' : 'Save password'}</button>
        </form>
        <div style={{ marginTop: 12 }}>
          <a href="/login">Back to Login</a>
        </div>
      </div>
    </div>
  );
}

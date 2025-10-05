import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SupabaseVerifyPage() {
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Parse URL hash or query into a key/value map
  const parseParams = () => {
    const out = new URLSearchParams(window.location.search);
    // Many Supabase links use hash fragment
    const hash = window.location.hash?.replace(/^#/, '') || '';
    const h = new URLSearchParams(hash);
    // Prefer hash params (Supabase commonly uses them)
    const get = (k) => h.get(k) || out.get(k);
    return {
      access_token: get('access_token'),
      refresh_token: get('refresh_token'),
      token: get('token') || get('token_hash'),
      type: get('type'),
    };
  };

  useEffect(() => {
    const run = async () => {
      try {
        const { access_token, refresh_token, token, type } = parseParams();

        // 1) If access/refresh token are present, set the session directly
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) throw setErr;
        } else if (token && (type === 'signup' || type === 'recovery' || type === 'magiclink')) {
          // 2) Otherwise, try to verify the OTP token (for some link styles)
          const { error: verErr } = await supabase.auth.verifyOtp({
            type: type === 'signup' ? 'signup' : 'magiclink',
            token: token,
          });
          if (verErr) throw verErr;
        }

        // Now we should have a session; fetch user
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const email = userData?.user?.email;
        if (!email) throw new Error('Auth session missing!');

        // Bridge to backend to mark user verified in our DB
        const res = await fetch('/api/auth/mark-verified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message || 'Failed to update backend verification');

        setStatus('success');
        setMessage('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2500);
      } catch (e) {
        setStatus('error');
        setMessage(e?.message || 'Verification failed');
      }
    };
    run();
  }, [navigate]);

  return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <h2>Email Verification</h2>
        {status === 'verifying' && <p>Verifying your email...</p>}
        {status === 'success' && <p style={{ color: '#28a745' }}>{message}</p>}
        {status === 'error' && (
          <>
            <p style={{ color: '#dc3545' }}>{message}</p>
            <p>
              You can still continue to Login and try again.
            </p>
            <a href="/login">Go to Login</a>
          </>
        )}
      </div>
    </div>
  );
}

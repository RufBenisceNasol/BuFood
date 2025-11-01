import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import http from '../api/http';

// Keep Axios default Authorization header in sync with Supabase session
// Useful to reduce transient 401s and for libs that don't use our interceptor
export default function useSupabaseAxiosSync() {
  useEffect(() => {
    let mounted = true;

    const applyToken = (token) => {
      if (!mounted) return;
      if (token) {
        http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        delete http.defaults.headers.common['Authorization'];
      }
    };

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        applyToken(data?.session?.access_token || null);
      } catch (err) {
        // If local refresh token is invalid/corrupted, clear local session silently
        try { await supabase.auth.signOut({ scope: 'local' }); } catch (_) {}
        applyToken(null);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!mounted) return;
      switch (evt) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          applyToken(session?.access_token || null);
          break;
        case 'SIGNED_OUT':
        case 'USER_DELETED':
        case 'TOKEN_REFRESH_FAILED':
        default:
          applyToken(null);
          break;
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chat } from '../api';

const ConversationList = ({ title = 'Messages' }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const baseRoute = useMemo(() => (
    location.pathname.startsWith('/seller') ? '/seller/messages' : '/customer/messages'
  ), [location.pathname]);

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await chat.getConversations();
      const data = res.data || res;
      const list = Array.isArray(data) ? data : (data?.data || []);
      setConversations(list);
    } catch (e) {
      setError((e && (e.message || e.error || e.details)) || 'Failed to load conversations');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadConversations(true), 5000);
    const onFocus = () => loadConversations(true);
    window.addEventListener('focus', onFocus);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5', color: '#e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1px 1px', background: '#ff8c00', color: '#e5e7eb', position: 'sticky', top: 0, zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#00060fff', fontWeight: 700, cursor: 'pointer', fontSize: 20 }}>&larr;</button>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
      </div>
      <div style={{ flex: 1, padding: '12px' }}>
        <div style={{ border: '1px solid rgba(148,163,184,0.3)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}>
          {loading && (
            <div style={{ padding: 16, color: '#64748b' }}>Loading conversations...</div>
          )}
          {error && !loading && (
            <div style={{ padding: 16, color: '#f87171' }}>{error}</div>
          )}
          {!loading && !error && (
            <div>
              {conversations.length === 0 && (
                <div style={{ padding: 16, color: '#64748b' }}>No conversations yet.</div>
              )}
              {conversations.map((c, index) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`${baseRoute}/${c.id}`, { state: { title: c.otherParticipantName || 'Chat', avatar: c.otherParticipantAvatar || null } })}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderTop: index === 0 ? 'none' : '1px solid rgba(148,163,184,0.12)',
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    padding: '14px 16px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {c.otherParticipantAvatar ? (
                        <img src={c.otherParticipantAvatar} alt={c.otherParticipantName || 'User'} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(59,130,246,0.4)' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(148,163,184,0.2)', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {(c.otherParticipantName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{c.otherParticipantName || 'Conversation'}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                          {c.lastMessage?.text || 'No messages yet'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 48 }}>
                      {c.unread > 0 && (
                        <span style={{
                          background: '#2563eb',
                          color: '#e0f2fe',
                          borderRadius: 12,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                          boxShadow: '0 4px 10px rgba(59,130,246,0.35)'
                        }}>
                          {c.unread}
                        </span>
                      )}
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationList;

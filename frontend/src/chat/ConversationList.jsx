import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chat } from '../api';

const ConversationList = ({ title = 'Messages' }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const navigate = useNavigate();

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#ff7a00', color: '#fff', position: 'sticky', top: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>&larr;</button>
        <div style={{ fontWeight: 700 }}>{title}</div>
      </div>
      <div style={{ flex: 1 }}>
        {loading && (
          <div style={{ padding: 16, color: '#777' }}>Loading conversations...</div>
        )}
        {error && !loading && (
          <div style={{ padding: 16, color: '#d32f2f' }}>{error}</div>
        )}
        {!loading && !error && (
          <div>
            {conversations.length === 0 && (
              <div style={{ padding: 16, color: '#777' }}>No conversations yet.</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/customer/messages/${c.id}`, { state: { title: c.otherParticipantName || 'Chat' } })}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #eee',
                  padding: '12px 14px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.otherParticipantName || 'Conversation'}</div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                      {c.lastMessage?.text || 'No messages yet'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {c.unread > 0 && (
                      <span style={{
                        background: '#ff3b30',
                        color: '#fff',
                        borderRadius: 10,
                        padding: '2px 8px',
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        {c.unread}
                      </span>
                    )}
                    <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;

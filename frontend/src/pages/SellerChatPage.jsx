import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { fetchConversations, fetchMessages, markRead, supabase } from '../api/chatApi';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import './ChatStyles.css';

export default function SellerChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showList, setShowList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [me, setMe] = useState(null);
  const navigate = useNavigate();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setMe({ id: user.id, ...user.user_metadata });
    };
    getUser();
  }, [navigate]);

  // Setup socket connection
  useEffect(() => {
    if (!me) return;

    let newSocket;

    const setupSocket = async () => {
      try {
        const session = await supabase.auth.getSession();
        newSocket = io(import.meta.env.VITE_API_BASE_URL, {
          auth: { token: session.data.session?.access_token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
          console.log('Connected to socket server');
        });

        newSocket.on('message:received', (msg) => {
          setMessages(prev => [...prev, msg]);
          if (msg.conversationId === activeConversation?._id) {
            markRead(msg.conversationId);
          }
        });

        newSocket.on('conversation:updated', ({ conversationId, lastMessage }) => {
          setConversations(prev => prev.map(conv => 
            conv._id === conversationId 
              ? { ...conv, lastMessage, updatedAt: new Date().toISOString() } 
              : conv
          ));
        });

        newSocket.on('conversation:created', (conv) => {
          setConversations(prev => [conv, ...prev]);
        });

        // Handle reconnection and token refresh
        newSocket.on('connect_error', async (error) => {
          console.error('Connection error:', error);
          if (error.message === 'Authentication error') {
            const { data: { session } } = await supabase.auth.refreshSession();
            if (session?.access_token) {
              newSocket.auth = { token: session.access_token };
              newSocket.connect();
            }
          }
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Failed to set up socket:', error);
      }
    };

    setupSocket();

    return () => {
      if (newSocket) {
        newSocket.off('connect');
        newSocket.off('message:received');
        newSocket.off('conversation:updated');
        newSocket.off('conversation:created');
        newSocket.off('connect_error');
        newSocket.disconnect();
      }
    };
  }, [me]);

  // Load conversations
  useEffect(() => {
    if (!me) return;

    const loadConversations = async () => {
      try {
        const data = await fetchConversations();
        setConversations(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, [me]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation?._id) return;

    const loadMessages = async () => {
      try {
        const { messages: msgs, nextCursor } = await fetchMessages(activeConversation._id);
        setMessages(msgs);
        setHasMore(!!nextCursor);
        
        // Mark as read
        await markRead(activeConversation._id);
        
        // Update unread count
        setConversations(prev => prev.map(conv => 
          conv._id === activeConversation._id 
            ? { ...conv, unreadCounts: { ...conv.unreadCounts, [me.id]: 0 } } 
            : conv
        ));
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [activeConversation, me?.id]);

  const handleSelectConversation = useCallback((conversationId) => {
    const conv = conversations.find(c => c._id === conversationId);
    if (conv) {
      setActiveConversation({ ...conv, me: me.id });
      if (isMobile) setShowList(false);
    }
  }, [conversations, isMobile, me?.id]);

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || !activeConversation || !socket) return;

    try {
      const receiverId = activeConversation.participants.find(id => id !== me.id);
      await socket.emit('message:send', {
        conversationId: activeConversation._id,
        receiverId,
        text: text.trim(),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [activeConversation, me?.id, socket]);

  const handleLoadMore = useCallback(async () => {
    if (!activeConversation?._id || !hasMore) return;

    try {
      const cursor = messages[0]?._id;
      const { messages: olderMsgs, nextCursor } = await fetchMessages(
        activeConversation._id,
        20,
        cursor
      );
      
      setMessages(prev => [...olderMsgs, ...prev]);
      setHasMore(!!nextCursor);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [activeConversation?._id, hasMore, messages]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowList(true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return <div className="dlb-loading">Loading...</div>;
  }

  return (
    <div className="dlb-chat-container">
      {(showList || !isMobile) && (
        <ChatList 
          conversations={conversations.map(c => ({ ...c, me: me?.id }))} 
          onSelect={handleSelectConversation}
          activeId={activeConversation?._id}
        />
      )}
      
      {activeConversation ? (
        <div className="dlb-chat-main">
          {isMobile && (
            <button 
              className="dlb-back-button"
              onClick={() => setShowList(true)}
            >
              ← Back to conversations
            </button>
          )}
          <ChatWindow 
            conversation={{ ...activeConversation, me: me?.id }}
            messages={messages}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
          <ChatInput 
            conversation={{ ...activeConversation, me: me?.id }}
            onSent={() => {
              // Auto-scroll handled in ChatWindow
            }}
            role="seller"
          />
        </div>
      ) : (
        <div className="dlb-no-chat-selected">
          <p>Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
}

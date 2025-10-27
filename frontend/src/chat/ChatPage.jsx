import React from 'react'
import { Box, Divider, IconButton, List, ListItem, ListItemAvatar, Avatar, ListItemText, Badge, TextField, Fab, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import dayjs from 'dayjs'
import { supabase } from '../utils/supabaseClient'
import { chat } from '../api'
import { connectSocket, getSocket } from './socket'

export default function ChatPage() {
  const [conversations, setConversations] = React.useState([])
  const [messages, setMessages] = React.useState([])
  const [activeConversationId, setActiveConversationId] = React.useState(null)
  const [draft, setDraft] = React.useState('')
  const [unreadTotal, setUnreadTotal] = React.useState(0)
  const [meId, setMeId] = React.useState('')

  const threadRef = React.useRef(null)

  const formatTime = (t) => dayjs(t).format('HH:mm')

  const loadConversations = React.useCallback(async () => {
    const list = await chat.listConversations()
    setConversations(list)
  }, [])

  const loadUnread = React.useCallback(async () => {
    const { total } = await chat.unread()
    setUnreadTotal(total)
  }, [])

  const loadMessages = React.useCallback(async (conversationId) => {
    if (!conversationId) return
    const msgs = await chat.getMessages(conversationId)
    setMessages(msgs)
    if (!meId && msgs.length) {
      // Infer my ID from last message if needed
      const last = msgs[msgs.length - 1]
      // If I'm the sender, receiverId is peer; else senderId is peer
      setMeId(last.senderId) // heuristic; ideally call /auth/me to fetch
    }
    // mark seen
    await chat.markSeen(conversationId)
  }, [meId])

  const openConversation = async (c) => {
    setActiveConversationId(c._id)
    await loadMessages(c._id)
    const socket = getSocket()
    if (socket) socket.emit('conversation:join', c._id)
    await loadConversations()
    await loadUnread()
    scrollToBottom()
  }

  const send = async () => {
    if (!draft.trim() || !activeConversationId) return
    const c = conversations.find(x => x._id === activeConversationId)
    if (!c) return
    const peer = (c.participants || []).find(p => p && p._id !== meId)
    if (!peer) return
    const text = draft.trim()
    setDraft('')
    const { message } = await chat.send({ receiverId: peer._id, text })
    setMessages(prev => [...prev, message])
    await loadConversations()
    scrollToBottom()
  }

  const scrollToBottom = () => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const s = connectSocket(token)
      s.on('message:new', async (payload) => {
        if (payload.conversationId === activeConversationId) {
          setMessages(prev => [...prev, payload.message])
          await chat.markSeen(activeConversationId)
          await loadConversations()
          await loadUnread()
          scrollToBottom()
        } else {
          setUnreadTotal((u) => u + 1)
          setConversations((prev) => prev.map(c => c._id === payload.conversationId ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: payload.message.text } : c))
        }
      })
      s.on('message:seen', (p) => {
        if (p.conversationId === activeConversationId) {
          // for simplicity, reload messages
          loadMessages(activeConversationId)
        }
      })
    })()
  }, [activeConversationId, loadConversations, loadMessages, loadUnread])

  React.useEffect(() => {
    Promise.all([loadConversations(), loadUnread()])
  }, [loadConversations, loadUnread])

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Left: Conversations */}
      <Box sx={{ width: 320, bgcolor: '#fff', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Messages</Typography>
          <Badge color="error" badgeContent={unreadTotal} />
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <List>
            {conversations.map((c) => {
              const peer = (c.participants || []).find(p => p && p._id !== meId)
              return (
                <ListItem key={c._id} button onClick={() => openConversation(c)} selected={c._id === activeConversationId}>
                  <ListItemAvatar>
                    <Avatar src={peer?.profileImage || undefined} />
                  </ListItemAvatar>
                  <ListItemText primary={peer?.name || 'Conversation'} secondary={c.lastMessage} />
                  {c.unreadCount > 0 && (
                    <Badge color="primary" badgeContent={c.unreadCount} />
                  )}
                </ListItem>
              )
            })}
          </List>
        </Box>
      </Box>

      {/* Right: Thread */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee', bgcolor: '#fff' }}>
          <Typography variant="subtitle1">
            {(() => {
              const c = conversations.find(x => x._id === activeConversationId)
              const peer = c && (c.participants || []).find(p => p && p._id !== meId)
              return peer?.name || 'Select a conversation'
            })()}
          </Typography>
        </Box>
        <Box ref={threadRef} sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {messages.map(m => (
            <Box key={m._id} sx={{ display: 'flex', justifyContent: m.senderId === meId ? 'flex-end' : 'flex-start', mb: 1 }}>
              <Box sx={{ bgcolor: m.senderId === meId ? 'primary.main' : 'grey.200', color: m.senderId === meId ? 'primary.contrastText' : 'black', px: 1.5, py: 1, borderRadius: 2, maxWidth: '70%' }}>
                <Typography variant="body2">{m.text}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>{formatTime(m.createdAt)}{m.senderId === meId && m.seen ? ' • seen' : ''}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <Divider />
        <Box sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: '#fff' }}>
          <TextField size="small" fullWidth placeholder="Type a message..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} />
          <IconButton color="primary" onClick={send} disabled={!draft.trim() || !activeConversationId}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

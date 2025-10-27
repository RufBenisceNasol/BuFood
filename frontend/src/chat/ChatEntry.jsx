import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Fab, IconButton, Badge } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import { supabase } from '../utils/supabaseClient'
import { chat } from '../api'
import { connectSocket, getSocket } from './socket'
import { getUser } from '../utils/tokenUtils'

export default function ChatEntry() {
  const [unread, setUnread] = React.useState(0)
  const [role, setRole] = React.useState('Customer')
  const location = useLocation()
  const navigate = useNavigate()

  const gotoChat = () => navigate('/chat')

  React.useEffect(() => {
    const u = getUser()
    if (u?.role) setRole(u.role)
  }, [])

  React.useEffect(() => {
    (async () => {
      try {
        const { total } = await chat.unread()
        setUnread(total || 0)
      } catch {}
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) return
        const s = connectSocket(token)
        s.on('message:new', (payload) => {
          if (location.pathname !== '/chat') setUnread(u => (u || 0) + 1)
        })
      } catch {}
    })()
  }, [location.pathname])

  // Customer top-right icon, Seller floating FAB bottom-right
  if (role === 'Seller') {
    return (
      <Fab color="primary" onClick={gotoChat} sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1300 }}>
        <Badge color="error" badgeContent={unread} overlap="circular">
          <ChatIcon />
        </Badge>
      </Fab>
    )
  }

  return (
    <IconButton color="primary" onClick={gotoChat} sx={{ position: 'fixed', right: 16, top: 12, zIndex: 1300, bgcolor: 'white', boxShadow: 3 }}>
      <Badge color="error" badgeContent={unread} overlap="circular">
        <ChatIcon />
      </Badge>
    </IconButton>
  )
}

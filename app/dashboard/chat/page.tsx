'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { MessageSquare, Send, Search } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachment: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    photoUrl: string | null;
  };
}

interface DirectoryUser {
  id: string;
  username: string;
  employeeId: string;
  photoUrl: string | null;
  role: string;
  status: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://erp-backend-1-02lc.onrender.com/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://erp-backend-1-02lc.onrender.com';

function ChatContent() {
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  // Load staff directory
  const loadDirectory = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/employees/directory`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDirectory(data.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }, [accessToken]);

  // Connect Socket.IO
  useEffect(() => {
    if (!accessToken || !isAuthenticated) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => console.log('Socket connected'));

    socket.on('users:online', (users: { userId: string }[]) => {
      setOnlineUsers(users.map(u => u.userId));
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages(prev => {
        // Avoid duplicate if we already appended optimistically
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('chat:typing', (data: { senderId: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUser(data.senderId);
      } else {
        setTypingUser(null);
      }
    });

    socket.on('employee:update', () => {
      loadDirectory();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, isAuthenticated, loadDirectory]);

  useEffect(() => {
    if (isAuthenticated && accessToken) loadDirectory();
  }, [isAuthenticated, accessToken, loadDirectory]);

  // Fetch message history for selected user
  const fetchMessages = useCallback(async () => {
    if (!accessToken || !selectedUser) return;
    try {
      const res = await fetch(`${API}/chat/messages/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Mark as read via socket
        socketRef.current?.emit('chat:read', { senderId: selectedUser.id });
      }
    } catch (err) {
      console.error(err);
    }
  }, [accessToken, selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedUser, fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser || sendLoading) return;
    setSendLoading(true);

    const content = messageInput.trim();
    setMessageInput('');

    // Send via Socket.IO for real-time delivery
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:send', {
        receiverId: selectedUser.id,
        content,
      });

      // Create notification for receiver via REST
      fetch(`${API}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          title: `New Message from ${user?.role === 'ADMIN' ? 'PJSOFONIC Admin' : user?.username}`,
          message: content.length > 60 ? content.slice(0, 60) + '...' : content,
          type: 'MESSAGE',
        }),
      }).catch(console.error);
    } else {
      // Fallback to REST if socket not connected
      try {
        const res = await fetch(`${API}/chat/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ receiverId: selectedUser.id, content }),
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(prev => [...prev, data.message]);
        }
      } catch (err) {
        console.error(err);
      }
    }

    setSendLoading(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (selectedUser && socketRef.current) {
      socketRef.current.emit('chat:typing', { receiverId: selectedUser.id, isTyping: true });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socketRef.current?.emit('chat:typing', { receiverId: selectedUser.id, isTyping: false });
      }, 1500);
    }
  };

  const filteredDirectory = directory.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group: admins first
  const sorted = [
    ...filteredDirectory.filter(u => u.role === 'ADMIN'),
    ...filteredDirectory.filter(u => u.role !== 'ADMIN'),
  ];

  if (isLoading || pageLoading) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        <main className="flex-1 pt-24 pb-28 px-6 flex items-center justify-center">
          <div className="text-cyan-400 animate-pulse">Loading messaging interface...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 pt-24 pb-28 px-4 md:px-8 flex flex-col h-screen max-h-screen overflow-hidden max-w-7xl mx-auto w-full">
        <div className="mb-3">
          <h1 className="text-2xl font-extrabold tracking-tight">
            EMS <span className="gradient-text">Real-time Messaging</span>
          </h1>
          <p className="text-white/50 text-xs">Chat with admin, colleagues, and all staff in real-time.</p>
        </div>

        <div className="flex-1 flex bg-black border border-cyan-500/30 rounded-2xl overflow-hidden mb-6 min-h-0">
          {/* Left: Staff Directory */}
          <div className="w-[280px] border-r border-cyan-500/20 flex flex-col bg-black shrink-0">
            <div className="p-3 border-b border-cyan-500/20">
              <div className="bg-white/5 rounded-xl px-3 py-2 flex items-center gap-2 border border-cyan-500/30">
                <Search size={14} className="text-cyan-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-white outline-none w-full text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-cyan-400 px-3 tracking-wider block my-2">
                Staff Directory ({sorted.length})
              </span>
              {sorted.map(u => {
                const isOnline = onlineUsers.includes(u.id);
                const displayUsername = u.role === 'ADMIN' ? 'PJSOFONIC' : u.username;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all ${
                      selectedUser?.id === u.id
                        ? 'bg-cyan-500/20 border border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-bold overflow-hidden">
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt={displayUsername} className="w-full h-full object-cover" />
                        ) : (
                          displayUsername.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${isOnline ? 'bg-green-400 shadow-[0_0_6px_#39ff14]' : 'bg-white/20'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate">{displayUsername}</div>
                      <div className="text-[10px] text-cyan-400/70">
                        {u.role === 'ADMIN' ? '👑 Admin' : `#${u.employeeId}`}
                        {' · '}
                        <span className={isOnline ? 'text-green-400' : 'text-white/30'}>{isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Chat Window */}
          <div className="flex-1 flex flex-col justify-between bg-black min-w-0">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-cyan-500/20 flex items-center gap-3 bg-white/5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold overflow-hidden">
                      {selectedUser.photoUrl ? (
                        <img src={selectedUser.photoUrl} alt={selectedUser.username} className="w-full h-full object-cover" />
                      ) : (
                        (selectedUser.role === 'ADMIN' ? 'PJSOFONIC' : selectedUser.username).charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${onlineUsers.includes(selectedUser.id) ? 'bg-green-400' : 'bg-white/20'}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {selectedUser.role === 'ADMIN' ? 'PJSOFONIC (Admin)' : selectedUser.username}
                    </h4>
                    <span className="text-[10px] text-cyan-400">
                      {typingUser === selectedUser.id ? '✍️ typing...' : onlineUsers.includes(selectedUser.id) ? '🟢 Online' : '⚫ Offline'}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black">
                  {messages.map(msg => {
                    const isOwn = msg.senderId === user?.id;
                    const senderName = msg.sender?.id && msg.sender.id !== user?.id
                      ? (directory.find(d => d.id === msg.sender.id)?.role === 'ADMIN' ? 'PJSOFONIC' : msg.sender.username)
                      : (user?.role === 'ADMIN' ? 'PJSOFONIC' : user?.username || 'You');
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && (
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 mr-2 overflow-hidden">
                            {msg.sender?.photoUrl
                              ? <img src={msg.sender.photoUrl} className="w-full h-full object-cover" alt="" />
                              : senderName.charAt(0).toUpperCase()
                            }
                          </div>
                        )}
                        <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold rounded-tr-none shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                            : 'bg-white/10 text-white border border-cyan-500/30 rounded-tl-none'
                        }`}>
                          {!isOwn && (
                            <div className="text-[9px] font-bold text-cyan-300 mb-1 uppercase tracking-wider">{senderName}</div>
                          )}
                          <p className="text-xs break-words leading-relaxed">{msg.content}</p>
                          <span className={`text-[9px] block mt-1 text-right ${isOwn ? 'text-black/60' : 'text-white/40'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs pt-20">
                      <MessageSquare size={32} className="mb-2 text-cyan-500/20" />
                      No messages yet. Start the conversation!
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-cyan-500/20 bg-black flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Message ${selectedUser.role === 'ADMIN' ? 'PJSOFONIC' : selectedUser.username}...`}
                    value={messageInput}
                    onChange={handleTyping}
                    className="flex-1 input-glass text-sm"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sendLoading}
                    className="btn-primary py-3 px-4 text-xs font-bold flex items-center gap-2 shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30">
                <MessageSquare size={48} className="text-cyan-400/30 mb-4" />
                <h3 className="font-bold text-base text-white">Select a contact</h3>
                <p className="text-xs text-white/40 max-w-[200px] mt-1">
                  Choose any staff member from the directory to start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}

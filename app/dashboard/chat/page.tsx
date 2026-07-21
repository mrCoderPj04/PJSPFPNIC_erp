'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { MessageSquare, Send, User, Search, Smile, AlertCircle } from 'lucide-react';

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

interface Employee {
  id: string;
  username: string;
  employeeId: string;
  photoUrl: string | null;
  role: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChatPage() {
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Security route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!isLoading && isAuthenticated && user?.isFirstLogin) {
      router.replace('/change-password');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Load initial conversations & directory
  const loadDirectory = useCallback(async () => {
    if (!accessToken) return;
    try {
      // Load all employees to chat with
      const empRes = await fetch(`${API}/employees`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        // Exclude current logged in user from list
        setEmployees((empData.employees || []).filter((e: Employee) => e.id !== user?.id));
      }

      // Load conversations log
      const convRes = await fetch(`${API}/chat/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(convData.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadDirectory();
    }
  }, [isAuthenticated, accessToken, loadDirectory]);

  // Fetch messages in active thread
  const fetchMessages = useCallback(async () => {
    if (!accessToken || !selectedUser) return;
    try {
      const res = await fetch(`${API}/chat/messages/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
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

  // Automatic Polling to update thread messages and conversation list every 4 seconds
  useEffect(() => {
    if (!accessToken || !selectedUser) return;
    const interval = setInterval(() => {
      fetchMessages();
      // Also silently reload conversations in background
      fetch(`${API}/chat/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(res => res.ok && res.json())
        .then(data => data && setConversations(data.conversations || []))
        .catch(err => console.error(err));
    }, 4000);

    return () => clearInterval(interval);
  }, [accessToken, selectedUser, fetchMessages]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser || sendLoading) return;
    setSendLoading(true);

    try {
      const res = await fetch(`${API}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: messageInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setMessageInput('');
        
        // Refresh conversations list to update latest message status
        const convRes = await fetch(`${API}/chat/conversations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (convRes.ok) {
          const convData = await convRes.json();
          setConversations(convData.conversations || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || pageLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pt-24 pb-28 px-6 md:px-8 flex items-center justify-center">
          <div className="text-white/40 flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading portal chat...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pt-24 pb-28 px-6 md:px-8 flex flex-col h-screen max-h-screen overflow-hidden">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">
            Workspace <span className="gradient-text">Chat</span>
          </h1>
          <p className="text-white/40 text-xs">Direct private messages with team members.</p>
        </div>

        {/* Dual pane section */}
        <div className="flex-1 flex bg-white/03 border border-white/05 rounded-2xl overflow-hidden mb-6 h-[80%] max-h-[80%]">
          
          {/* Left panel: list of contacts & active chats */}
          <div className="w-[320px] border-r border-white/05 flex flex-col bg-white/01">
            <div className="p-4 border-b border-white/05">
              <div className="bg-white/05 rounded-xl px-3 py-2 flex items-center gap-2 border border-white/05">
                <Search size={16} className="text-white/30" />
                <input
                  type="text"
                  placeholder="Search teammate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-white outline-none w-full text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/30 px-3 tracking-wider block my-2">Teammates</span>
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedUser(emp)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${
                    selectedUser?.id === emp.id
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30'
                      : 'hover:bg-white/05 border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-semibold border border-white/05">
                    {emp.photoUrl ? (
                      <img src={emp.photoUrl} alt={emp.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white">{emp.username}</h4>
                    <p className="text-[10px] text-white/40">#{emp.employeeId} • {emp.role}</p>
                  </div>
                </button>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="text-center py-6 text-xs text-white/20">
                  No teammates found.
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Active chat window */}
          <div className="flex-1 flex flex-col justify-between">
            {selectedUser ? (
              <>
                {/* Active contact header bar */}
                <div className="p-4 border-b border-white/05 flex items-center justify-between bg-white/01">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                      {selectedUser.photoUrl ? (
                        <img src={selectedUser.photoUrl} alt={selectedUser.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{selectedUser.username}</h4>
                      <span className="text-[10px] text-indigo-400 font-semibold uppercase">{selectedUser.role}</span>
                    </div>
                  </div>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/01">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl ${
                          isOwn
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white/05 text-white/90 border border-white/05 rounded-tl-none'
                        }`}>
                          <p className="text-xs break-all leading-normal">{msg.content}</p>
                          <span className="text-[9px] text-white/40 block mt-1 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input bar */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/05 bg-white/02 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Type message to ${selectedUser.username}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 input-glass"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sendLoading}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30">
                <MessageSquare size={48} className="text-indigo-400/20 mb-3" />
                <h3 className="font-bold text-sm text-white/50">No chat selected</h3>
                <p className="text-xs text-white/30 max-w-[240px] mt-1">
                  Choose a teammate from the left sidebar directory to view credentials and start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

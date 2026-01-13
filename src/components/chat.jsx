import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext.jsx';

function Chat() {
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  
  const targetUserId = params.artisanId || params.id; 

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadTarget = async () => {
      if (!targetUserId || targetUserId === "null" || !user) return;
      try {
        const res = await fetch(`/api/artisan/${targetUserId}`);
        if (res.ok) {
          const data = await res.json();
          // The database requires the user_id for the receiver_id column
          setSelectedUser({
            id: data.user_id, 
            name: `${data.firstname} ${data.lastname}`
          });
        }
      } catch (err) {
        console.error("Failed to resolve target user ID");
      }
    };
    loadTarget();
  }, [targetUserId, user]);

  const fetchConversations = useCallback(async () => {
    if (!user || user.id === "null") return;
    try {
      const response = await fetch(`/api/messages/conversations-summary/${user.id}`, { 
        credentials: "include" 
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }
    fetchConversations();
  }, [user, navigate, fetchConversations]);

  useEffect(() => {
    if (!selectedUser || !selectedUser.id || !user) return;
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/conversations/${user.id}/${selectedUser.id}`, { 
          credentials: "include" 
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (err) { 
        console.error(err); 
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !selectedUser.id) return;
    try {
      const response = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sender_id: user.id, 
          receiver_id: selectedUser.id, 
          content: newMessage 
        }),
        credentials: "include",
      });
      if (response.ok) {
        setNewMessage("");
        fetchConversations();
      } else {
        const data = await response.json();
        alert(data.error || "Message failed to send");
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const displayConversations = [...conversations];
  if (selectedUser && selectedUser.id && !conversations.some(c => 
    String(c.receiver_id) === String(selectedUser.id) || String(c.sender_id) === String(selectedUser.id)
  )) {
    displayConversations.unshift({
      receiver_id: selectedUser.id,
      first_name: selectedUser.name.split(' ')[0],
      last_name: selectedUser.name.split(' ')[1] || '',
      content: "New Discussion..."
    });
  }

  return (
    <div className="flex h-screen bg-stone-100 text-stone-800 overflow-hidden">
      <div className="w-80 bg-white border-r border-stone-200 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="font-serif text-2xl text-stone-900 tracking-tight">Registry</h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400 mt-1 font-bold">Secure Correspondance</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayConversations.map((conv, i) => {
            const otherId = conv.receiver_id || (conv.sender_id === user.id ? conv.receiver_id : conv.sender_id);
            const isActive = String(selectedUser?.id) === String(otherId);
            return (
              <div
                key={i}
                onClick={() => navigate(`/chat/${otherId}`)}
                className={`p-5 cursor-pointer transition-all border-b border-stone-50 ${isActive ? 'bg-amber-50/60 border-l-4 border-l-amber-600' : 'hover:bg-stone-50'}`}
              >
                <h4 className={`text-sm font-bold ${isActive ? 'text-amber-900' : 'text-stone-700'}`}>
                  {conv.first_name} {conv.last_name}
                </h4>
                <p className="text-xs text-stone-400 truncate mt-1 italic">{conv.content}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-stone-50">
        {selectedUser && selectedUser.id ? (
          <>
            <div className="px-8 py-5 border-b border-stone-200 bg-white/90 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-serif text-amber-700 font-bold text-lg">
                {selectedUser.name[0]}
              </div>
              <div>
                <h3 className="font-serif text-xl">{selectedUser.name}</h3>
                <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Verified Professional</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${
                    msg.sender_id === user.id ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-stone-200 flex gap-4">
              <input
                type="text"
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-600 transition-all"
                placeholder="Write your inquiry..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="bg-amber-600 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-900 transition-all">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center italic text-stone-400 font-serif">
            Select a contact to begin correspondence.
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Chat() {
  const { user } = useAuth();
  const { artisanId: urlArtisanId } = useParams(); 
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [artisanIdInput, setArtisanIdInput] = useState("");
  const messagesEndRef = useRef(null);

  // 1. Auto-load Artisan from URL if present
  useEffect(() => {
    const loadUrlArtisan = async () => {
      if (urlArtisanId && user) {
        try {
          const res = await fetch(`http://localhost:8080/artisan/${urlArtisanId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedConversation({
              receiver_id: data.user_id || data.id, 
              first_name: data.firstname,
              last_name: data.lastname,
              artisan_id: data.id
            });
          }
        } catch (err) {
          setError("Failed to locate artisan archives.");
        }
      }
    };
    loadUrlArtisan();
  }, [urlArtisanId, user]);

  // 2. Fetch Sidebar Conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:8080/api/messages/conversations-summary/${user.id}`, { credentials: "include" });
      if (response.ok) setConversations(await response.json());
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    fetchConversations();
  }, [user, navigate, fetchConversations]);

  // 3. Polling Messages
  useEffect(() => {
    if (!selectedConversation || !user) return;
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/messages/conversations/${user.id}/${selectedConversation.receiver_id}`, { credentials: "include" });
        if (response.ok) setMessages(await response.json());
      } catch (err) { console.error(err); }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedConversation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const response = await fetch(`http://localhost:8080/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sender_id: user.id, 
          receiver_id: selectedConversation.receiver_id, 
          content: newMessage 
        }),
        credentials: "include",
      });
      if (response.ok) {
        setNewMessage("");
        const sent = await response.json();
        setMessages(prev => [...prev, sent]);
        fetchConversations();
      }
    } catch (err) { setError("Message failed to deliver."); }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen bg-stone-100 text-stone-800 font-sans overflow-hidden">
      {/* Sidebar (Same as previous design) */}
      <div className="w-80 bg-white border-r border-stone-200 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="font-serif text-2xl text-stone-900 tracking-tight">Guild Messages</h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400 mt-1 font-bold">Secure Consultations</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const receiverId = conv.sender_id === user.id ? conv.receiver_id : conv.sender_id;
            const isActive = selectedConversation?.receiver_id === receiverId;
            return (
              <div
                key={`${conv.sender_id}-${conv.receiver_id}`}
                onClick={() => {
                   setSelectedConversation({
                     receiver_id: receiverId,
                     first_name: conv.first_name,
                     last_name: conv.last_name,
                     artisan_id: conv.artisan_id,
                   });
                   navigate(`/chat/${conv.artisan_id || ''}`); // Keep URL in sync
                }}
                className={`p-5 cursor-pointer transition-all border-b border-stone-50 ${isActive ? 'bg-amber-50/60 border-l-4 border-l-amber-600' : 'hover:bg-stone-50'}`}
              >
                <h4 className={`text-sm font-bold ${isActive ? 'text-amber-900' : 'text-stone-700'}`}>
                  {conv.first_name} {conv.last_name}
                </h4>
                <p className="text-xs text-stone-400 truncate mt-1 italic">{conv.content || "Opening consultation..."}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Pane */}
      <div className="flex-1 flex flex-col bg-stone-50">
        {selectedConversation ? (
          <>
            <div className="px-8 py-5 border-b border-stone-200 bg-white/90 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-serif text-amber-700 font-bold">
                    {selectedConversation.first_name[0]}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl">{selectedConversation.first_name} {selectedConversation.last_name}</h3>
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Verified Professional</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
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
            Select a thread from the ledger to begin.
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
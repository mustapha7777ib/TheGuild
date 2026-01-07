import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Conversations() {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/signin"); return; }

    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8080/api/messages/conversations-summary/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        } else {
          setError("The ledger could not be reached.");
        }
      } catch (err) {
        setError("System synchronization failure.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user, loading, navigate]);

  if (loading || isLoading) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 border-b border-stone-200 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-serif text-stone-900 tracking-tighter">Correspondance</h1>
            <p className="text-amber-600 text-[10px] uppercase tracking-[0.4em] font-bold mt-4">Registry of Active Threads</p>
          </div>
          <span className="text-stone-300 font-serif italic text-4xl">{conversations.length}</span>
        </header>

        {error && <p className="text-red-600 font-serif italic mb-8">{error}</p>}

        {conversations.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-stone-200">
            <p className="font-serif italic text-stone-400">No active discussions found in the registry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => {
              const otherUserId = conv.sender_id === user.id ? conv.receiver_id : conv.sender_id;
              return (
                <Link 
                  key={`${conv.sender_id}-${conv.receiver_id}`} 
                  to={`/chat/${otherUserId}`}
                  className="group block bg-white border border-stone-100 p-8 hover:border-amber-600 transition-all duration-500 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-serif text-stone-900 group-hover:text-amber-600 transition-colors">
                          {conv.first_name} {conv.last_name}
                        </h3>
                        {conv.artisan_id && (
                          <span className="text-[8px] px-2 py-0.5 border border-stone-200 text-stone-400 uppercase font-black tracking-widest">Master</span>
                        )}
                      </div>
                      <p className="text-stone-500 font-serif italic text-sm line-clamp-1">{conv.content || "Click to view thread"}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-4">
                      {conv.unread_count > 0 && (
                        <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-1 rounded-full">
                          {conv.unread_count} New
                        </span>
                      )}
                      <span className="text-stone-300 group-hover:translate-x-2 transition-transform duration-500">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Conversations;
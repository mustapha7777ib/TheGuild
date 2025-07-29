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
    console.log("Conversations.jsx: user:", user, "user.id:", user?.id);
    if (loading) return;
    if (!user || !user.id) {
      console.log("No user or user.id, redirecting to signin");
      navigate("/signin");
      return;
    }

    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching conversations for userId: ${user.id}`);
        const response = await fetch(
          `http://localhost:8080/api/messages/conversations-summary/${user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Conversations data:", data);
          setConversations(data);
          setError("");
        } else {
          console.error("Fetch conversations failed:", response.status, response.statusText);
          setError(`Failed to fetch conversations: ${response.status}`);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err.message, err.stack);
        setError("Error fetching conversations. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user, loading, navigate]);

  if (loading || isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="conversations-container-head">
    <div className="conversations-container">
      <h2 className="title">Conversations</h2>
      {error && <p className="error-message">{error}</p>}
      {conversations.length === 0 ? (
        <p className="no-conversations">
          No conversations yet. Start a new conversation by selecting an artisan or user.
        </p>
      ) : (
        <ul className="conversation-list">
          {conversations.map((conv) => {
            const otherUserId = conv.sender_id === user.id ? conv.receiver_id : conv.sender_id;
            if (!otherUserId || otherUserId === "undefined") {
              console.warn("Skipping conversation with invalid otherUserId:", conv);
              return null;
            }
            return (
              <li key={`${conv.sender_id}-${conv.receiver_id}`} className="conversation-item">
                <Link to={`/chat/${otherUserId}`} className="conversation-link">
                  <div className="conversation-details">
                    <p className="conversation-name">
                      {conv.first_name} {conv.last_name}
                      {conv.artisan_id && <span className="artisan-label">Artisan</span>}
                    </p>
                    <p className="conversation-preview">{conv.content}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="unread-badge">{conv.unread_count}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </div>
  );
}

export default Conversations;
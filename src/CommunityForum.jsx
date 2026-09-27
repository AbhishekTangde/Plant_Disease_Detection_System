import { useState, useEffect } from "react";
import { api } from "./api";

export default function CommunityForum({ user, showToast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activePost, setActivePost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState("");

  const loadPosts = () => {
    setLoading(true);
    api.getPosts()
      .then(setPosts)
      .catch(e => showToast("Failed to load community posts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePost = () => {
    if (!user.loggedIn) { showToast("You must be logged in to post."); return; }
    if (!title.trim() || !content.trim()) { showToast("Please fill title and content."); return; }
    const newPost = {
      id: Date.now().toString(),
      userId: user.id || "1",
      authorName: user.name,
      authorRole: user.role || "Farmer",
      title: title.trim(),
      content: content.trim(),
      date: new Date().toLocaleDateString()
    };
    api.createPost(newPost).then(() => {
      showToast("Question posted to community!");
      setTitle("");
      setContent("");
      loadPosts();
    });
  };

  const openPost = (post) => {
    setActivePost(post);
    api.getReplies(post.id).then(setReplies);
  };

  const handleReply = () => {
    if (!user.loggedIn) { showToast("You must be logged in to reply."); return; }
    if (!replyContent.trim()) { showToast("Reply cannot be empty."); return; }
    const newReply = {
      id: Date.now().toString(),
      userId: user.id || "1",
      authorName: user.name,
      authorRole: user.role || "Farmer",
      content: replyContent.trim(),
      date: new Date().toLocaleDateString()
    };
    api.createReply(activePost.id, newReply).then(() => {
      showToast("Reply added!");
      setReplyContent("");
      api.getReplies(activePost.id).then(setReplies);
      loadPosts(); // refresh reply count on main feed
    });
  };

  if (activePost) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
        <button onClick={() => setActivePost(null)} style={{ background: "transparent", border: "1px solid var(--bd)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", marginBottom: 20, fontWeight: 700 }}>⬅ Back to Community</button>
        <div style={{ background: "var(--card)", padding: 24, borderRadius: "var(--r)", boxShadow: "var(--sh)", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Baloo 2',cursive", color: "var(--g1)", marginBottom: 8 }}>{activePost.title}</h2>
          <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--mu)", marginBottom: 16 }}>
            <strong>{activePost.authorName}</strong> 
            <span style={{ background: activePost.authorRole === "Agronomist" ? "#f59e0b22" : "var(--bg)", color: activePost.authorRole === "Agronomist" ? "#d97706" : "var(--mu)", padding: "2px 8px", borderRadius: 10, fontWeight: 800 }}>{activePost.authorRole}</span>
            <span>• {activePost.date}</span>
          </div>
          <p style={{ lineHeight: 1.6, color: "var(--text)" }}>{activePost.content}</p>
        </div>

        <h3 style={{ fontFamily: "'Baloo 2',cursive", color: "var(--g1)", marginBottom: 14 }}>Replies ({replies.length})</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {replies.map(r => (
            <div key={r.id} style={{ background: "var(--card)", padding: 18, borderRadius: "var(--r)", borderLeft: r.authorRole === "Agronomist" ? "4px solid #f59e0b" : "1px solid var(--bd)" }}>
              <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--mu)", marginBottom: 8 }}>
                <strong>{r.authorName}</strong>
                {r.authorRole === "Agronomist" && <span style={{ background: "#f59e0b22", color: "#d97706", padding: "2px 8px", borderRadius: 10, fontWeight: 800 }}>✅ Certified Agronomist</span>}
                <span>• {r.date}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text)" }}>{r.content}</p>
            </div>
          ))}
        </div>

        {user.loggedIn ? (
          <div style={{ background: "var(--card)", padding: 18, borderRadius: "var(--r)", border: "1px solid var(--bd)" }}>
            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Write an answer or comment..." style={{ width: "100%", padding: 14, border: "1px solid var(--bd)", borderRadius: 10, marginBottom: 10, minHeight: 80, fontFamily: "'Nunito',sans-serif", background: "var(--bg)", outline: "none" }} />
            <button onClick={handleReply} style={{ background: "var(--g1)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 40, fontWeight: 800, cursor: "pointer", float: "right" }}>Post Reply</button>
            <div style={{ clear: "both" }} />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 20, color: "var(--mu)", fontStyle: "italic" }}>Log in to post a reply.</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <div className="phdr" style={{ marginBottom: 20 }}><h2>🌍 Community Forum</h2><p>Ask questions and get answers from certified Agronomists and fellow farmers.</p></div>
      
      {user.loggedIn ? (
        <div style={{ background: "var(--card)", padding: 20, borderRadius: "var(--r)", boxShadow: "var(--sh)", marginBottom: 24 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Question Title (e.g., White spots on tomato leaves?)" style={{ width: "100%", padding: 14, border: "1px solid var(--bd)", borderRadius: 10, marginBottom: 10, fontFamily: "'Nunito',sans-serif", background: "var(--bg)", outline: "none", fontWeight: 700 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Describe your issue in detail..." style={{ width: "100%", padding: 14, border: "1px solid var(--bd)", borderRadius: 10, marginBottom: 10, minHeight: 80, fontFamily: "'Nunito',sans-serif", background: "var(--bg)", outline: "none" }} />
          <button onClick={handlePost} style={{ background: "var(--g1)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 40, fontWeight: 800, cursor: "pointer", width: "100%" }}>Post Question</button>
        </div>
      ) : (
        <div style={{ background: "var(--bg)", padding: 20, borderRadius: "var(--r)", textAlign: "center", marginBottom: 24, border: "1.5px dashed var(--bd)" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
          <div style={{ fontWeight: 800, color: "var(--g1)" }}>Log in to ask questions</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><div className="sp" style={{ width: 30, height: 30, margin: "0 auto", border: "3px solid var(--bd)", borderTopColor: "var(--g1)" }} /></div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--mu)" }}>No posts yet. Be the first to ask!</div>
        ) : (
          posts.map(p => (
            <div key={p.id} onClick={() => openPost(p)} style={{ background: "var(--card)", padding: 20, borderRadius: "var(--r)", border: "1px solid var(--bd)", cursor: "pointer", transition: "transform .2s", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }} onMouseOver={e => e.currentTarget.style.transform="scale(1.01)"} onMouseOut={e => e.currentTarget.style.transform="scale(1)"}>
              <h3 style={{ margin: "0 0 8px", color: "var(--g1)", fontSize: 18 }}>{p.title}</h3>
              <p style={{ margin: "0 0 14px", color: "var(--text)", fontSize: 13, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.content}</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--mu)", fontWeight: 700 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span>{p.authorName}</span>
                  {p.authorRole === "Agronomist" && <span style={{ color: "#d97706", background: "#f59e0b22", padding: "2px 6px", borderRadius: 6 }}>Agronomist</span>}
                </div>
                <div>💬 {p.replies} Replies • {p.date}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

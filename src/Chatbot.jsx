import { useState, useRef, useEffect } from "react";

export default function Chatbot({ t, lang }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I am your AI Agronomist assistant. Ask me anything about farming, soil, or crop management." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(p => [...p, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      let aiResp = "I recommend monitoring soil moisture and using balanced NPK fertilizers. Can you provide more details?";
      const lower = userMsg.toLowerCase();
      if (lower.includes("weather") || lower.includes("rain")) aiResp = "Always check the local forecast before applying fertilizers or pesticides. Heavy rain can wash them away!";
      if (lower.includes("tomato") && lower.includes("yellow")) aiResp = "Yellowing tomato leaves often indicate a nitrogen deficiency or early signs of blight. Ensure you are applying a balanced fertilizer.";
      if (lower.includes("price") || lower.includes("market")) aiResp = "Market prices fluctuate based on season and region. Government portals like e-NAM provide the best real-time updates.";
      
      setMessages(p => [...p, { role: "ai", content: aiResp }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {open ? (
        <div style={{ 
          width: 360, height: 500, 
          background: "var(--card)", 
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderRadius: "24px", 
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)", 
          display: "flex", flexDirection: "column", overflow: "hidden", 
          border: "1px solid rgba(255,255,255,0.2)",
          animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,var(--g1),var(--g3))", padding: "20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22, background: "#fff", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>🤖</div>
              <div>
                <div style={{ fontWeight: 800, fontFamily: "'Outfit',sans-serif", fontSize: 18, letterSpacing: "0.02em" }}>AI Agronomist</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.8)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span>
                  24/7 Expert Help
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 32, height: 32, border: "none", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.3)"} onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}>✖</button>
          </div>

          {/* Chat Area */}
          <div ref={scrollRef} style={{ flex: 1, padding: "20px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, background: "rgba(240,247,244,0.3)" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                {m.role === "ai" && <div style={{ fontSize: 18, marginTop: 4 }}>🤖</div>}
                <div style={{ 
                  background: m.role === "user" ? "linear-gradient(135deg,var(--g1),var(--g3))" : "var(--card-solid)", 
                  color: m.role === "user" ? "#fff" : "var(--text)", 
                  padding: "12px 16px", 
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", 
                  fontSize: 14, 
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: "0 4px 12px rgba(0,0,0,.05)", 
                  border: m.role === "ai" ? "1px solid var(--bd)" : "none", 
                  lineHeight: 1.5 
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignSelf: "flex-start" }}>
                <div style={{ fontSize: 18, marginTop: 4 }}>🤖</div>
                <div style={{ background: "var(--card-solid)", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", border: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="dot-pulse" style={{ width: 6, height: 6, background: "var(--g3)", borderRadius: "50%", animation: "pulse 1.5s infinite" }}></span>
                  <span className="dot-pulse" style={{ width: 6, height: 6, background: "var(--g3)", borderRadius: "50%", animation: "pulse 1.5s infinite 0.2s" }}></span>
                  <span className="dot-pulse" style={{ width: 6, height: 6, background: "var(--g3)", borderRadius: "50%", animation: "pulse 1.5s infinite 0.4s" }}></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: 16, borderTop: "1px solid var(--bd)", background: "var(--card)", display: "flex", gap: 10 }}>
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask a farming question..." 
              style={{ flex: 1, padding: "12px 16px", border: "1.5px solid var(--bd)", borderRadius: 40, outline: "none", fontSize: 14, fontFamily: "'Inter',sans-serif", background: "rgba(255,255,255,0.5)", transition: "all 0.3s" }} 
              onFocus={e => { e.target.style.borderColor = "var(--g3)"; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = "var(--bd)"; e.target.style.background = "rgba(255,255,255,0.5)"; }}
            />
            <button onClick={handleSend} style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,var(--g1),var(--g3))", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, flexShrink: 0, boxShadow: "0 4px 12px rgba(26,71,49,.3)", transition: "transform 0.2s" }} onMouseOver={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>
              ➤
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,var(--g1),var(--g3))", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 24px rgba(26,71,49,.4)", transition: "transform .3s cubic-bezier(0.4, 0, 0.2, 1)" }} onMouseOver={e=>e.currentTarget.style.transform="scale(1.1) translateY(-4px)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1) translateY(0)"}>
          <span style={{ fontSize: 32 }}>🤖</span>
        </button>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

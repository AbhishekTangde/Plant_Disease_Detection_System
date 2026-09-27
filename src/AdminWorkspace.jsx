import { useState, useEffect } from "react";

const SEED_USERS = [
  { id: 1, name: "Ravi Kumar", email: "ravi@farm.in", password: "password123", role: "Farmer", joined: "2025-01-12", scans: 34, status: "active" },
  { id: 2, name: "Priya Sharma", email: "priya@agri.in", password: "password123", role: "Farmer", joined: "2025-02-20", scans: 18, status: "active" },
  { id: 3, name: "Mohan Das", email: "mohan@soil.in", password: "password123", role: "Agronomist", joined: "2025-03-05", scans: 72, status: "active" },
  { id: 4, name: "Anita Patel", email: "anita@crop.in", password: "password123", role: "Farmer", joined: "2025-03-18", scans: 9, status: "inactive" },
  { id: 5, name: "Sanjay Rao", email: "sanjay@plant.in", password: "password123", role: "Dealer", joined: "2025-04-01", scans: 5, status: "active" },
];
const EMPTY_FORM = { name: "", email: "", role: "Farmer", status: "active" };

const PRODUCTS = [
  { id: 1, name: "Neem Oil Spray", category: "Fungicide", price: 299, stock: 142, sold: 310 },
  { id: 2, name: "Bio Fertilizer Mix", category: "Fertilizer", price: 450, stock: 88, sold: 195 },
  { id: 3, name: "Copper Sulphate", category: "Fungicide", price: 180, stock: 230, sold: 520 },
  { id: 4, name: "Mancozeb 75WP", category: "Fungicide", price: 320, stock: 60, sold: 280 },
  { id: 5, name: "NPK 19-19-19", category: "Fertilizer", price: 550, stock: 175, sold: 410 },
];

const SCANS = [
  { id: "SC001", user: "Ravi Kumar", crop: "Tomato", disease: "Early Blight", accuracy: 94, date: "2026-04-21", status: "treated" },
  { id: "SC002", user: "Mohan Das", crop: "Wheat", disease: "Leaf Rust", accuracy: 91, date: "2026-04-21", status: "pending" },
  { id: "SC003", user: "Priya Sharma", crop: "Rice", disease: "Brown Spot", accuracy: 88, date: "2026-04-20", status: "treated" },
  { id: "SC004", user: "Anita Patel", crop: "Potato", disease: "Late Blight", accuracy: 96, date: "2026-04-20", status: "critical" },
  { id: "SC005", user: "Sanjay Rao", crop: "Corn", disease: "Healthy", accuracy: 99, date: "2026-04-19", status: "healthy" },
  { id: "SC006", user: "Ravi Kumar", crop: "Mango", disease: "Anthracnose", accuracy: 87, date: "2026-04-19", status: "pending" },
];

const ALERTS = [
  { type: "warn", msg: "Late Blight outbreak detected in 3 farms — Nashik region", time: "2h ago" },
  { type: "info", msg: "New scheme PM-KISAN disbursement cycle started", time: "5h ago" },
  { type: "success", msg: "Stock replenishment: Copper Sulphate added (200 units)", time: "1d ago" },
  { type: "error", msg: "API rate limit reached — weather service throttled", time: "1d ago" },
];

const TABS = ["Dashboard", "Users", "Products", "Scan Logs", "Alerts", "Settings"];

const statColor = (s) => s === "treated" ? "#22c55e" : s === "pending" ? "#f59e0b" : s === "critical" ? "#ef4444" : "#3b82f6";

export default function AdminWorkspace({ darkMode }) {
  const [tab, setTab] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [prodSearch, setProdSearch] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [tick, setTick] = useState(0);

  // ── User Database (localStorage) ──
  const [users, setUsers] = useState(() => {
    try { const s = localStorage.getItem("agri_users"); return s ? JSON.parse(s) : SEED_USERS; }
    catch { return SEED_USERS; }
  });
  const [modal, setModal] = useState(null); // null | "add" | "edit"
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState("");

  const saveUsers = (next) => { setUsers(next); localStorage.setItem("agri_users", JSON.stringify(next)); };

  const openAdd = () => { setForm(EMPTY_FORM); setFormErr(""); setModal("add"); };
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, role: u.role, status: u.status }); setEditTarget(u.id); setFormErr(""); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditTarget(null); };

  const handleSave = () => {
    if (!form.name.trim()) { setFormErr("Name is required."); return; }
    if (!form.email.trim() || !form.email.includes("@")) { setFormErr("Valid email is required."); return; }
    if (modal === "add") {
      if (users.find(u => u.email === form.email.trim())) { setFormErr("Email already exists."); return; }
      const next = [...users, { id: Date.now(), name: form.name.trim(), email: form.email.trim(), role: form.role, status: form.status, joined: new Date().toISOString().split("T")[0], scans: 0 }];
      saveUsers(next);
    } else {
      saveUsers(users.map(u => u.id === editTarget ? { ...u, name: form.name.trim(), email: form.email.trim(), role: form.role, status: form.status } : u));
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this user?")) return;
    saveUsers(users.filter(u => u.id !== id));
  };

  const toggleStatus = (id) => saveUsers(users.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));

  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 3000); return () => clearInterval(id); }, []);

  const bg = darkMode ? "#09130f" : "transparent"; // inherit from App.jsx if possible, or use exact
  const card = darkMode ? "rgba(16,30,23,0.75)" : "rgba(255, 255, 255, 0.85)";
  const text = darkMode ? "#e8f5ee" : "#112218";
  const muted = darkMode ? "#80bd9c" : "#5a7a65";
  const border = darkMode ? "rgba(48,217,136,0.15)" : "rgba(205, 229, 215, 0.6)";
  const accent = darkMode ? "#30d988" : "#1a4731";

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredProds = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const cardStyle = {
    background: card, 
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderRadius: 20, padding: "22px 24px",
    boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,.3)" : "0 8px 32px rgba(26,71,49,.08)", 
    border: `1px solid ${border}`,
  };

  const btnStyle = (active) => ({
    padding: "8px 18px", borderRadius: 40, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: 13, transition: "all .18s",
    background: active ? accent : "transparent",
    color: active ? "#fff" : muted,
  });

  const tagStyle = (color) => ({
    display: "inline-block", padding: "2px 10px", borderRadius: 40,
    fontSize: 11, fontWeight: 800, background: color + "22", color,
  });

  const inputStyle = {
    padding: "9px 14px", border: `1.5px solid ${border}`, borderRadius: 10,
    fontSize: 13, background: card, color: text, outline: "none", width: "100%",
  };

  // ─── Stats ───────────────────────────────────────────────────────────────
  const STATS = [
    { ic: "👥", label: "Total Users", val: users.length, sub: "+2 this week", col: "#3b82f6" },
    { ic: "🔬", label: "Total Scans", val: SCANS.length, sub: "Today: 2", col: "#22c55e" },
    { ic: "📦", label: "Products", val: PRODUCTS.length, sub: "3 low stock", col: "#f59e0b" },
    { ic: "⚠️", label: "Critical Cases", val: SCANS.filter(s => s.status === "critical").length, sub: "Immediate action", col: "#ef4444" },
    { ic: "✅", label: "Treated", val: SCANS.filter(s => s.status === "treated").length, sub: "Recovery rate 89%", col: "#10b981" },
    { ic: "📊", label: "Avg Accuracy", val: Math.round(SCANS.reduce((a, s) => a + s.accuracy, 0) / SCANS.length) + "%", sub: "Model v3.2", col: "#8b5cf6" },
  ];

  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ ...cardStyle, borderLeft: `4px solid ${s.col}`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 28 }}>{s.ic}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.col }}>{s.val}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: text }}>{s.label}</div>
              <div style={{ fontSize: 10.5, color: muted, marginTop: 1 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Disease breakdown */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 14, color: text, marginBottom: 14 }}>🦠 Disease Breakdown</div>
          {[
            { name: "Early Blight", pct: 34, col: "#ef4444" },
            { name: "Leaf Rust", pct: 22, col: "#f59e0b" },
            { name: "Brown Spot", pct: 18, col: "#8b5cf6" },
            { name: "Late Blight", pct: 14, col: "#ec4899" },
            { name: "Healthy", pct: 12, col: "#22c55e" },
          ].map((d, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: text, marginBottom: 4 }}>
                <span>{d.name}</span><span>{d.pct}%</span>
              </div>
              <div style={{ background: border, borderRadius: 40, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${d.pct}%`, height: "100%", background: d.col, borderRadius: 40, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Crop distribution */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 14, color: text, marginBottom: 14 }}>🌾 Crop Distribution</div>
          {[
            { name: "Tomato", pct: 28, col: "#ef4444" },
            { name: "Wheat", pct: 22, col: "#f59e0b" },
            { name: "Rice", pct: 18, col: "#3b82f6" },
            { name: "Potato", pct: 16, col: "#8b5cf6" },
            { name: "Corn", pct: 10, col: "#f97316" },
            { name: "Mango", pct: 6, col: "#22c55e" },
          ].map((d, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: text, marginBottom: 4 }}>
                <span>{d.name}</span><span>{d.pct}%</span>
              </div>
              <div style={{ background: border, borderRadius: 40, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${d.pct}%`, height: "100%", background: d.col, borderRadius: 40, transition: "width 1.2s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Sales & Revenue */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 14, color: text, marginBottom: 14 }}>💰 Sales & Revenue</div>
          {[
            { name: "Fertilizers", pct: 45, col: "#3b82f6" },
            { name: "Fungicides", pct: 28, col: "#ef4444" },
            { name: "Pesticides", pct: 15, col: "#f59e0b" },
            { name: "Agri Tools", pct: 12, col: "#10b981" },
          ].map((d, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: text, marginBottom: 4 }}>
                <span>{d.name}</span><span>{d.pct}%</span>
              </div>
              <div style={{ background: border, borderRadius: 40, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${d.pct}%`, height: "100%", background: d.col, borderRadius: 40, transition: "width 1.5s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent alerts */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, fontSize: 14, color: text, marginBottom: 14 }}>🔔 Recent Alerts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ALERTS.map((a, i) => {
            const cols = { warn: "#f59e0b", info: "#3b82f6", success: "#22c55e", error: "#ef4444" };
            const ics = { warn: "⚠️", info: "ℹ️", success: "✅", error: "🚨" };
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", borderRadius: 10, background: cols[a.type] + "14", border: `1px solid ${cols[a.type]}44` }}>
                <span style={{ fontSize: 18 }}>{ics[a.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{a.msg}</div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: text }}>👥 User Management <span style={{ fontSize: 12, color: muted, fontWeight: 600 }}>({users.length} total)</span></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, width: 200 }} placeholder="Search users…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          <button onClick={openAdd} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: accent, color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>+ Add User</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: accent + "18" }}>
              {["#", "Name", "Email", "Role", "Joined", "Scans", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, color: accent, fontSize: 11.5, letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${border}`, background: i % 2 === 0 ? "transparent" : accent + "06" }}>
                <td style={{ padding: "10px 12px", color: muted, fontSize: 11 }}>{i + 1}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: text }}>{u.name}</td>
                <td style={{ padding: "10px 12px", color: muted }}>{u.email}</td>
                <td style={{ padding: "10px 12px" }}><span style={tagStyle(u.role === "Agronomist" ? "#8b5cf6" : u.role === "Dealer" ? "#f59e0b" : "#3b82f6")}>{u.role}</span></td>
                <td style={{ padding: "10px 12px", color: muted }}>{u.joined}</td>
                <td style={{ padding: "10px 12px", fontWeight: 800, color: accent }}>{u.scans}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span onClick={() => toggleStatus(u.id)} style={{ ...tagStyle(u.status === "active" ? "#22c55e" : "#ef4444"), cursor: "pointer" }} title="Click to toggle">{u.status}</span>
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(u)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${accent}44`, background: accent + "12", color: accent, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✏️ Edit</button>
                  <button onClick={() => handleDelete(u.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ef444444", background: "#ef444412", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <div style={{ textAlign: "center", padding: 30, color: muted }}>No users found</div>}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: text }}>📦 Product Management</div>
        <input style={{ ...inputStyle, width: 220 }} placeholder="Search products…" value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 14 }}>
        {filteredProds.map(p => {
          const stockPct = Math.round(p.stock / (p.stock + p.sold) * 100);
          const lowStock = p.stock < 80;
          return (
            <div key={p.id} style={{ ...cardStyle, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: text }}>{p.name}</div>
                <span style={tagStyle(p.category === "Fungicide" ? "#ef4444" : "#22c55e")}>{p.category}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: accent, marginBottom: 6 }}>₹{p.price}</div>
              <div style={{ fontSize: 12, color: muted, marginBottom: 10 }}>
                Stock: <strong style={{ color: lowStock ? "#ef4444" : text }}>{p.stock}</strong> · Sold: <strong style={{ color: text }}>{p.sold}</strong>
              </div>
              <div style={{ background: border, borderRadius: 40, height: 6, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${stockPct}%`, height: "100%", background: lowStock ? "#ef4444" : accent, borderRadius: 40 }} />
              </div>
              <div style={{ fontSize: 11, color: muted }}>{stockPct}% in stock{lowStock ? " ⚠️ Low" : ""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderScanLogs = () => (
    <div style={cardStyle}>
      <div style={{ fontWeight: 800, fontSize: 15, color: text, marginBottom: 16 }}>🔬 Scan Logs</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: accent + "18" }}>
              {["Scan ID", "User", "Crop", "Disease", "Accuracy", "Date", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, color: accent, fontSize: 11.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCANS.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${border}`, background: i % 2 === 0 ? "transparent" : accent + "06" }}>
                <td style={{ padding: "10px 12px", color: muted, fontWeight: 700 }}>{s.id}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: text }}>{s.user}</td>
                <td style={{ padding: "10px 12px", color: text }}>{s.crop}</td>
                <td style={{ padding: "10px 12px", color: text }}>{s.disease}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontWeight: 800, color: s.accuracy >= 90 ? "#22c55e" : "#f59e0b" }}>{s.accuracy}%</span>
                </td>
                <td style={{ padding: "10px 12px", color: muted }}>{s.date}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={tagStyle(statColor(s.status))}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {ALERTS.map((a, i) => {
        const cols = { warn: "#f59e0b", info: "#3b82f6", success: "#22c55e", error: "#ef4444" };
        const labels = { warn: "Warning", info: "Info", success: "Success", error: "Error" };
        const ics = { warn: "⚠️", info: "ℹ️", success: "✅", error: "🚨" };
        return (
          <div key={i} style={{ ...cardStyle, borderLeft: `4px solid ${cols[a.type]}`, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 26 }}>{ics[a.type]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                <span style={tagStyle(cols[a.type])}>{labels[a.type]}</span>
                <span style={{ fontSize: 11, color: muted }}>{a.time}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: text }}>{a.msg}</div>
            </div>
            <button style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Dismiss</button>
          </div>
        );
      })}
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 40, background: value ? accent : border,
      cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "#fff", transition: "left .2s",
        boxShadow: "0 1px 4px rgba(0,0,0,.2)",
      }} />
    </div>
  );

  const renderSettings = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[
        {
          title: "🔧 System", rows: [
            { label: "Maintenance Mode", desc: "Disable public access temporarily", val: maintenanceMode, set: setMaintenanceMode },
            { label: "Email Notifications", desc: "Send alerts to admin inbox", val: emailNotifs, set: setEmailNotifs },
            { label: "Auto Backup", desc: "Daily database snapshots at 2 AM", val: autoBackup, set: setAutoBackup },
          ]
        },
        {
          title: "📊 Reports", rows: []
        }
      ].map((section, si) => (
        <div key={si} style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 15, color: text, marginBottom: 16 }}>{section.title}</div>
          {section.rows.map((r, ri) => (
            <div key={ri} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: ri < section.rows.length - 1 ? `1px solid ${border}` : "none" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: text }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: muted, marginTop: 2 }}>{r.desc}</div>
              </div>
              <Toggle value={r.val} onChange={r.set} />
            </div>
          ))}
          {section.rows.length === 0 && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["Export CSV", "Export PDF", "Download DB Backup"].map(label => (
                <button key={label} style={{ padding: "9px 18px", borderRadius: 10, border: `1.5px solid ${border}`, background: "transparent", color: text, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{label}</button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={cardStyle}>
        <div style={{ fontWeight: 800, fontSize: 15, color: text, marginBottom: 16 }}>🔐 Admin Credentials</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {["Admin Email", "New Password", "Confirm Password"].map(lbl => (
            <div key={lbl}>
              <div style={{ fontSize: 11, fontWeight: 800, color: muted, marginBottom: 6, letterSpacing: ".08em" }}>{lbl.toUpperCase()}</div>
              <input type={lbl.includes("Password") ? "password" : "email"} placeholder={lbl} style={inputStyle} />
            </div>
          ))}
        </div>
        <button style={{ marginTop: 16, padding: "10px 28px", borderRadius: 10, border: "none", background: accent, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Save Changes</button>
      </div>
    </div>
  );

  const panels = [renderDashboard, renderUsers, renderProducts, renderScanLogs, renderAlerts, renderSettings];

  const iStyle = { padding: "9px 12px", border: `1.5px solid ${border}`, borderRadius: 9, fontSize: 13, background: card, color: text, outline: "none", width: "100%", boxSizing: "border-box" };
  const lStyle = { fontSize: 11, fontWeight: 800, color: muted, letterSpacing: ".07em", marginBottom: 5, display: "block" };

  return (
    <div style={{ background: bg, minHeight: "100%", position: "relative" }}>
      {/* Header */}
      <div style={{ padding: "10px 0 24px", marginBottom: 24, borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 28, color: text, margin: 0, letterSpacing: "-0.02em" }}>🛡️ Admin Workspace</h2>
          <p style={{ fontSize: 13, color: muted, margin: "4px 0 0", fontFamily: "'Inter', sans-serif" }}>Borcelle Agri · Super Admin Panel</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: muted }}>System Online</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24, background: card, backdropFilter: "blur(16px)", borderRadius: 16, padding: "8px", border: `1px solid ${border}`, boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,.3)" : "0 8px 32px rgba(26,71,49,.08)" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={btnStyle(tab === i)}>{t}</button>
        ))}
      </div>

      {/* Content */}
      {panels[tab]()}

      {/* Add / Edit User Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "slideUp 0.2s ease-out" }} onClick={closeModal}>
          <div style={{ background: card, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 24, padding: "32px", width: "100%", maxWidth: 460, boxShadow: "0 24px 80px rgba(0,0,0,.4)", border: `1px solid ${border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontFamily: "'Outfit', sans-serif", fontSize: 22, color: text, marginBottom: 24 }}>{modal === "add" ? "➕ Add New User" : "✏️ Edit User"}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lStyle}>FULL NAME</label><input style={iStyle} placeholder="e.g. Ravi Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label style={lStyle}>EMAIL</label><input style={iStyle} placeholder="e.g. ravi@farm.in" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label style={lStyle}>ROLE</label>
                <select style={iStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {["Farmer", "Agronomist", "Dealer", "Researcher"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={lStyle}>STATUS</label>
                <select style={iStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {formErr && <div style={{ marginTop: 12, color: "#ef4444", fontSize: 12, fontWeight: 700 }}>⚠️ {formErr}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={handleSave} style={{ flex: 1, padding: "11px", borderRadius: 9, border: "none", background: accent, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                {modal === "add" ? "Add User" : "Save Changes"}
              </button>
              <button onClick={closeModal} style={{ padding: "11px 20px", borderRadius: 9, border: `1.5px solid ${border}`, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

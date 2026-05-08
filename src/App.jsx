import { useState, useEffect, useRef, useCallback } from "react";

// ─── IndexedDB Helper ────────────────────────────────────────────────────────
const DB_NAME = "wa_helper_db";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("contacts")) {
        db.createObjectStore("contacts", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("lists")) {
        db.createObjectStore("lists", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(store, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(store, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Phone Sanitizer (Egypt) ──────────────────────────────────────────────────
function sanitizePhone(raw) {
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("20")) return n;
  if (n.startsWith("0")) n = n.slice(1);
  return "20" + n;
}

// ─── Spintax Resolver ─────────────────────────────────────────────────────────
function resolveSpintax(text) {
  return text.replace(/\[([^\]]+)\]/g, (_, opts) => {
    const parts = opts.split("|");
    return parts[Math.floor(Math.random() * parts.length)];
  });
}

// ─── ID Generator ─────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.82-1.81a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/>
    </svg>
  ),
  List: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Info: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Zap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function WhatsAppHelper() {
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("home"); // home | lists | device | about | settings | customize
  const [sideOpen, setSideOpen] = useState(false);
  const [installBanner, setInstallBanner] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Contacts & Lists
  const [contacts, setContacts] = useState([]);
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);

  // Message
  const [message, setMessage] = useState("أهلاً بك عزيزي {اسم}، نود إعلامك بأن...");
  const [signature, setSignature] = useState("");
  const [messageVersions, setMessageVersions] = useState(["", "", ""]);
  const [waVersion, setWaVersion] = useState("basic"); // basic | clone

  // Sending
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0, current: "" });
  const [breakCountdown, setBreakCountdown] = useState(0);
  const sendingRef = useRef(false);

  // UI states
  const [contactModal, setContactModal] = useState(null); // null | {id?, name, phone}
  const [listModal, setListModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Settings
  const [settings, setSettings] = useState({ minDelay: 2, maxDelay: 4, breakEvery: 20, breakDuration: 30 });

  // Load from DB
  useEffect(() => {
    (async () => {
      const [c, l, s] = await Promise.all([
        dbGetAll("contacts"),
        dbGetAll("lists"),
        dbGetAll("settings"),
      ]);
      setContacts(c);
      setLists(l.length ? l : [{ id: "default", name: "القائمة الرئيسية", contactIds: [] }]);
      s.forEach((item) => {
        if (item.key === "settings") setSettings(item.value);
        if (item.key === "message") setMessage(item.value);
        if (item.key === "signature") setSignature(item.value);
        if (item.key === "dark") setDark(item.value);
      });
    })();

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    if (lists.length && !activeListId) setActiveListId(lists[0].id);
  }, [lists]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Contact Operations ────────────────────────────────────────────────────
  const saveContact = async (contact) => {
    await dbPut("contacts", contact);
    setContacts((prev) => {
      const exists = prev.find((c) => c.id === contact.id);
      return exists ? prev.map((c) => (c.id === contact.id ? contact : c)) : [...prev, contact];
    });
    // Add to active list
    if (!contact._edit && activeListId) {
      const list = lists.find((l) => l.id === activeListId);
      if (list && !list.contactIds.includes(contact.id)) {
        const updated = { ...list, contactIds: [...list.contactIds, contact.id] };
        await dbPut("lists", updated);
        setLists((prev) => prev.map((l) => (l.id === activeListId ? updated : l)));
      }
    }
  };

  const deleteContact = async (id) => {
    await dbDelete("contacts", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    // Remove from lists
    for (const list of lists) {
      if (list.contactIds.includes(id)) {
        const updated = { ...list, contactIds: list.contactIds.filter((cid) => cid !== id) };
        await dbPut("lists", updated);
        setLists((prev) => prev.map((l) => (l.id === list.id ? updated : l)));
      }
    }
  };

  const saveList = async (list) => {
    await dbPut("lists", list);
    setLists((prev) => {
      const exists = prev.find((l) => l.id === list.id);
      return exists ? prev.map((l) => (l.id === list.id ? list : l)) : [...prev, list];
    });
  };

  const deleteList = async (id) => {
    await dbDelete("lists", id);
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (activeListId === id) setActiveListId(lists[0]?.id);
  };

  // ─── Bulk Import ───────────────────────────────────────────────────────────
  const handleBulkImport = async (text) => {
    const lines = text.split("\n").filter((l) => l.trim());
    const newContacts = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      const phone = sanitizePhone(parts[0] || "");
      const name = parts[1] || phone;
      if (phone.length >= 10) {
        const c = { id: uid(), name, phone };
        await saveContact(c);
        newContacts.push(c);
      }
    }
    showToast(`تم استيراد ${newContacts.length} جهة اتصال`);
  };

  // ─── Sending Engine ────────────────────────────────────────────────────────
  const activeList = lists.find((l) => l.id === activeListId);
  const activeContacts = activeList
    ? contacts.filter((c) => activeList.contactIds.includes(c.id))
    : [];

  const buildMessage = (contact) => {
    const versions = [message, ...messageVersions.filter((v) => v.trim())];
    const chosen = versions[Math.floor(Math.random() * versions.length)];
    const resolved = resolveSpintax(chosen).replace(/\{اسم\}/g, contact.name);
    return signature ? resolved + "\n\n" + signature : resolved;
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const startSending = async () => {
    if (!activeContacts.length) { showToast("لا توجد جهات اتصال", "error"); return; }
    sendingRef.current = true;
    setSending(true);
    setProgress({ sent: 0, total: activeContacts.length, current: "" });

    for (let i = 0; i < activeContacts.length; i++) {
      if (!sendingRef.current) break;

      if (i > 0 && i % settings.breakEvery === 0) {
        let cd = settings.breakDuration;
        while (cd > 0 && sendingRef.current) {
          setBreakCountdown(cd);
          await sleep(1000);
          cd--;
        }
        setBreakCountdown(0);
      }

      const contact = activeContacts[i];
      const phone = sanitizePhone(contact.phone);
      const msg = encodeURIComponent(buildMessage(contact));
      const url = waVersion === "basic"
        ? `whatsapp://send?phone=${phone}&text=${msg}`
        : `intent://send?phone=${phone}&text=${msg}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`;

      setProgress({ sent: i, total: activeContacts.length, current: contact.name });

      window.open(url, "_blank");

      const delay = (settings.minDelay + Math.random() * (settings.maxDelay - settings.minDelay)) * 1000;
      await sleep(delay);
    }

    if (sendingRef.current) {
      setProgress((p) => ({ ...p, sent: p.total, current: "اكتمل!" }));
      showToast("تم إرسال جميع الرسائل بنجاح! 🎉");
    }
    setSending(false);
    sendingRef.current = false;
  };

  const stopSending = () => {
    sendingRef.current = false;
    setSending(false);
    setBreakCountdown(0);
    showToast("تم إيقاف الإرسال", "info");
  };

  // ─── Theme ─────────────────────────────────────────────────────────────────
  const toggleDark = async () => {
    const newVal = !dark;
    setDark(newVal);
    await dbPut("settings", { key: "dark", value: newVal });
  };

  const bg = dark ? "#0f172a" : "#f8fafc";
  const surface = dark ? "#1e293b" : "#ffffff";
  const surface2 = dark ? "#293548" : "#f1f5f9";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const textMuted = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "#334155" : "#e2e8f0";
  const emerald = "#10b981";
  const emeraldDark = "#059669";

  const nav = [
    { id: "home", label: "الرئيسية", icon: Icons.Zap },
    { id: "lists", label: "إدارة القوائم", icon: Icons.List },
    { id: "device", label: "إدارة الجهات", icon: Icons.Users },
    { id: "customize", label: "تخصيص الرسائل", icon: Icons.Edit },
    { id: "settings", label: "الإعدادات", icon: Icons.Settings },
    { id: "about", label: "حول التطبيق", icon: Icons.Info },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: bg,
        color: text,
        fontFamily: "'Cairo', 'Tajawal', 'Segoe UI', sans-serif",
        transition: "background 0.3s, color 0.3s",
        position: "relative",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Google Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --emerald: #10b981; }
        input, textarea { outline: none; font-family: inherit; }
        button { font-family: inherit; cursor: pointer; border: none; }
        textarea { resize: vertical; }
        .slide-in { animation: slideIn 0.25s ease; }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .fade-in { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #10b981; border-radius: 4px; }
      `}</style>

      {/* ── SIDEBAR ── */}
      {sideOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-start" }}
          onClick={() => setSideOpen(false)}
        >
          <div
            style={{
              width: 260,
              height: "100%",
              background: dark ? "#1e293b" : "#fff",
              boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
              borderLeft: `1px solid ${border}`,
              display: "flex",
              flexDirection: "column",
              padding: "0",
              animation: "slideIn 0.25s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div style={{ background: emerald, padding: "28px 20px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>Aly Tech</div>
              <div style={{ fontSize: 18, color: "#fff", fontWeight: 800, marginTop: 2 }}>WhatsApp Helper</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>أداة الإرسال الذكي للواتساب</div>
            </div>
            {/* Nav Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
              {nav.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setPage(id); setSideOpen(false); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 20px",
                    background: page === id ? (dark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.08)") : "transparent",
                    color: page === id ? emerald : text,
                    fontWeight: page === id ? 700 : 400,
                    fontSize: 14,
                    borderRight: page === id ? `3px solid ${emerald}` : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>
            {/* Dark mode toggle */}
            <div style={{ padding: "16px 20px", borderTop: `1px solid ${border}` }}>
              <button
                onClick={toggleDark}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: surface2,
                  color: text,
                  fontSize: 13,
                  fontWeight: 600,
                  width: "100%",
                }}
              >
                {dark ? <Icons.Sun /> : <Icons.Moon />}
                {dark ? "الوضع النهاري" : "الوضع الليلي"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOPBAR ── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: surface,
        borderBottom: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
      }}>
        <button onClick={toggleDark} style={{ background: "none", color: textMuted, padding: 4 }}>
          {dark ? <Icons.Sun /> : <Icons.Moon />}
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: emerald }}>Aly Tech</div>
          <div style={{ fontSize: 10, color: textMuted, fontWeight: 500, lineHeight: 1 }}>WhatsApp Helper</div>
        </div>
        <button onClick={() => setSideOpen(true)} style={{ background: "none", color: text, padding: 4 }}>
          <Icons.Menu />
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ paddingBottom: 80 }}>
        {page === "home" && <HomePage {...{ dark, surface, surface2, text, textMuted, border, emerald, emeraldDark, contacts, lists, activeListId, setActiveListId, activeContacts, waVersion, setWaVersion, message, sending, progress, breakCountdown, startSending, stopSending }} />}
        {page === "lists" && <ListsPage {...{ dark, surface, surface2, text, textMuted, border, emerald, lists, contacts, activeListId, setActiveListId, saveList, deleteList, showToast }} />}
        {page === "device" && <DevicePage {...{ dark, surface, surface2, text, textMuted, border, emerald, contacts, lists, activeListId, saveContact, deleteContact, handleBulkImport, showToast }} />}
        {page === "customize" && <CustomizePage {...{ dark, surface, surface2, text, textMuted, border, emerald, message, setMessage, signature, setSignature, messageVersions, setMessageVersions, showToast }} />}
        {page === "settings" && <SettingsPage {...{ dark, surface, surface2, text, textMuted, border, emerald, settings, setSettings, showToast }} />}
        {page === "about" && <AboutPage {...{ dark, surface, surface2, text, textMuted, border, emerald }} />}
      </div>

      {/* ── INSTALL BANNER ── */}
      {installBanner && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 480,
          margin: "0 auto",
          background: dark ? "#1e293b" : "#fff",
          borderTop: `1px solid ${border}`,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          zIndex: 90,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: text }}>ثبّت التطبيق على شاشتك</div>
            <div style={{ fontSize: 11, color: textMuted }}>للوصول السريع بدون متصفح</div>
          </div>
          <button
            onClick={async () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === "accepted") setInstallBanner(false);
              }
            }}
            style={{
              background: emerald,
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icons.Download />
            تثبيت
          </button>
          <button onClick={() => setInstallBanner(false)} style={{ background: "none", color: textMuted }}>
            <Icons.X />
          </button>
        </div>
      )}

      {/* ── AD BANNER ── */}
      {!sending && (
        <div style={{
          position: "fixed",
          bottom: installBanner ? 64 : 0,
          left: 0,
          right: 0,
          maxWidth: 480,
          margin: "0 auto",
          background: dark ? "#0f172a" : "#f0fdf4",
          borderTop: `1px solid ${border}`,
          padding: "8px 16px",
          textAlign: "center",
          fontSize: 11,
          color: textMuted,
          zIndex: 85,
        }}>
          إعلان · مساحة إعلانية متاحة
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 70,
          left: "50%",
          transform: "translateX(-50%)",
          background: toast.type === "error" ? "#ef4444" : toast.type === "info" ? "#3b82f6" : emerald,
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          zIndex: 200,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.2s ease",
          whiteSpace: "nowrap",
          maxWidth: "90vw",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ dark, surface, surface2, text, textMuted, border, emerald, emeraldDark, contacts, lists, activeListId, setActiveListId, activeContacts, waVersion, setWaVersion, message, sending, progress, breakCountdown, startSending, stopSending }) {
  const pct = progress.total ? Math.round((progress.sent / progress.total) * 100) : 0;

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* List Selector */}
      <div style={{ background: surface, borderRadius: 20, padding: 16, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 12, color: textMuted, fontWeight: 600, marginBottom: 10 }}>القائمة النشطة</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveListId(l.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: activeListId === l.id ? emerald : surface2,
                color: activeListId === l.id ? "#fff" : text,
                border: `1px solid ${activeListId === l.id ? emerald : border}`,
                transition: "all 0.15s",
              }}
            >
              {l.name} ({l.contactIds?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* WA Version */}
      <div style={{ background: surface, borderRadius: 20, padding: 16, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 12, color: textMuted, fontWeight: 600, marginBottom: 10 }}>نسخة واتساب</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "basic", label: "واتساب أساسي" }, { id: "clone", label: "واتساب مستنسخ" }].map((v) => (
            <button
              key={v.id}
              onClick={() => setWaVersion(v.id)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 700,
                background: waVersion === v.id ? emerald : surface2,
                color: waVersion === v.id ? "#fff" : text,
                border: `1px solid ${waVersion === v.id ? emerald : border}`,
                transition: "all 0.15s",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Preview */}
      <div style={{ background: surface, borderRadius: 20, padding: 16, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 12, color: textMuted, fontWeight: 600, marginBottom: 8 }}>معاينة الرسالة</div>
        <div style={{
          background: surface2,
          borderRadius: 14,
          padding: "12px 14px",
          fontSize: 13,
          color: text,
          lineHeight: 1.7,
          direction: "rtl",
          minHeight: 60,
        }}>
          {message || <span style={{ color: textMuted }}>لم يتم كتابة رسالة بعد...</span>}
        </div>
      </div>

      {/* Progress */}
      {(sending || progress.sent > 0) && (
        <div style={{ background: surface, borderRadius: 20, padding: 20, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: text, textAlign: "center", marginBottom: 12 }}>تقدم الإرسال</div>
          {breakCountdown > 0 && (
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: textMuted }}>استراحة وقائية</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: emerald }}>{breakCountdown}s</div>
            </div>
          )}
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: emerald }}>{pct}%</div>
            {progress.current && <div style={{ fontSize: 12, color: textMuted }}>{progress.current}</div>}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: surface2, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: emerald, borderRadius: 999, transition: "width 0.4s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", fontSize: 13 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: emerald }}>{progress.sent}</div>
              <div style={{ color: textMuted, fontSize: 11 }}>تم الإرسال</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: text }}>{Math.max(0, progress.total - progress.sent)}</div>
              <div style={{ color: textMuted, fontSize: 11 }}>متبقي</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: text }}>{progress.total}</div>
              <div style={{ color: textMuted, fontSize: 11 }}>المجموع</div>
            </div>
          </div>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={sending ? stopSending : startSending}
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: 20,
          background: sending ? "#ef4444" : emerald,
          color: "#fff",
          fontSize: 16,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          transition: "all 0.2s",
          boxShadow: sending ? "0 4px 20px rgba(239,68,68,0.4)" : "0 4px 20px rgba(16,185,129,0.4)",
        }}
      >
        {sending ? (
          <><Icons.X /> إيقاف الإرسال</>
        ) : (
          <><Icons.Send /> إرسال إلى {activeContacts.length} جهة</>
        )}
      </button>

      {/* Auto Send */}
      <button
        onClick={startSending}
        disabled={sending}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 20,
          background: "#f97316",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: sending ? 0.5 : 1,
        }}
      >
        <Icons.Zap />
        تشغيل الإرسال التلقائي
      </button>
    </div>
  );
}

// ─── LISTS PAGE ───────────────────────────────────────────────────────────────
function ListsPage({ dark, surface, surface2, text, textMuted, border, emerald, lists, contacts, activeListId, setActiveListId, saveList, deleteList, showToast }) {
  const [newListName, setNewListName] = useState("");

  const handleCreate = async () => {
    if (!newListName.trim()) return;
    const list = { id: uid(), name: newListName.trim(), contactIds: [] };
    await saveList(list);
    setNewListName("");
    showToast("تم إنشاء القائمة");
  };

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: surface, borderRadius: 20, padding: 16, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 12 }}>إنشاء قائمة جديدة</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="اسم القائمة..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 14,
              border: `1px solid ${border}`,
              background: surface2,
              color: text,
              fontSize: 13,
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              background: emerald,
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <Icons.Plus />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lists.map((list) => {
          const count = list.contactIds?.length || 0;
          return (
            <div
              key={list.id}
              style={{
                background: surface,
                borderRadius: 18,
                padding: "14px 16px",
                border: `1px solid ${activeListId === list.id ? emerald : border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "border 0.15s",
              }}
            >
              <button
                onClick={() => setActiveListId(list.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: `2px solid ${activeListId === list.id ? emerald : border}`,
                  background: activeListId === list.id ? emerald : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {activeListId === list.id && <Icons.Check />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{list.name}</div>
                <div style={{ fontSize: 11, color: textMuted }}>{count} جهة اتصال</div>
              </div>
              {list.id !== "default" && (
                <button
                  onClick={() => deleteList(list.id)}
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "6px", borderRadius: 10 }}
                >
                  <Icons.Trash />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DEVICE PAGE ──────────────────────────────────────────────────────────────
function DevicePage({ dark, surface, surface2, text, textMuted, border, emerald, contacts, lists, activeListId, saveContact, deleteContact, handleBulkImport, showToast }) {
  const [tab, setTab] = useState("list"); // list | add | import
  const [editContact, setEditContact] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [importText, setImportText] = useState("");

  const activeList = lists.find((l) => l.id === activeListId);
  const listContacts = activeList
    ? contacts.filter((c) => activeList.contactIds.includes(c.id))
    : contacts;

  const handleSave = async () => {
    if (!form.phone.trim()) { showToast("أدخل رقم الهاتف", "error"); return; }
    const phone = sanitizePhone(form.phone);
    const contact = {
      id: editContact?.id || uid(),
      name: form.name.trim() || phone,
      phone,
      _edit: !!editContact,
    };
    await saveContact(contact);
    setForm({ name: "", phone: "" });
    setEditContact(null);
    setTab("list");
    showToast(editContact ? "تم التحديث" : "تم الإضافة");
  };

  const startEdit = (c) => {
    setEditContact(c);
    setForm({ name: c.name, phone: c.phone });
    setTab("add");
  };

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, background: surface2, borderRadius: 16, padding: 4 }}>
        {[{ id: "list", label: "القائمة" }, { id: "add", label: "إضافة" }, { id: "import", label: "استيراد" }].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id !== "add") { setEditContact(null); setForm({ name: "", phone: "" }); } }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              background: tab === t.id ? surface : "transparent",
              color: tab === t.id ? emerald : textMuted,
              transition: "all 0.15s",
              boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
            <div style={{ fontSize: 13, color: textMuted }}>{listContacts.length} جهة اتصال</div>
            <div style={{
              background: emerald,
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
            }}>
              {activeList?.name || "الكل"}
            </div>
          </div>
          {listContacts.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: textMuted, fontSize: 13 }}>
              لا توجد جهات اتصال في هذه القائمة
            </div>
          )}
          {listContacts.map((c) => (
            <div
              key={c.id}
              style={{
                background: surface,
                borderRadius: 18,
                padding: "12px 14px",
                border: `1px solid ${border}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${emerald}, #059669)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                flexShrink: 0,
              }}>
                {c.name?.[0]?.toUpperCase() || "؟"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: textMuted, direction: "ltr", textAlign: "right" }}>{c.phone}</div>
              </div>
              <button onClick={() => startEdit(c)} style={{ background: "rgba(16,185,129,0.1)", color: emerald, padding: "7px", borderRadius: 10 }}>
                <Icons.Edit />
              </button>
              <button onClick={() => deleteContact(c.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "7px", borderRadius: 10 }}>
                <Icons.Trash />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "add" && (
        <div style={{ background: surface, borderRadius: 20, padding: 20, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 16 }}>
            {editContact ? "تعديل جهة الاتصال" : "إضافة جهة اتصال"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: textMuted, fontWeight: 600, marginBottom: 6, display: "block" }}>الاسم</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="اسم العميل..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: surface,
                  color: text,
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: textMuted, fontWeight: 600, marginBottom: 6, display: "block" }}>رقم الهاتف</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="01xxxxxxxxx"
                type="tel"
                dir="ltr"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: surface,
                  color: text,
                  fontSize: 14,
                  textAlign: "right",
                }}
              />
            </div>
            <button
              onClick={handleSave}
              style={{
                background: emerald,
                color: "#fff",
                padding: "14px",
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              {editContact ? "حفظ التغييرات" : "إضافة الجهة"}
            </button>
          </div>
        </div>
      )}

      {tab === "import" && (
        <div style={{ background: surface, borderRadius: 20, padding: 20, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 8 }}>استيراد جماعي</div>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 14, lineHeight: 1.6 }}>
            أدخل كل جهة في سطر منفصل بالشكل:<br />
            <code style={{ background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: 6, color: emerald }}>01234567890, اسم العميل</code>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"01234567890, أحمد محمد\n01098765432, سارة علي\n..."}
            rows={8}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: `1px solid ${border}`,
              background: surface,
              color: text,
              fontSize: 13,
              marginBottom: 12,
              direction: "ltr",
            }}
          />
          <button
            onClick={async () => {
              await handleBulkImport(importText);
              setImportText("");
              setTab("list");
            }}
            style={{
              background: "#3b82f6",
              color: "#fff",
              padding: "13px",
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 700,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icons.Download />
            استيراد الجهات
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMIZE PAGE ───────────────────────────────────────────────────────────
function CustomizePage({ dark, surface, surface2, text, textMuted, border, emerald, message, setMessage, signature, setSignature, messageVersions, setMessageVersions, showToast }) {
  const saveMessage = async () => {
    await dbPut("settings", { key: "message", value: message });
    showToast("تم حفظ الرسالة");
  };
  const saveSignature = async () => {
    await dbPut("settings", { key: "signature", value: signature });
    showToast("تم حفظ التوقيع");
  };

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Main Message */}
      <div style={{ background: surface, borderRadius: 20, padding: 18, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 6 }}>الرسالة الرئيسية</div>
        <div style={{ fontSize: 11, color: textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          استخدم <code style={{ background: "rgba(16,185,129,0.1)", color: emerald, padding: "1px 6px", borderRadius: 6 }}>{"{اسم}"}</code> لاستبدال اسم العميل تلقائياً
          <br />استخدم <code style={{ background: "rgba(16,185,129,0.1)", color: emerald, padding: "1px 6px", borderRadius: 6 }}>[مرحباً|أهلاً|هلا]</code> للتبديل العشوائي
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${border}`,
            background: surface,
            color: text,
            fontSize: 13,
            marginBottom: 10,
            lineHeight: 1.7,
          }}
        />
        <button
          onClick={saveMessage}
          style={{
            background: emerald,
            color: "#fff",
            padding: "11px 20px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 700,
            float: "left",
          }}
        >
          حفظ الرسالة
        </button>
        <div style={{ clear: "both" }} />
      </div>

      {/* Message Versions */}
      <div style={{ background: surface, borderRadius: 20, padding: 18, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 6 }}>نسخ بديلة للرسالة</div>
        <div style={{ fontSize: 11, color: textMuted, marginBottom: 14 }}>
          سيتم الاختيار عشوائياً بين النسخ الأصلية والبديلة لتجنب الحظر
        </div>
        {messageVersions.map((v, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, marginBottom: 4 }}>النسخة {i + 1}</div>
            <textarea
              value={v}
              onChange={(e) => {
                const newV = [...messageVersions];
                newV[i] = e.target.value;
                setMessageVersions(newV);
              }}
              rows={3}
              placeholder="اترك فارغاً لتجاهل هذه النسخة..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: surface,
                color: text,
                fontSize: 12,
              }}
            />
          </div>
        ))}
      </div>

      {/* Signature */}
      <div style={{ background: surface, borderRadius: 20, padding: 18, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 12 }}>التوقيع</div>
        <input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="مثال: فريق خدمة العملاء"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${border}`,
            background: surface,
            color: text,
            fontSize: 13,
            marginBottom: 10,
          }}
        />
        <button
          onClick={saveSignature}
          style={{
            background: emerald,
            color: "#fff",
            padding: "11px 20px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 700,
            float: "left",
          }}
        >
          حفظ التوقيع
        </button>
        <div style={{ clear: "both" }} />
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ dark, surface, surface2, text, textMuted, border, emerald, settings, setSettings, showToast }) {
  const save = async () => {
    await dbPut("settings", { key: "settings", value: settings });
    showToast("تم حفظ الإعدادات");
  };

  const Row = ({ label, desc, field, min, max, step = 1, unit }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{label}</div>
          {desc && <div style={{ fontSize: 11, color: textMuted }}>{desc}</div>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: emerald }}>
          {settings[field]}{unit}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={settings[field]}
        onChange={(e) => setSettings((p) => ({ ...p, [field]: Number(e.target.value) }))}
        style={{ width: "100%", accentColor: emerald }}
      />
    </div>
  );

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: surface, borderRadius: 20, padding: 20, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 20 }}>إعدادات الإرسال الآمن</div>
        <Row label="الحد الأدنى للتأخير" desc="ثواني بين كل رسالة" field="minDelay" min={1} max={10} unit="ث" />
        <Row label="الحد الأقصى للتأخير" field="maxDelay" min={2} max={30} unit="ث" />
        <Row label="استراحة كل" desc="رسائل" field="breakEvery" min={5} max={50} unit=" رسالة" />
        <Row label="مدة الاستراحة" field="breakDuration" min={10} max={120} unit="ث" />
        <button
          onClick={save}
          style={{
            width: "100%",
            background: emerald,
            color: "#fff",
            padding: "14px",
            borderRadius: 16,
            fontSize: 14,
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          حفظ الإعدادات
        </button>
      </div>

      <div style={{ background: surface, borderRadius: 20, padding: 20, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 12 }}>نصائح مكافحة الحظر</div>
        {[
          "اضبط التأخير بين 2-4 ثواني",
          "خذ استراحة كل 20 رسالة لمدة 30 ثانية",
          "استخدم نسخ بديلة للرسائل",
          "استخدم Spintax للتنويع التلقائي",
          "لا ترسل لأكثر من 200 رقم يومياً",
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "rgba(16,185,129,0.15)",
              color: emerald,
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>{tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage({ dark, surface, surface2, text, textMuted, border, emerald }) {
  const sections = [
    {
      title: "WhatsApp Helper",
      items: [
        { label: "الإصدار", value: "1.0.0" },
        { label: "آخر تحديث", value: "2024" },
        { label: "المطور", value: "Aly Tech" },
      ],
    },
  ];

  const features = [
    "إدارة الجهات: إضافة، تعديل، حذف، تنظيم في قوائم",
    "إرسال ذكي تسلسلي مع تتبع التقدم",
    "تخصيص الرسائل مع Spintax ونسخ بديلة",
    "أمان كامل: جميع البيانات مخزنة محلياً على جهازك فقط",
    "واجهة عربية خصيصاً للمستخدم العربي",
    "وضع ليلي ونهاري أنيق",
  ];

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Logo */}
      <div style={{
        background: `linear-gradient(135deg, ${emerald}, #059669)`,
        borderRadius: 24,
        padding: "28px 20px",
        textAlign: "center",
        color: "#fff",
      }}>
        <div style={{ fontSize: 14, opacity: 0.85, fontWeight: 500 }}>Aly Tech</div>
        <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>WhatsApp Helper</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>أداة الإرسال الذكي للواتساب</div>
      </div>

      {/* App Info */}
      <div style={{ background: surface, borderRadius: 20, padding: 18, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: text, marginBottom: 12 }}>المالك والمطور</div>
        {[
          { label: "الاسم", value: "محمد علي رضوان" },
          { label: "الهاتف", value: "01227220268" },
          { label: "البريد", value: "mohammedaly502@yahoo.com" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${border}` }}>
            <div style={{ fontSize: 12, color: textMuted }}>{item.label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: text, direction: "ltr" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Privacy */}
      <div style={{ background: surface, borderRadius: 20, padding: 18, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: text, marginBottom: 12 }}>سياسة الخصوصية</div>
        {[
          { title: "التخزين المحلي", desc: "جميع بياناتك مخزنة على جهازك فقط" },
          { title: "أمان المعلومات", desc: "لا يتطلب التطبيق صلاحيات خاصة أو إنترنت للعمل" },
          { title: "تحكم كامل", desc: "يمكنك حذف أو تعديل بياناتك في أي وقت" },
        ].map((item) => (
          <div key={item.title} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: emerald, marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{item.title}</div>
              <div style={{ fontSize: 11, color: textMuted }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ background: surface, borderRadius: 20, padding: 18, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: text, marginBottom: 12 }}>المميزات الرئيسية</div>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ color: emerald, flexShrink: 0, marginTop: 2 }}><Icons.Check /></div>
            <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>{f}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

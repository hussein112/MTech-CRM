"use client";

export default function Navbar({ darkMode, toggleTheme }: { darkMode: boolean, toggleTheme: () => void }) {
    return (
        <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            padding: "20px 50px",
            borderBottom: "1px solid var(--pp-border)",
            marginLeft: "var(--pp-w)",
            transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "var(--pp-text)", fontFamily: "'Mulish', sans-serif", letterSpacing: -0.5 }}>
                Hello, <span className="text-[#4f46e5]">Partner</span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <button className="pp-theme-btn" onClick={toggleTheme} title="Toggle theme">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        {darkMode ? "light_mode" : "dark_mode"}
                    </span>
                </button>
                <div className="pp-user-chip">
                    <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: 13, fontWeight: 700 }}>
                        PU
                    </div>
                    <span style={{ color: "var(--pp-text)" }}>Partner User</span>
                </div>
            </div>
        </div>
    );
}
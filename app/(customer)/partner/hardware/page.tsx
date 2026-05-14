import "../../../styles/dashboard.css"

export default function Page() {
    return (
        <div className="dash-layout">
            <div className="dash-header">
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Hardware Catalog</h1>
                    <p style={{ fontSize: 13, color: "var(--text3)", margin: "4px 0 0", fontWeight: 500 }}>
                        Browse our full range of terminals, handhelds, and point-of-sale hardware.
                    </p>
                </div>
            </div>

            <div className="dash-card-v2" style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", borderStyle: "dashed", marginTop: 24 }}>
                <div style={{ textAlign: "center", color: "var(--text3)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>inventory_2</span>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>Catalog Content Coming Soon</p>
                </div>
            </div>
        </div>
    )
}
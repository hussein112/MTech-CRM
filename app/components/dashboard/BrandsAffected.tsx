"use client"

export interface Brand {
  id:          string
  name:        string
  initials:    string
  avatarColor: string
  count:       number
  countColor:  string
}

interface Props {
  brands: Brand[]
}

export function BrandsAffected({ brands }: Props) {
  if (brands.length === 0) {
    return (
      <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
        <div className="dv2-title" style={{ marginBottom: 14 }}>Brands Affected</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.6, minHeight: 200 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--text3)", marginBottom: 16 }}>info</span>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text2)" }}>No Brand Data</div>
          <div style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", marginTop: 6 }}>
            No tickets assigned to specific brands.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
      <div className="dv2-title" style={{ marginBottom: 14 }}>Brands Affected</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {brands.map((brand, i) => (
          <div key={brand.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", animation: "fadeIn 0.3s ease both", animationDelay: `${i * 55}ms` }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: brand.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {brand.initials}
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              {brand.name}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: brand.countColor, minWidth: 16, textAlign: "right" }}>
              {brand.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

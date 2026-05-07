"use client"

interface StatusItem {
  label: string
  count: number
  color: string
}

interface Props {
  merchantActive:   number
  merchantResolved: number
  agentActive:      number
  agentResolved:    number
  merchantStatuses: StatusItem[]
  agentStatuses:    StatusItem[]
}

export function OnboardingPipeline({
  merchantActive,
  merchantResolved,
  agentActive,
  agentResolved,
  merchantStatuses,
  agentStatuses,
}: Props) {
  const statBox = (value: number, label: string, accent?: boolean) => (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: accent ? "var(--accent)" : "var(--text)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, fontWeight: 600 }}>{label}</div>
    </div>
  )

  return (
    <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
      <div className="dv2-title" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "#10b981", fontSize: 18 }}>rocket_launch</span>
          </div>
          <span>Onboarding Pipeline</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {statBox(merchantActive,   "Merchant Active")}
        {statBox(merchantResolved, "Merchant Resolved", true)}
        {statBox(agentActive,      "Agent Active")}
        {statBox(agentResolved,    "Agent Resolved", true)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>
            Merchant Status
          </div>
          {merchantStatuses.length === 0
            ? <div style={{ fontSize: 12, color: "var(--text3)" }}>No active</div>
            : merchantStatuses.map(s => (
                <div key={s.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{s.count}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "100%", background: s.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))
          }
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>
            Agent Status
          </div>
          {agentStatuses.length === 0
            ? <div style={{ fontSize: 12, color: "var(--text3)" }}>No active</div>
            : agentStatuses.map(s => (
                <div key={s.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{s.count}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "100%", background: s.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}

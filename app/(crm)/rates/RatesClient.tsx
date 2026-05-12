"use client"

import { useState, useMemo } from "react"

// ── Helpers ────────────────────────────────────────────────────────────────

function dollar(n: number) {
  return (n < 0 ? "-$" : "$") + Math.abs(n).toFixed(2)
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RcCard({ icon, title, children, style }: {
  icon: string; title: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div className="rc-card" style={style}>
      <div className="rc-card-title">
        <span className="material-symbols-outlined">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

function RcField({ label, labelRight, children }: {
  label: string; labelRight?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rc-field">
      <label className="rc-label">
        {label}
        {labelRight !== undefined && <span className="rc-label-value">{labelRight}</span>}
      </label>
      {children}
    </div>
  )
}

function RcRow({ children }: { children: React.ReactNode }) {
  return <div className="rc-row">{children}</div>
}

function NumInput({ value, onChange, min, max, step, sm }: {
  value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; sm?: boolean
}) {
  return (
    <input
      type="number"
      className={`rc-input${sm ? " rc-input-sm" : ""}`}
      value={value}
      min={min} max={max} step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
    />
  )
}

function SliderField({ label, labelRight, min, max, step, value, onChange, pill }: {
  label: string; labelRight: string; min: number; max: number; step: number
  value: number; onChange: (v: number) => void; pill: string
}) {
  return (
    <RcField label={label} labelRight={labelRight}>
      <div className="rc-slider-wrap">
        <input
          type="range" className="rc-slider"
          min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        <span className="rc-slider-val">{pill}</span>
      </div>
    </RcField>
  )
}

function RcStat({ label, value, sub, variant }: {
  label: string; value: string; sub?: string
  variant?: "positive" | "negative" | "accent"
}) {
  return (
    <div className={`rc-stat${variant ? ` ${variant}` : ""}`}>
      <div className="rc-stat-label">{label}</div>
      <div className="rc-stat-value">{value}</div>
      {sub && <div className="rc-stat-sub">{sub}</div>}
    </div>
  )
}

function BreakdownRow({ label, value, bold, green, red }: {
  label: string; value: string; bold?: boolean; green?: boolean; red?: boolean
}) {
  return (
    <div
      className="rc-breakdown-row"
      style={bold ? { borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 6, fontWeight: 800 } : undefined}
    >
      <span className="rc-breakdown-row-label" style={bold ? { fontWeight: 800 } : undefined}>{label}</span>
      <span className="rc-breakdown-row-val" style={{ color: green ? "#10b981" : red ? "#ef4444" : undefined, fontSize: bold ? 14 : undefined }}>
        {value}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function RatesClient() {
  // Merchant info
  const [dba,       setDba]       = useState("")
  const [mid,       setMid]       = useState("")
  const [processor, setProcessor] = useState("")
  const [mcc,       setMcc]       = useState("")

  // Volume stats
  const [volume,      setVolume]      = useState(50000)
  const [txns,        setTxns]        = useState(500)
  const [currentRate, setCurrentRate] = useState(3.25)

  // Proposed offer
  const [markup,      setMarkup]      = useState(0.50)
  const [perItem,     setPerItem]     = useState(0.10)
  const [monthlyFee,  setMonthlyFee]  = useState(15)
  const [interchange, setInterchange] = useState(1.85)

  // Cost basis
  const [scheduleA,   setScheduleA]   = useState("Fiserv")
  const [buyRate,     setBuyRate]     = useState(0.05)
  const [buyPerItem,  setBuyPerItem]  = useState(0.02)
  const [platformFee, setPlatformFee] = useState(7)
  const [pciCost,     setPciCost]     = useState(4)

  // Agent split
  const [split, setSplit] = useState(50)

  // ── All derived values ────────────────────────────────────────────────────

  const c = useMemo(() => {
    const avgTicket = txns > 0 ? volume / txns : 0

    // Revenue
    const revMarkup  = volume * (markup / 100)
    const revPerItem = txns * perItem
    const revMonthly = monthlyFee
    const totalRev   = revMarkup + revPerItem + revMonthly

    // Cost
    const costBuyRate = volume * (buyRate / 100)
    const costPerItem = txns * buyPerItem
    const totalCost   = costBuyRate + costPerItem + platformFee + pciCost

    // Profit
    const monthlyProfit = totalRev - totalCost
    const annualProfit  = monthlyProfit * 12
    const ltv3yr        = monthlyProfit * 36
    const netSpread     = volume > 0 ? (monthlyProfit / volume) * 10000 : 0

    // Proposed effective rate
    const proposedRate = volume > 0
      ? ((volume * ((interchange + markup) / 100)) + (txns * perItem) + monthlyFee) / volume * 100
      : 0

    // Merchant savings vs current cost
    const merchantSavings = volume * (currentRate / 100) - volume * (proposedRate / 100)

    // Agent split
    const agentPayout  = monthlyProfit * (split / 100)
    const mtechRevenue = monthlyProfit - agentPayout

    // Deal rating
    const beatsRate = proposedRate < currentRate
    let rating: "green" | "yellow" | "red"
    let ratingIcon, ratingText, ratingSub: string

    if (volume < 10000 || monthlyProfit < 50 || netSpread < 15) {
      rating = "red"; ratingIcon = "dangerous"; ratingText = "Decline — Poor Economics"
      ratingSub = volume < 10000 ? "Volume too low (< $10k/mo)"
        : monthlyProfit < 50 ? "Monthly profit below $50"
        : "Net spread too thin (< 15 bps)"
    } else if (!beatsRate || monthlyProfit < 100 || netSpread < 25) {
      rating = "yellow"; ratingIcon = "warning"; ratingText = "Caution — Review Pricing"
      ratingSub = !beatsRate ? "Proposal does not beat the merchant's current rate"
        : monthlyProfit < 100 ? "Monthly profit below $100"
        : "Net spread below 25 bps"
    } else if (monthlyProfit >= 250) {
      rating = "green"; ratingIcon = "verified"; ratingText = "Strong Deal"
      ratingSub = "Good profitability and competitive pricing"
    } else {
      rating = "green"; ratingIcon = "check_circle"; ratingText = "Acceptable Deal"
      ratingSub = "Profitable and competitive — room for improvement"
    }

    return {
      avgTicket, revMarkup, revPerItem, revMonthly, totalRev,
      costBuyRate, costPerItem, totalCost,
      monthlyProfit, annualProfit, ltv3yr, netSpread, proposedRate,
      merchantSavings, agentPayout, mtechRevenue,
      beatsRate, rating, ratingIcon, ratingText, ratingSub,
    }
  }, [volume, txns, currentRate, markup, perItem, monthlyFee, interchange, buyRate, buyPerItem, platformFee, pciCost, split])

  const savingsColor = c.merchantSavings > 0 ? "#10b981" : c.merchantSavings < 0 ? "#ef4444" : "var(--text3)"
  const savingsText  = c.merchantSavings > 0
    ? `Merchant saves $${c.merchantSavings.toFixed(2)}/mo with Mtech`
    : c.merchantSavings < 0
    ? `Merchant pays $${Math.abs(c.merchantSavings).toFixed(2)}/mo more with this proposal`
    : "Same cost as current processor"

  const TIERS = [{ label: "Tier 1 (50%)", val: 50 }, { label: "Tier 2 (60%)", val: 60 }, { label: "Tier 3 (70%)", val: 70 }]

  return (
    <div style={{ padding: 24, fontFamily: "'Mulish', sans-serif" }}>

      {/* ── Banner: Pending Testing ── */}
      <div style={{ padding: "14px 20px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#f59e0b", flexShrink: 0 }}>science</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Pending Internal Testing</div>
          <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500 }}>This calculator is pending internal review. Results are for estimation purposes only and may not reflect final pricing.</div>
        </div>
      </div>

      {/* ── Banner: AI Statement Analysis ── */}
      <div style={{ padding: "14px 20px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--accent-crm)", flexShrink: 0 }}>auto_awesome</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>AI Statement Analysis — Coming Soon</div>
          <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500 }}>LLM integration is being developed to automatically analyze merchant processing statements, extract rates, fees, and volume data, and auto-populate this calculator for instant deal comparison.</div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="rc-hero" style={{ marginBottom: 22 }}>
        <div className="rc-hero-title">
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--accent-crm)" }}>calculate</span>
          Rate Calculator
        </div>
        <div className="rc-hero-sub">Analyze merchant processing volume and calculate optimal rates. Adjust proposed pricing, compare to current costs, and see your real profit math — all in real time.</div>
      </div>

      {/* ── Row 1: Merchant Info + Volume Stats ── */}
      <div className="rc-grid">
        <RcCard icon="storefront" title="Merchant Info">
          <RcField label="DBA Name">
            <input className="rc-input" value={dba} onChange={e => setDba(e.target.value)} placeholder="e.g. Joe's Coffee Shop" />
          </RcField>
          <RcRow>
            <RcField label="MID">
              <input className="rc-input" value={mid} onChange={e => setMid(e.target.value)} placeholder="e.g. 1234567890" />
            </RcField>
            <RcField label="Processor">
              <input className="rc-input" value={processor} onChange={e => setProcessor(e.target.value)} placeholder="e.g. Fiserv" />
            </RcField>
          </RcRow>
          <RcField label="MCC Code">
            <input className="rc-input rc-input-sm" value={mcc} onChange={e => setMcc(e.target.value)} placeholder="e.g. 5812" />
          </RcField>
        </RcCard>

        <RcCard icon="bar_chart" title="Volume Stats">
          <RcRow>
            <RcField label="Monthly Volume ($)">
              <NumInput value={volume} onChange={setVolume} min={0} step={1000} />
            </RcField>
            <RcField label="Transaction Count">
              <NumInput value={txns} onChange={setTxns} min={0} step={10} />
            </RcField>
          </RcRow>
          <RcField label="Average Ticket" labelRight={`$${c.avgTicket.toFixed(2)}`}>
            <div style={{ padding: "10px 14px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "var(--text3)" }}>
              ${c.avgTicket.toFixed(2)}
            </div>
          </RcField>
          <RcField label="Current Effective Rate (%)">
            <NumInput value={currentRate} onChange={setCurrentRate} min={0} max={10} step={0.01} sm />
          </RcField>
        </RcCard>
      </div>

      {/* ── Row 2: Proposed Offer + Cost Basis ── */}
      <div className="rc-grid">
        <RcCard icon="tune" title="Proposed Mtech Offer">
          <SliderField
            label="Markup over Interchange (%)" labelRight={`${markup.toFixed(2)}%`}
            min={0.15} max={1.50} step={0.01} value={markup}
            onChange={setMarkup} pill={`${markup.toFixed(2)}%`}
          />
          <SliderField
            label="Per-Transaction Fee ($)" labelRight={`$${perItem.toFixed(2)}`}
            min={0.05} max={0.25} step={0.01} value={perItem}
            onChange={setPerItem} pill={`$${perItem.toFixed(2)}`}
          />
          <RcRow>
            <RcField label="Monthly Fee ($)">
              <NumInput value={monthlyFee} onChange={setMonthlyFee} min={0} step={1} sm />
            </RcField>
            <RcField label="Avg Interchange (%)">
              <NumInput value={interchange} onChange={setInterchange} min={0} max={5} step={0.01} sm />
            </RcField>
          </RcRow>
        </RcCard>

        <RcCard icon="payments" title="Mtech Cost Basis">
          <RcField label="Schedule A">
            <select className="rc-input" value={scheduleA} onChange={e => setScheduleA(e.target.value)}>
              <option value="TSYS">TSYS</option>
              <option value="Fiserv">Fiserv</option>
              <option value="Elavon">Elavon</option>
            </select>
          </RcField>
          <RcRow>
            <RcField label="Buy Rate Markup (%)">
              <NumInput value={buyRate} onChange={setBuyRate} min={0} max={1} step={0.01} sm />
            </RcField>
            <RcField label="Buy Rate Per Item ($)">
              <NumInput value={buyPerItem} onChange={setBuyPerItem} min={0} max={0.50} step={0.01} sm />
            </RcField>
          </RcRow>
          <RcRow>
            <RcField label="Platform Fee / MID ($)">
              <NumInput value={platformFee} onChange={setPlatformFee} min={0} step={1} sm />
            </RcField>
            <RcField label="PCI Cost ($)">
              <NumInput value={pciCost} onChange={setPciCost} min={0} step={1} sm />
            </RcField>
          </RcRow>
          <div style={{ marginTop: 16, padding: 14, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>Total Monthly Cost</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>${c.totalCost.toFixed(2)}</div>
          </div>
        </RcCard>
      </div>

      {/* ── Deal Rating ── */}
      <div className={`rc-rating ${c.rating}`}>
        <span className="material-symbols-outlined rc-rating-icon">{c.ratingIcon}</span>
        <div>
          <div className="rc-rating-text">{c.ratingText}</div>
          <div className="rc-rating-sub">{c.ratingSub}</div>
        </div>
      </div>

      {/* ── Deal Economics ── */}
      <RcCard icon="analytics" title="Deal Economics">
        <div className="rc-econ-grid">
          <RcStat label="Monthly Profit"    value={dollar(c.monthlyProfit)}           variant={c.monthlyProfit >= 0 ? "positive" : "negative"} />
          <RcStat label="Annual Profit"     value={dollar(c.annualProfit)}            variant="accent" />
          <RcStat label="3-Year LTV"        value={dollar(c.ltv3yr)}                 />
          <RcStat label="Net Spread"        value={`${c.netSpread.toFixed(1)} bps`}  />
          <RcStat label="Proposed Eff. Rate" value={`${c.proposedRate.toFixed(2)}%`} />
          <RcStat label="Merchant Savings"  value={dollar(c.merchantSavings)}        sub="/month" />
        </div>

        {/* Rate comparison */}
        <div className="rc-compare">
          <div className="rc-compare-item">
            <div className="rc-compare-label">Current Rate</div>
            <div className="rc-compare-val" style={{ color: "#ef4444" }}>{currentRate.toFixed(2)}%</div>
          </div>
          <div className="rc-compare-arrow">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>
          <div className="rc-compare-item">
            <div className="rc-compare-label">Proposed Rate</div>
            <div className="rc-compare-val" style={{ color: c.beatsRate ? "#10b981" : "#ef4444" }}>{c.proposedRate.toFixed(2)}%</div>
          </div>
        </div>
        <div className="rc-savings" style={{ color: savingsColor }}>{savingsText}</div>

        {/* Revenue vs Cost breakdown */}
        <div className="rc-breakdown">
          <div className="rc-breakdown-col">
            <div className="rc-breakdown-title revenue">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_up</span>
              Revenue
            </div>
            <BreakdownRow label="Markup Revenue"   value={`$${c.revMarkup.toFixed(2)}`}  />
            <BreakdownRow label="Per-Item Revenue"  value={`$${c.revPerItem.toFixed(2)}`} />
            <BreakdownRow label="Monthly Fee"       value={`$${c.revMonthly.toFixed(2)}`} />
            <BreakdownRow label="Total Revenue" value={`$${c.totalRev.toFixed(2)}`} bold green />
          </div>
          <div className="rc-breakdown-col">
            <div className="rc-breakdown-title cost">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_down</span>
              Cost
            </div>
            <BreakdownRow label="Buy Rate Cost"  value={`$${c.costBuyRate.toFixed(2)}`} />
            <BreakdownRow label="Per-Item Cost"  value={`$${c.costPerItem.toFixed(2)}`} />
            <BreakdownRow label="Platform Fee"   value={`$${platformFee.toFixed(2)}`}   />
            <BreakdownRow label="PCI Cost"       value={`$${pciCost.toFixed(2)}`}       />
            <BreakdownRow label="Total Cost" value={`$${c.totalCost.toFixed(2)}`} bold red />
          </div>
        </div>
      </RcCard>

      {/* ── Agent Split Calculator ── */}
      <RcCard icon="groups" title="Agent Split Calculator" style={{ marginBottom: 0 }}>
        <SliderField
          label="Agent Split (%)" labelRight={`${split}%`}
          min={0} max={80} step={1} value={split}
          onChange={setSplit} pill={`${split}%`}
        />
        <div className="rc-tiers">
          {TIERS.map(t => (
            <button
              key={t.val}
              className={`rc-tier-btn${split === t.val ? " active" : ""}`}
              onClick={() => setSplit(t.val)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="rc-split-grid">
          <div className="rc-split-box agent">
            <div className="rc-split-label">Agent Payout</div>
            <div className="rc-split-value">{dollar(c.agentPayout)}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{dollar(c.agentPayout * 12)}/yr</div>
          </div>
          <div className="rc-split-box mtech">
            <div className="rc-split-label">Mtech Revenue</div>
            <div className="rc-split-value">{dollar(c.mtechRevenue)}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{dollar(c.mtechRevenue * 12)}/yr</div>
          </div>
        </div>
      </RcCard>

    </div>
  )
}

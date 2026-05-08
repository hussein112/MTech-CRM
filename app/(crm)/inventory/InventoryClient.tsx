"use client"

import { useState, useMemo, useRef } from "react"

// ─── Types ────────────────────────────────────────────
export type ProductStatus   = "Active" | "Draft" | "Archived"
export type ProductCategory = "Terminals" | "POS Systems" | "ATM" | "Printer" | "Accessories" | "Paper & Ribbons" | "Other"
export type UnitStatus      = "Available" | "Deployed" | "Reserved" | "Defective"

export interface DeviceUnit {
  id: string
  serial: string
  status: UnitStatus
  notes: string
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  cost: number
  price: number
  stock: number
  units: DeviceUnit[]
}

export interface Product {
  id: string
  name: string
  sku: string
  brand: string
  category: ProductCategory
  status: ProductStatus
  description: string
  tags: string[]
  image?: string
  variants: ProductVariant[]
}

// ─── Constants ────────────────────────────────────────
const CATEGORIES: ProductCategory[] = [
  "Terminals", "POS Systems", "ATM", "Printer", "Accessories", "Paper & Ribbons", "Other",
]
const STATUSES: ProductStatus[]    = ["Active", "Draft", "Archived"]
const UNIT_STATUSES: UnitStatus[]  = ["Available", "Deployed", "Reserved", "Defective"]
const DEFAULT_BRANDS = ["Clover", "Dejavoo", "Dexa", "Ingenico", "PAX", "Verifone", "Square", "SwipeSimple", "Epson", "Star", "Apple", "Other"]
const INV_COLS = "72px minmax(0,1fr) 130px 140px 100px 90px 40px"

// ─── Helpers ──────────────────────────────────────────
function productStatusStyle(s: ProductStatus) {
  if (s === "Active")   return { background: "rgba(16,185,129,.12)",  color: "#10b981" }
  if (s === "Draft")    return { background: "rgba(245,158,11,.12)",  color: "#f59e0b" }
  return { background: "rgba(107,114,128,.12)", color: "#6b7280" }
}

function unitStatusStyle(s: UnitStatus) {
  if (s === "Available") return { background: "rgba(16,185,129,.12)",  color: "#10b981" }
  if (s === "Deployed")  return { background: "rgba(99,102,241,.12)",  color: "#6366f1" }
  if (s === "Reserved")  return { background: "rgba(245,158,11,.12)",  color: "#f59e0b" }
  return { background: "rgba(239,68,68,.12)", color: "#ef4444" }
}

function totalStock(p: Product): number {
  return p.variants.reduce((sum, v) => {
    if (v.units.length > 0) return sum + v.units.filter(u => u.status === "Available").length
    return sum + v.stock
  }, 0)
}

function priceRange(p: Product): string {
  const prices = p.variants.map(v => v.price).filter(x => x > 0)
  if (prices.length === 0) return "—"
  const min = Math.min(...prices), max = Math.max(...prices)
  return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} – $${max.toFixed(2)}`
}

// ─── Form types ───────────────────────────────────────
interface UnitDraft { id: string; serial: string; status: UnitStatus; notes: string }

interface VariantDraft {
  id: string
  name: string; sku: string; cost: string; price: string; stock: string
  units: UnitDraft[]
  newSerial: string; newStatus: UnitStatus; newNotes: string
}

interface ProductDraft {
  name: string; sku: string; brand: string
  category: ProductCategory; status: ProductStatus
  description: string; tags: string; image: string
  variants: VariantDraft[]
}

function freshVariant(baseSku = ""): VariantDraft {
  return {
    id: `vd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "Default", sku: baseSku, cost: "", price: "", stock: "0",
    units: [], newSerial: "", newStatus: "Available", newNotes: "",
  }
}

const EMPTY_DRAFT: ProductDraft = {
  name: "", sku: "", brand: "", category: "Terminals", status: "Active",
  description: "", tags: "", image: "",
  variants: [],
}

// ─── VariantCard sub-component ────────────────────────
function VariantCard({ v, idx, baseSku, onChange, onRemove }: {
  v: VariantDraft
  idx: number
  baseSku: string
  onChange: (id: string, patch: Partial<VariantDraft>) => void
  onRemove: (id: string) => void
}) {
  function set<K extends keyof VariantDraft>(k: K, val: VariantDraft[K]) {
    onChange(v.id, { [k]: val } as Partial<VariantDraft>)
  }

  function addUnit() {
    if (!v.newSerial.trim()) return
    const u: UnitDraft = {
      id: `u-${Date.now()}`,
      serial: v.newSerial.trim().toUpperCase(),
      status: v.newStatus,
      notes: v.newNotes.trim(),
    }
    onChange(v.id, { units: [...v.units, u], newSerial: "", newNotes: "" })
  }

  function removeUnit(uid: string) {
    onChange(v.id, { units: v.units.filter(u => u.id !== uid) })
  }

  return (
    <div className="inv-variant-card">
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-crm)" }}>{idx + 1}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: ".6px" }}>Variant {idx + 1}</span>
        </div>
        <button onClick={() => onRemove(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, borderRadius: 6, display: "flex", alignItems: "center", transition: "color .15s" }}
          onMouseOver={e => (e.currentTarget.style.color = "var(--red)")}
          onMouseOut={e => (e.currentTarget.style.color = "var(--text3)")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
        </button>
      </div>

      {/* Fields grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10 }}>
        <div className="crm-field" style={{ marginBottom: 0 }}>
          <label>Variant Name</label>
          <input value={v.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Black, 256GB" autoComplete="off" />
        </div>
        <div className="crm-field" style={{ marginBottom: 0 }}>
          <label>SKU</label>
          <input value={v.sku} onChange={e => set("sku", e.target.value.toUpperCase())} placeholder={baseSku || "SKU"} autoComplete="off" style={{ textTransform: "uppercase" as const }} />
        </div>
        <div className="crm-field" style={{ marginBottom: 0 }}>
          <label>Cost ($)</label>
          <input type="number" step="0.01" value={v.cost} onChange={e => set("cost", e.target.value)} placeholder="0.00" />
        </div>
        <div className="crm-field" style={{ marginBottom: 0 }}>
          <label>Price ($)</label>
          <input type="number" step="0.01" value={v.price} onChange={e => set("price", e.target.value)} placeholder="0.00" />
        </div>
      </div>

      {/* Device units */}
      <div className="dev-section">
        <div className="dev-header">
          <div className="dev-header-title">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>devices</span>
            Individual Units
            {v.units.length > 0 && <span className="dev-count">{v.units.length}</span>}
          </div>
        </div>

        {v.units.length > 0 && (
          <div className="dev-list">
            {v.units.map(u => {
              const us = unitStatusStyle(u.status)
              return (
                <div key={u.id} className="dev-row">
                  <span className="dev-serial">{u.serial}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, textTransform: "uppercase" as const, letterSpacing: ".3px", whiteSpace: "nowrap" as const, flexShrink: 0, ...us }}>{u.status}</span>
                  {u.notes && <span className="dev-notes">{u.notes}</span>}
                  <div className="dev-actions">
                    <button onClick={() => removeUnit(u.id)} title="Remove unit">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="dev-add-row">
          <input value={v.newSerial} onChange={e => set("newSerial", e.target.value)} placeholder="Serial number…" onKeyDown={e => e.key === "Enter" && addUnit()} />
          <select value={v.newStatus} onChange={e => set("newStatus", e.target.value as UnitStatus)}>
            {UNIT_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <input value={v.newNotes} onChange={e => set("newNotes", e.target.value)} placeholder="Notes (optional)" onKeyDown={e => e.key === "Enter" && addUnit()} />
          <button className="dev-add-btn" onClick={addUnit}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────
interface Props {
  initialProducts: Product[]
  initialBrands?: string[]
}

export function InventoryClient({ initialProducts, initialBrands = DEFAULT_BRANDS }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [query,    setQuery]    = useState("")
  const [catFilt,  setCatFilt]  = useState("")
  const [statFilt, setStatFilt] = useState("")

  const [brands,      setBrands]      = useState(initialBrands)
  const [showBrandMgr,setShowBrandMgr]= useState(false)
  const [newBrand,    setNewBrand]    = useState("")

  const [showSlider, setShowSlider] = useState(false)
  const [isEdit,     setIsEdit]     = useState(false)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [draft,      setDraftRaw]   = useState<ProductDraft>(EMPTY_DRAFT)
  const [formError,  setFormError]  = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  // Filtered list
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return products.filter(p => {
      if (q && ![p.name, p.sku, p.brand, ...p.tags].some(s => s.toLowerCase().includes(q))) return false
      if (catFilt  && p.category !== catFilt)  return false
      if (statFilt && p.status   !== statFilt) return false
      return true
    })
  }, [products, query, catFilt, statFilt])

  // Draft helpers
  function setField<K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) {
    setDraftRaw(f => ({ ...f, [k]: v }))
  }

  function updateVariant(id: string, patch: Partial<VariantDraft>) {
    setDraftRaw(f => ({ ...f, variants: f.variants.map(v => v.id === id ? { ...v, ...patch } : v) }))
  }

  function removeVariant(id: string) {
    setDraftRaw(f => ({ ...f, variants: f.variants.filter(v => v.id !== id) }))
  }

  function addVariant() {
    setDraftRaw(f => ({ ...f, variants: [...f.variants, freshVariant(f.sku)] }))
  }

  // Slider
  function openCreate() {
    setDraftRaw({ ...EMPTY_DRAFT, variants: [freshVariant()] })
    setIsEdit(false); setEditId(null); setFormError("")
    setShowSlider(true)
  }

  function openEdit(p: Product) {
    setDraftRaw({
      name: p.name, sku: p.sku, brand: p.brand,
      category: p.category, status: p.status,
      description: p.description, tags: p.tags.join(", "),
      image: p.image ?? "",
      variants: p.variants.map(v => ({
        id: v.id, name: v.name, sku: v.sku,
        cost: v.cost > 0 ? String(v.cost) : "",
        price: v.price > 0 ? String(v.price) : "",
        stock: String(v.stock),
        units: v.units.map(u => ({ ...u })),
        newSerial: "", newStatus: "Available" as UnitStatus, newNotes: "",
      })),
    })
    setIsEdit(true); setEditId(p.id); setFormError("")
    setShowSlider(true)
  }

  function closeSlider() { setShowSlider(false); setFormError("") }

  function saveProduct() {
    if (!draft.name.trim()) { setFormError("Product name is required."); return }
    if (!draft.sku.trim())  { setFormError("Base SKU is required."); return }
    if (draft.variants.length === 0) { setFormError("At least one variant is required."); return }

    const variants: ProductVariant[] = draft.variants.map(v => ({
      id: v.id, name: v.name || "Default",
      sku: v.sku || draft.sku,
      cost: parseFloat(v.cost) || 0,
      price: parseFloat(v.price) || 0,
      stock: parseInt(v.stock) || 0,
      units: v.units.map(u => ({ id: u.id, serial: u.serial, status: u.status, notes: u.notes })),
    }))

    const tags = draft.tags.split(",").map(t => t.trim()).filter(Boolean)

    if (isEdit && editId) {
      setProducts(prev => prev.map(p => p.id !== editId ? p : {
        ...p, name: draft.name, sku: draft.sku, brand: draft.brand,
        category: draft.category, status: draft.status,
        description: draft.description, tags,
        image: draft.image || undefined, variants,
      }))
    } else {
      const newP: Product = {
        id: `P-${Date.now()}`,
        name: draft.name, sku: draft.sku, brand: draft.brand,
        category: draft.category, status: draft.status,
        description: draft.description, tags,
        image: draft.image || undefined, variants,
      }
      setProducts(prev => [newP, ...prev])
    }
    closeSlider()
  }

  function deleteProduct() {
    if (editId) setProducts(prev => prev.filter(p => p.id !== editId))
    closeSlider()
  }

  // Image
  function handleImageFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => setField("image", e.target?.result as string ?? "")
    reader.readAsDataURL(file)
  }

  // Brands
  function addBrand() {
    const b = newBrand.trim()
    if (!b || brands.includes(b)) return
    setBrands(prev => [...prev, b].sort())
    setNewBrand("")
  }

  // CSV export
  function exportCSV() {
    const rows = [
      ["ID", "Name", "SKU", "Brand", "Category", "Status", "Total Stock", "Price Range"],
      ...products.map(p => [p.id, p.name, p.sku, p.brand, p.category, p.status, String(totalStock(p)), priceRange(p)]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "inventory.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="dash-layout">

      {/* Page header */}
      <div className="inv-page-header py-5">
        <div className="py-1">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: "0 0 4px", letterSpacing: -0.5 }}>Inventory Management</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: 0, fontWeight: 500 }}>Manage products, variants, stock locations, and suppliers.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="crm-btn crm-btn-ghost" onClick={() => setShowBrandMgr(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>label</span>
            Manage Brands
          </button>
          <button className="crm-btn crm-btn-ghost" onClick={exportCSV}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>download</span>
            Export
          </button>
          <button className="inv-btn-primary" onClick={openCreate}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New Product
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tkt-filter-bar">
        <div className="tkt-search">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search by product name, SKU, or brand…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="tkt-filters">
          <select className="tkt-filter-sel" value={catFilt} onChange={e => setCatFilt(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="tkt-filter-sel" value={statFilt} onChange={e => setStatFilt(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {(query || catFilt || statFilt) && (
            <button className="tkt-reset-btn" onClick={() => { setQuery(""); setCatFilt(""); setStatFilt("") }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>filter_alt_off</span>
              Reset
            </button>
          )}
        </div>
        <div className="tkt-filter-divider" />
        <span className="tkt-result-count">{filtered.length} {filtered.length === 1 ? "product" : "products"}</span>
      </div>

      {/* Product list */}
      <div className="tkt-scroll-view tkt-table-wrap">
        <div style={{ minWidth: 700 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: INV_COLS, gap: 12, padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "1px solid var(--border)", background: "var(--bg3)" }}>
            <div>Media</div><div>Product Info</div><div>Category</div>
            <div>Pricing Range</div><div>Total Stock</div><div>Status</div><div />
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "56px 0", color: "var(--text3)", fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 38, display: "block", marginBottom: 10, opacity: 0.35 }}>inventory_2</span>
              No products match your filters.
            </div>
          )}

          {filtered.map((p, i) => {
            const ps    = productStatusStyle(p.status)
            const stock = totalStock(p)
            return (
              <div
                key={p.id}
                className="ticket-row"
                role="button" tabIndex={0}
                onClick={() => openEdit(p)}
                onKeyDown={e => e.key === "Enter" && openEdit(p)}
                style={{ display: "grid", gridTemplateColumns: INV_COLS, gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)", alignItems: "center", cursor: "pointer", animation: "fadeIn 0.3s ease both", animationDelay: `${i * 30}ms` }}
              >
                {/* Thumbnail */}
                <div>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", display: "block" }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 8, background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--text3)" }}>image</span>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace", marginTop: 2 }}>{p.sku}{p.brand ? ` · ${p.brand}` : ""}</div>
                  {p.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                      {p.tags.slice(0, 3).map(t => (
                        <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 10, background: "var(--accent-crm-light)", color: "var(--accent-crm)" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "var(--text2)" }}>{p.category}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{priceRange(p)}</div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: stock > 0 ? "var(--text)" : "var(--red)" }}>{stock}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 4 }}>units</span>
                </div>
                <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, ...ps }}>{p.status}</span></div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--text3)" }}>chevron_right</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="tkt-cards-view">
        {filtered.map((p, i) => {
          const ps = productStatusStyle(p.status)
          return (
            <div key={p.id} className="tkt-card" role="button" tabIndex={0} onClick={() => openEdit(p)} onKeyDown={e => e.key === "Enter" && openEdit(p)} style={{ animation: "fadeIn 0.3s ease both", animationDelay: `${i * 40}ms`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{p.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, ...ps, flexShrink: 0, marginLeft: 8 }}>{p.status}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace", marginBottom: 4 }}>{p.sku}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
                <span>{p.category}</span>
                <span>{priceRange(p)} · {totalStock(p)} units</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Slide-out drawer ──────────────────────────────── */}
      {showSlider && (
        <>
          <div className="inv-slider-overlay" onClick={closeSlider} />
          <div className="inv-slider">

            {/* Header */}
            <div className="inv-slider-header">
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                  {isEdit ? (draft.name || "Edit Product") : "Add New Product"}
                </h2>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                  {isEdit ? "Update product details and manage variants" : "Create a base product and manage variants"}
                </div>
              </div>
              <button onClick={closeSlider} style={{ background: "var(--bg3)", border: "none", width: 36, height: 36, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="inv-slider-body">

              {/* ── Media & Tags ── */}
              <div className="inv-section">
                <h3 className="inv-section-title">
                  <span className="material-symbols-outlined" style={{ color: "#f59e0b" }}>photo_library</span>
                  Media &amp; Tags
                </h3>

                <div className="crm-field">
                  <label>Product Image</label>
                  {draft.image ? (
                    <div style={{ position: "relative", width: "fit-content", marginTop: 4 }}>
                      <img src={draft.image} alt="Preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, border: "1px solid var(--border)", display: "block" }} />
                      <button onClick={() => setField("image", "")} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`inv-dropzone${isDragging ? " dragover" : ""}`}
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={e => { e.preventDefault(); setIsDragging(false); const f2 = e.dataTransfer.files[0]; if (f2?.type.startsWith("image/")) handleImageFile(f2) }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 30, color: "var(--text3)", display: "block", marginBottom: 8 }}>cloud_upload</span>
                      <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        Drag &amp; Drop or <span style={{ color: "var(--accent-crm)", textDecoration: "underline" }}>Browse</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>Supports JPG, PNG, GIF</div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.gif" style={{ display: "none" }} onChange={e => { const f2 = e.target.files?.[0]; if (f2) handleImageFile(f2) }} />
                </div>

                <div className="crm-field" style={{ marginBottom: 0 }}>
                  <label>Tags (comma separated)</label>
                  <input value={draft.tags} onChange={e => setField("tags", e.target.value)} placeholder="e.g. Wireless, Bluetooth" autoComplete="off" />
                </div>
              </div>

              {/* ── Core Information ── */}
              <div className="inv-section">
                <h3 className="inv-section-title">
                  <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)" }}>category</span>
                  Core Information
                </h3>

                <div className="crm-field">
                  <label>Product Name *</label>
                  <input value={draft.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. Clover Station Duo" autoComplete="off" autoFocus />
                </div>

                <div className="crm-field-row">
                  <div className="crm-field" style={{ marginBottom: 0 }}>
                    <label>Base SKU *</label>
                    <input value={draft.sku} onChange={e => setField("sku", e.target.value.toUpperCase())} placeholder="e.g. CLV-ST-DUO" autoComplete="off" style={{ textTransform: "uppercase" as const }} />
                  </div>
                  <div className="crm-field" style={{ marginBottom: 0 }}>
                    <label>Brand / Supplier</label>
                    <select value={draft.brand} onChange={e => setField("brand", e.target.value)}>
                      <option value="">— Select Brand —</option>
                      {brands.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="crm-field-row" style={{ marginTop: 14 }}>
                  <div className="crm-field" style={{ marginBottom: 0 }}>
                    <label>Category</label>
                    <select value={draft.category} onChange={e => setField("category", e.target.value as ProductCategory)}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="crm-field" style={{ marginBottom: 0 }}>
                    <label>Status</label>
                    <select value={draft.status} onChange={e => setField("status", e.target.value as ProductStatus)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="crm-field" style={{ marginTop: 14, marginBottom: 0 }}>
                  <label>Description</label>
                  <textarea value={draft.description} onChange={e => setField("description", e.target.value)} rows={3} placeholder="Describe the product…" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", fontSize: 13, background: "var(--bg)", color: "var(--text)", outline: "none", fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const, transition: "border-color .15s" }} onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
                </div>
              </div>

              {/* ── Variants & Pricing ── */}
              <div className="inv-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 className="inv-section-title" style={{ margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ color: "#10b981" }}>view_list</span>
                    Variants &amp; Pricing
                  </h3>
                  <button onClick={addVariant} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", background: "var(--accent-crm-light)", border: "1px solid var(--accent-crm)", borderRadius: 8, color: "var(--accent-crm)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                    Add Variant
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "var(--text3)", margin: "0 0 16px", lineHeight: 1.5 }}>
                  Configure distinct versions of this product (e.g. Color, Storage). If no variations exist, use a single Default variant.
                </p>

                {draft.variants.length === 0 && (
                  <div style={{ textAlign: "center", padding: "28px 0", border: "2px dashed var(--border)", borderRadius: 12, color: "var(--text3)", fontSize: 13 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.4 }}>view_list</span>
                    No variants yet. Click "Add Variant" to start.
                  </div>
                )}

                {draft.variants.map((v, idx) => (
                  <VariantCard key={v.id} v={v} idx={idx} baseSku={draft.sku} onChange={updateVariant} onRemove={removeVariant} />
                ))}
              </div>

              {formError && (
                <div style={{ padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
                  {formError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="inv-slider-footer">
              {isEdit && (
                <button className="crm-btn crm-btn-ghost" onClick={deleteProduct} style={{ color: "#ef4444" }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,.4)")}
                  onMouseOut={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                  Delete Product
                </button>
              )}
              <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                <button className="crm-btn crm-btn-ghost" onClick={closeSlider}>Cancel</button>
                <button className="inv-btn-primary" onClick={saveProduct}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>save</span>
                  Save Product
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Brand Manager ─────────────────────────────────── */}
      {showBrandMgr && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box", animation: "fadeIn 0.18s ease" }}>
          <div style={{ background: "var(--bg2)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.25)", maxWidth: 420, width: "100%", overflow: "hidden", animation: "fadeUp 0.25s ease" }}>
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 20 }}>label</span>
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0 }}>Manage Brands</h2>
                <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>Add or remove product brands</p>
              </div>
              <button onClick={() => setShowBrandMgr(false)} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--text3)" }}>close</span>
              </button>
            </div>

            <div style={{ maxHeight: "45vh", overflowY: "auto", padding: "8px 24px" }}>
              {brands.map(b => (
                <div key={b} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{b}</span>
                  <button onClick={() => setBrands(prev => prev.filter(x => x !== b))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <input value={newBrand} onChange={e => setNewBrand(e.target.value)} onKeyDown={e => e.key === "Enter" && addBrand()} placeholder="Add new brand…" style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, outline: "none", fontFamily: "inherit" }} autoComplete="off" />
              <button className="crm-btn crm-btn-primary" onClick={addBrand} style={{ padding: "9px 16px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

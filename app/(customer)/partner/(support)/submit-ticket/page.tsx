"use client";

import "../../../../styles/dashboard.css";
import "./submit-ticket.css";
import { useState } from "react";

export default function SubmitTicket() {
    const [hasTwoProducts, setHasTwoProducts] = useState<boolean>(false);
    return (
        <div className="dash-layout">
            <div style={{ margin: "0 auto" }}>
                <div className="dash-header" style={{ marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Submit Support Ticket</h1>
                        <p style={{ fontSize: 13, color: "var(--text3)", margin: "4px 0 0", fontWeight: 500 }}>
                            Need help? Send us a ticket and our team will get back to you shortly.
                        </p>
                    </div>
                </div>

                <div className="dash-card-v2" style={{ padding: 0, overflow: "hidden" }}>
                    {/* Header accent */}
                    <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--border)", background: "var(--bg3)" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 20 }}>confirmation_number</span>
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0 }}>Ticket Details</h2>
                            <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>Tell us more about the issue you're facing</p>
                        </div>
                    </div>

                    <form className="p-6 flex flex-col gap-5">
                        <div className="tkt-modal-field">
                            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, display: "block" }}>
                                Subject *
                            </label>
                            <input
                                type="text"
                                id="subject"
                                className="tkt-modal-input"
                                placeholder="e.g., Terminal not connecting"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {hasTwoProducts && <div className="tkt-modal-field">
                                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, display: "block" }}>
                                    Brand / Product
                                </label>
                                <select className="tkt-filter-sel w-full" style={{ height: 40, width: "100%" }}>
                                    <option value="">— Select brand —</option>
                                    <option>Clover</option>
                                    <option>Dejavoo</option>
                                    <option>Pax</option>
                                    <option>Supersonic</option>
                                    <option>Other</option>
                                </select>
                            </div>}
                        </div>

                        <div className="tkt-modal-field">
                            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, display: "block" }}>
                                Description *
                            </label>
                            <textarea
                                id="description"
                                className="tkt-modal-input"
                                style={{ minHeight: 120, resize: "vertical" }}
                                placeholder="Please describe the problem in detail so we can help you faster..."
                                required
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                            <button type="submit" className="tkt-btn-new" style={{ padding: "12px 32px" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                                Submit Ticket
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

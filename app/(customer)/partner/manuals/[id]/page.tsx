"use client";

import { useParams } from "next/navigation";

export default function HardwareManualPage() {
    const { id } = useParams();
    return (
        <main style={{ marginLeft: "var(--pp-w)", width: "calc(100% - var(--pp-w))", minHeight: "100vh", padding: "40px 56px", boxSizing: "border-box" }}>
            <div style={{ maxWidth: 1400, width: "100%", margin: "0 auto" }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--pp-text)", fontFamily: "'Mulish', sans-serif" }}>Hardware Manual {id}</h1>
            </div>
        </main>
    )
}
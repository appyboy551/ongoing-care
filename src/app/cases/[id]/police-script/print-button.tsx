"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: "8px 14px",
        background: "#a82e7e",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <span aria-hidden="true">📄 </span>
      Print or save as PDF
    </button>
  );
}

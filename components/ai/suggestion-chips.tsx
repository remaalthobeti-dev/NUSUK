"use client";

const SUGGESTIONS = [
  { icon: "📋", label: "كم عدد المهام؟" },
  { icon: "📌", label: "ما هي مهامي؟" },
  { icon: "👥", label: "من يعمل الآن؟" },
  { icon: "🏭", label: "ضغط المصنع" },
  { icon: "🚗", label: "إحصائيات التوزيع" },
  { icon: "📅", label: "الاجتماعات القادمة" },
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div
      style={{
        display:    "flex",
        flexWrap:   "wrap",
        gap:        6,
        padding:    "2px 0 4px",
        justifyContent: "flex-start",
      }}
    >
      {SUGGESTIONS.map(({ icon, label }) => (
        <button
          key={label}
          onClick={() => onSelect(label)}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          5,
            fontSize:     12,
            padding:      "5px 11px",
            borderRadius: 20,
            border:       "1px solid var(--nk-chip-border, rgba(201,150,62,.35))",
            background:   "var(--nk-chip-bg, rgba(201,150,62,.07))",
            color:        "var(--nk-chip-text, #58584F)",
            cursor:       "pointer",
            fontFamily:   "inherit",
            fontWeight:   500,
            transition:   "border-color .15s, background .15s",
            whiteSpace:   "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#C9963E";
            (e.currentTarget as HTMLElement).style.background = "rgba(201,150,62,.14)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--nk-chip-border, rgba(201,150,62,.35))";
            (e.currentTarget as HTMLElement).style.background = "var(--nk-chip-bg, rgba(201,150,62,.07))";
          }}
        >
          <span style={{ fontSize: 13 }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

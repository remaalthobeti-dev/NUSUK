"use client";

const SUGGESTIONS = [
  { emoji: "📋", label: "كم عدد المهام؟" },
  { emoji: "👥", label: "من يعمل الآن؟" },
  { emoji: "📌", label: "ما هي مهامي؟" },
  { emoji: "🏭", label: "ضغط المصنع" },
  { emoji: "🚗", label: "إحصائيات التوزيع" },
  { emoji: "📅", label: "الاجتماعات القادمة" },
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center px-2">
      {SUGGESTIONS.map(({ emoji, label }) => (
        <button
          key={label}
          onClick={() => onSelect(label)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hover:opacity-80 active:scale-95"
          style={{
            borderColor: "var(--n-gold, #C9963E)",
            color: "var(--foreground)",
            background: "var(--muted, #f4f4f0)",
          }}
        >
          <span>{emoji}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

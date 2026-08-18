"use client";

export type AppSection = "explore" | "saved" | "trip" | "account";

export default function AppNav({
  active,
  onChange
}: {
  active: AppSection;
  onChange: (section: AppSection) => void;
}) {
  const items: { key: AppSection; icon: string; label: string }[] = [
    { key: "explore", icon: "⌖", label: "Explore" },
    { key: "saved", icon: "★", label: "Saved" },
    { key: "trip", icon: "↗", label: "Trips" },
    { key: "account", icon: "●", label: "Account" }
  ];

  return (
    <nav className="appNav">
      {items.map(item => (
        <button
          key={item.key}
          className={active === item.key ? "active" : ""}
          onClick={() => onChange(item.key)}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

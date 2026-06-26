import { FaCheckCircle } from "react-icons/fa";
import type { PasswordCheck } from "@/lib/validation";

type Variant = "default" | "register";

export function PasswordChecksList({
  checks,
  variant = "default",
}: {
  checks: PasswordCheck[];
  variant?: Variant;
}) {
  if (checks.length === 0) return null;

  if (variant === "register") {
    return (
      <ul className="space-y-2 border-t border-brand-forest/10 dark:border-brand-cream/10 pt-3">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2 text-[12px]">
            <FaCheckCircle className={`w-3.5 h-3.5 shrink-0 ${check.valid ? "text-brand-accent" : "text-brand-sage/35 dark:text-brand-tan/35"}`}/>
            <span
              className={
                check.valid
                  ? "text-brand-forest dark:text-brand-cream font-medium"
                  : "text-brand-sage dark:text-brand-tan"
              }
            >
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-1.5 text-xs">
      {checks.map((check) => (
        <li
          key={check.label}
          className={
            check.valid
              ? "text-[#54cd19] dark:text-[#889063]"
              : "text-brand-sage dark:text-brand-tan"
          }
        >
          {check.valid ? "✓" : "○"} {check.label}
        </li>
      ))}
    </ul>
  );
}

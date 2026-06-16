import { FaExclamationTriangle } from "react-icons/fa";

export function AuthErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-red-200/80 bg-red-50/80 dark:bg-red-950/35 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 text-sm backdrop-blur-sm">
      <FaExclamationTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

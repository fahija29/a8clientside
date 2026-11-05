// Shared loading UI — a slow-spinning emerald ring with an accessible label.
export function Spinner({ size = "h-8 w-8" }: { size?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block ${size} animate-spin rounded-full border-[3px] border-emerald-600 dark:border-emerald-400 border-t-transparent`}
    />
  );
}

// Full-height centered loading state used by pages while data resolves.
export default function LoadingSection() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Spinner />
    </div>
  );
}

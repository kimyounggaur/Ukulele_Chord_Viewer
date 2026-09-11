interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "결과가 없습니다",
  description = "다른 검색어나 코드 종류를 시도해 보세요.",
}: EmptyStateProps) {
  return (
    <div role="status" className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-pink-200 bg-white/70 p-6 text-center font-display text-lg font-semibold text-zinc-500">
      <span><strong>{title}</strong><br />{description}</span>
    </div>
  );
}

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaUpdateBanner() {
  const [updateFailed, setUpdateFailed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  const handleRefresh = () => {
    setIsUpdating(true);
    setUpdateFailed(false);
    void updateServiceWorker(true).catch(() => {
      setIsUpdating(false);
      setUpdateFailed(true);
    });
  };

  return (
    <aside
      className="pwa-update-banner"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span>{updateFailed ? "업데이트를 적용하지 못했습니다. 다시 시도해 주세요." : "새 버전이 있습니다"}</span>
      <button type="button" onClick={handleRefresh} disabled={isUpdating}>
        <RefreshCw size={16} aria-hidden="true" />
        {isUpdating ? "새로고침 중…" : "새로고침"}
      </button>
    </aside>
  );
}

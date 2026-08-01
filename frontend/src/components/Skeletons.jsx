import { useEffect, useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Reads the live --panel2 / --border CSS variables so skeletons match
// whichever theme (light/dark) is currently active, instead of being
// hardcoded to one palette.
function useSkeletonColors() {
  const [colors, setColors] = useState({ base: "#15213a", highlight: "#1c2a48" });

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const base = styles.getPropertyValue("--panel2").trim() || colors.base;
    const highlight = styles.getPropertyValue("--border").trim() || colors.highlight;
    setColors({ base, highlight });
  }, [document.documentElement.className]);

  return colors;
}

// Wraps children with Commently's current theme colors for consistent skeleton styling
export function SkeletonProvider({ children }) {
  const { base, highlight } = useSkeletonColors();
  return (
    <SkeletonTheme baseColor={base} highlightColor={highlight}>
      {children}
    </SkeletonTheme>
  );
}

export function AutomationCardSkeleton() {
  return (
    <SkeletonProvider>
      <div className="card">
        <Skeleton height={20} width="40%" />
        <div className="mt-3">
          <Skeleton height={14} width="70%" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton height={32} width={80} borderRadius={8} />
          <Skeleton height={32} width={80} borderRadius={8} />
        </div>
      </div>
    </SkeletonProvider>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <SkeletonProvider>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <Skeleton height={14} width="60%" />
            <div className="mt-2">
              <Skeleton height={32} width="40%" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonProvider>
  );
}

export function ListRowSkeleton({ rows = 3 }) {
  return (
    <SkeletonProvider>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={60} borderRadius={10} />
        ))}
      </div>
    </SkeletonProvider>
  );
}

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// New design is dark-only (matches surface-container-high / outline-variant)
export function SkeletonProvider({ children }) {
  return (
    <SkeletonTheme baseColor="#161718" highlightColor="#23252A">
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

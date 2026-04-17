'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/lib/analytics';

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    pageview(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsRouteTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}

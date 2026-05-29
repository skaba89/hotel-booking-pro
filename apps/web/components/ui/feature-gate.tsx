'use client';

import { useTheme } from '@/lib/theme-provider';

export function FeatureGate({
  feature,
  children,
}: {
  feature: string;
  children: React.ReactNode;
}) {
  const { isFeatureEnabled, loaded } = useTheme();

  // Don't block rendering before settings load — show by default
  if (!loaded) return <>{children}</>;

  if (!isFeatureEnabled(feature)) return null;

  return <>{children}</>;
}

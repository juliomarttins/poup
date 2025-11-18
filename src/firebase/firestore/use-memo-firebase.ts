
'use client';

import React, { useMemo } from 'react';
import { isEqual } from 'lodash-es';

// Custom hook to deeply compare dependencies for React.useMemo
function useDeepCompareMemoize(value: any) {
  const ref = React.useRef<any>();

  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

export function useMemoFirebase<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, useDeepCompareMemoize(deps));
}

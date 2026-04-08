/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchPinCounts } from './api';
import { COMMENTS_CHANGED_EVENT } from './events';

type PinCounts = Record<string, number>;

type CommentsPinCountContextValue = {
  getPinCount: (sliceId?: number) => number;
  refresh: () => void;
};

const CommentsPinCountContext = createContext<CommentsPinCountContextValue>({
  getPinCount: () => 0,
  refresh: () => {},
});

type ProviderProps = {
  dashboardId: number;
  enabled: boolean;
  children: React.ReactNode;
};

const CommentsPinCountProvider: FC<ProviderProps> = ({
  dashboardId,
  enabled,
  children,
}) => {
  const [counts, setCounts] = useState<PinCounts>({});
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || dashboardId <= 0) {
      setCounts({});
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await fetchPinCounts(dashboardId);
      if (!controller.signal.aborted) {
        setCounts(result);
      }
    } catch {
      // silently ignore
    }
  }, [dashboardId, enabled]);

  useEffect(() => {
    refresh();
    return () => {
      abortRef.current?.abort();
    };
  }, [refresh]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return () => {};
    }

    const onCommentsChanged = () => {
      refresh();
    };

    window.addEventListener(COMMENTS_CHANGED_EVENT, onCommentsChanged);
    return () =>
      window.removeEventListener(COMMENTS_CHANGED_EVENT, onCommentsChanged);
  }, [enabled, refresh]);

  const getPinCount = useCallback(
    (sliceId?: number) => {
      const key = sliceId != null ? String(sliceId) : 'null';
      return counts[key] || 0;
    },
    [counts],
  );

  const contextValue = useMemo(
    () => ({ getPinCount, refresh }),
    [getPinCount, refresh],
  );

  return (
    <CommentsPinCountContext.Provider value={contextValue}>
      {children}
    </CommentsPinCountContext.Provider>
  );
};

function usePinCount(sliceId?: number): number {
  const { getPinCount } = useContext(CommentsPinCountContext);
  return getPinCount(sliceId);
}

function usePinCountRefresh(): () => void {
  const { refresh } = useContext(CommentsPinCountContext);
  return refresh;
}

export { CommentsPinCountProvider, usePinCount, usePinCountRefresh };

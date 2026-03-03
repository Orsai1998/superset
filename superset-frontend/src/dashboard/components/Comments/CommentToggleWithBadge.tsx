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

import { useCallback, useEffect, useRef, useState } from 'react';
import { css, styled, t } from '@superset-ui/core';
import { MessageCircle } from 'lucide-react';
import { Tooltip } from 'src/components/Tooltip';
import { listComments } from './api';
import {
  COMMENTS_CHANGED_EVENT,
  OpenCommentsEventDetail,
  dispatchOpenComments,
} from './events';
import { filterDashboardPinsForChart } from './pinScope';

const ButtonWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const IconButton = styled.button`
  ${({ theme }) => css`
    background: transparent;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    color: ${theme.colors.grayscale.dark1};
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: ${theme.colors.primary.base};
    }
  `}
`;

const Badge = styled.span<{ visible: boolean }>`
  position: absolute;
  top: -4px;
  right: -4px;
  background: ${({ theme }) => theme.colors.error.base};
  color: ${({ theme }) => theme.colors.grayscale.light5};
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  pointer-events: none;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
  transform: ${({ visible }) => (visible ? 'scale(1)' : 'scale(0)')};
  opacity: ${({ visible }) => (visible ? 1 : 0)};
`;

type Props = {
  sliceId: number;
  dashboardId: number;
};

const CommentToggleWithBadge = ({ sliceId, dashboardId }: Props) => {
  const [pinCount, setPinCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchCount = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await listComments({
        scopeType: 'chart',
        sliceId,
        dashboardId,
        page: 0,
        pageSize: 200,
      });
      if (!controller.signal.aborted) {
        const chartPins = (resp.result || []).filter(
          comment =>
            comment.parent_id === null &&
            comment.x_pct !== null &&
            comment.y_pct !== null &&
            !comment.deleted_on,
        );
        let nextCount = chartPins.length;

        if (nextCount === 0) {
          const dashboardResp = await listComments({
            scopeType: 'dashboard',
            dashboardId,
            page: 0,
            pageSize: 200,
          });
          const dashboardPins = (dashboardResp.result || []).filter(
            comment =>
              comment.parent_id === null &&
              comment.x_pct !== null &&
              comment.y_pct !== null &&
              !comment.deleted_on,
          );
          nextCount = filterDashboardPinsForChart(
            dashboardPins,
            sliceId,
          ).length;
        }

        setPinCount(nextCount);
      }
    } catch {
      // silently ignore — badge simply won't show
    }
  }, [sliceId, dashboardId]);

  useEffect(() => {
    fetchCount();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchCount]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const onCommentsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<OpenCommentsEventDetail>;
      const { detail } = customEvent;
      if (!detail) {
        return;
      }
      const isSameDashboard = detail.dashboardId === dashboardId;
      const isSameChart =
        detail.scopeType === 'chart' && detail.sliceId === sliceId;
      const isDashboardPinsChanged = detail.scopeType === 'dashboard';
      if (isSameDashboard && (isSameChart || isDashboardPinsChanged)) {
        fetchCount();
      }
    };

    window.addEventListener(COMMENTS_CHANGED_EVENT, onCommentsChanged);
    return () =>
      window.removeEventListener(COMMENTS_CHANGED_EVENT, onCommentsChanged);
  }, [dashboardId, fetchCount, sliceId]);

  const handleClick = () => {
    dispatchOpenComments({ scopeType: 'chart', dashboardId, sliceId });
  };

  return (
    <Tooltip title={t('Comments')}>
      <ButtonWrap>
        <IconButton
          type="button"
          data-test="open-chart-comments"
          aria-label={t('Open chart comments')}
          onClick={handleClick}
        >
          <MessageCircle size={16} />
        </IconButton>
        <Badge visible={pinCount > 0} aria-hidden="true">
          {pinCount > 99 ? '99+' : pinCount}
        </Badge>
      </ButtonWrap>
    </Tooltip>
  );
};

export { CommentToggleWithBadge };

/**
 * Increment or decrement the badge count in response to local state changes.
 * Called from CommentsDrawer after resolve/reopen/create without a full refetch.
 */
export type BadgeCountUpdater = (delta: number) => void;

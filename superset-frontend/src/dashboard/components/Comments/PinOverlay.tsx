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
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mentions } from 'antd';
import {
  css,
  DataMask,
  DataMaskStateWithId,
  getClientErrorObject,
  styled,
  t,
} from '@superset-ui/core';
import { rgba } from 'emotion-rgba';
import { Space } from 'src/components';
import Button from 'src/components/Button';
import { useToasts } from 'src/components/MessageToasts/withToasts';
import { updateDataMask } from 'src/dataMask/actions';
import {
  Comment,
  CommentUser,
  createComment,
  listComments,
  searchMentionUsers,
} from './api';
import {
  CommentScopeType,
  COMMENTS_CHANGED_EVENT,
  OpenCommentsEventDetail,
  dispatchCommentsChanged,
  dispatchOpenComments,
} from './events';
import { Pin } from './Pin';
import { useCommentMode } from './CommentModeContext';
import { usePinCount } from './CommentsPinCountContext';

const { Option: MentionOption } = Mentions;

const Overlay = styled.div<{ active: boolean }>`
  ${({ active }) => css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: ${active ? 'all' : 'none'};
    cursor: ${active ? 'crosshair' : 'default'};
    z-index: 10;
  `}
`;

const HintBar = styled.div`
  ${({ theme }) => css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: ${theme.gridUnit}px ${theme.gridUnit * 2}px;
    background: ${theme.colors.primary.base};
    color: ${theme.colors.grayscale.light5};
    font-size: ${theme.typography.sizes.xs}px;
    text-align: center;
    pointer-events: none;
    z-index: 12;
  `}
`;

const DraftCard = styled.div`
  ${({ theme }) => css`
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: ${theme.gridUnit * 2}px;
    padding: ${theme.gridUnit * 2}px;
    background: ${theme.colors.grayscale.light5};
    border-radius: ${theme.borderRadius}px;
    box-shadow: 0 4px 16px ${rgba(theme.colors.grayscale.dark2, 0.2)};
  `}
`;

const MentionInput = styled(Mentions)`
  width: 100%;
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
`;

type DraftPin = {
  xPct: number;
  yPct: number;
};

type PinOverlayProps = {
  scopeType: CommentScopeType;
  dashboardId: number;
  sliceId?: number;
};

const PinOverlay: FC<PinOverlayProps> = ({
  scopeType,
  dashboardId,
  sliceId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const dataMask = useSelector<
    { dataMask: DataMaskStateWithId },
    DataMaskStateWithId
  >(state => state.dataMask);
  const { addDangerToast } = useToasts();
  const [pins, setPins] = useState<Comment[]>([]);
  const [draftPin, setDraftPin] = useState<DraftPin | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<CommentUser[]>([]);
  const { activeScope, exitCommentMode } = useCommentMode();
  const contextPinCount = usePinCount(sliceId);

  const isCommentModeActive = Boolean(
    activeScope &&
      activeScope.dashboardId === dashboardId &&
      ((activeScope.scopeType === scopeType &&
        (scopeType === 'dashboard' || activeScope.sliceId === sliceId)) ||
        (activeScope.scopeType === 'dashboard' && scopeType === 'chart')),
  );

  const handleApiError = useCallback(
    async (err: Response | string) => {
      const clientErr = await getClientErrorObject(err);
      addDangerToast(
        clientErr.message || clientErr.error || t('Unexpected error'),
      );
    },
    [addDangerToast],
  );

  const fetchPins = useCallback(async () => {
    try {
      const resp = await listComments({
        scopeType,
        dashboardId,
        sliceId,
        pageSize: 200,
      });
      const all = resp.result;
      setPins(
        all
          .filter(
            c =>
              c.parent_id === null &&
              c.x_pct !== null &&
              c.y_pct !== null &&
              !c.deleted_on,
          )
          .sort(
            (a, b) =>
              new Date(a.created_on || 0).getTime() -
              new Date(b.created_on || 0).getTime(),
          ),
      );
    } catch {
      // silently ignore — pins simply won't show
    }
  }, [scopeType, dashboardId, sliceId]);

  const shouldFetch = isCommentModeActive || contextPinCount > 0;

  useEffect(() => {
    if (shouldFetch) {
      fetchPins();
    }
  }, [fetchPins, shouldFetch]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleCommentsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<OpenCommentsEventDetail>;
      const { detail } = customEvent;
      if (!detail) {
        return;
      }

      if (
        detail.scopeType === scopeType &&
        detail.dashboardId === dashboardId &&
        (detail.sliceId ?? null) === (sliceId ?? null)
      ) {
        fetchPins();
      }
    };

    window.addEventListener(COMMENTS_CHANGED_EVENT, handleCommentsChanged);
    return () =>
      window.removeEventListener(COMMENTS_CHANGED_EVENT, handleCommentsChanged);
  }, [scopeType, dashboardId, sliceId, fetchPins]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCommentModeActive) return;
    // Don't create a pin if clicking an existing pin
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-popover]')) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    setDraftPin({ xPct, yPct });
    setDraftBody('');
  };

  const handleMentionSearch = useCallback(
    async (query: string, prefix: string) => {
      if (prefix !== '@') return;
      try {
        const users = await searchMentionUsers(query, 8);
        setMentionUsers(users);
      } catch {
        setMentionUsers([]);
      }
    },
    [],
  );

  const handleDraftSubmit = async () => {
    const body = draftBody.trim();
    if (!body || !draftPin) return;
    setSubmitting(true);
    try {
      await createComment({
        scopeType,
        dashboardId,
        sliceId,
        body,
        xPct: draftPin.xPct,
        yPct: draftPin.yPct,
        filterState: dataMask as Record<string, unknown>,
      });
      setDraftPin(null);
      setDraftBody('');
      exitCommentMode();
      dispatchCommentsChanged({ scopeType, dashboardId, sliceId });
      await fetchPins();
    } catch (err) {
      await handleApiError(err as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraftCancel = () => {
    setDraftPin(null);
    setDraftBody('');
  };

  const pinStyle = (xPct: number, yPct: number): CSSProperties => ({
    position: 'absolute',
    left: `${xPct * 100}%`,
    top: `${yPct * 100}%`,
  });

  const mentionOptions = mentionUsers.map(u => (
    <MentionOption key={u.username} value={u.username}>
      {`${u.name} (@${u.username})`}
    </MentionOption>
  ));

  const draftCardContent = (
    <DraftCard data-popover="true">
      <MentionInput
        prefix={['@']}
        rows={3}
        value={draftBody}
        onChange={setDraftBody}
        onSearch={handleMentionSearch}
        placeholder={t('Write a comment…')}
        autoFocus
      >
        {mentionOptions}
      </MentionInput>
      <Space>
        <Button
          buttonSize="small"
          buttonStyle="primary"
          disabled={submitting || !draftBody.trim()}
          onClick={handleDraftSubmit}
        >
          {t('Post')}
        </Button>
        <Button
          buttonSize="small"
          buttonStyle="default"
          onClick={handleDraftCancel}
        >
          {t('Cancel')}
        </Button>
      </Space>
    </DraftCard>
  );

  return (
    <Overlay
      ref={containerRef}
      active={isCommentModeActive}
      // Chart overlays must sit above the dashboard overlay (z-index 10) so
      // they intercept clicks on chart areas when dashboard comment mode is on.
      style={scopeType === 'chart' ? { zIndex: 12 } : undefined}
      data-test={
        scopeType === 'dashboard' ? 'dashboard-pin-overlay' : undefined
      }
      onClick={handleOverlayClick}
    >
      {isCommentModeActive && (
        <HintBar>{t('Click anywhere to comment. Press ESC to exit.')}</HintBar>
      )}

      {/* Existing pins */}
      {pins.map((pin, i) => (
        <Pin
          key={pin.id}
          index={i + 1}
          resolved={pin.resolved}
          style={pinStyle(pin.x_pct!, pin.y_pct!)}
          onClick={e => {
            e.stopPropagation();
            setDraftPin(null);
            if (pin.filter_state) {
              const savedDataMask = pin.filter_state as Record<
                string,
                DataMask
              >;
              Object.entries(savedDataMask).forEach(([filterId, mask]) => {
                dispatch(updateDataMask(filterId, mask));
              });
            }
            dispatchOpenComments({
              scopeType,
              dashboardId,
              sliceId,
              threadId: pin.id,
            });
            exitCommentMode();
          }}
        />
      ))}

      {/* Draft (new) pin */}
      {draftPin && (
        <Pin
          index="+"
          resolved={false}
          style={pinStyle(draftPin.xPct, draftPin.yPct)}
          onClick={e => {
            e.stopPropagation();
            handleDraftCancel();
          }}
        />
      )}

      {/* Draft pin compose card (shown next to draft pin) */}
      {draftPin && (
        <div
          data-popover="true"
          css={css`
            position: absolute;
            left: ${draftPin.xPct * 100}%;
            top: ${draftPin.yPct * 100}%;
            transform: translate(16px, -50%);
            z-index: 1050;
            pointer-events: auto;
          `}
        >
          {draftCardContent}
        </div>
      )}
    </Overlay>
  );
};

export { PinOverlay };

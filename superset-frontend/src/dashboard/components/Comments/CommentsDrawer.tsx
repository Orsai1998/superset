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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Drawer, Mentions, Popconfirm } from 'antd';
import { Check, RotateCcw } from 'lucide-react';
import { getClientErrorObject, styled, t } from '@superset-ui/core';
import { Avatar, Empty, Space } from 'src/components';
import Button from 'src/components/Button';
import { useToasts } from 'src/components/MessageToasts/withToasts';
import {
  Comment,
  CommentUser,
  createComment,
  deleteComment,
  editComment,
  listComments,
  listMyMentions,
  reopenComment,
  replyToComment,
  resolveComment,
  searchMentionUsers,
} from './api';
import {
  COMMENTS_OPEN_EVENT,
  OpenCommentsEventDetail,
  dispatchCommentsChanged,
} from './events';
import { filterDashboardPinsForChart } from './pinScope';

const DrawerTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ScopeLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.label};
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
`;

const ThreadList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.gridUnit * 3}px;
`;

const ThreadToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ThreadPreviewCard = styled.button<{ active: boolean }>`
  ${({ theme, active }) => `
    width: 100%;
    border: 1px solid ${
      active ? theme.colors.primary.base : theme.colors.grayscale.light2
    };
    border-radius: ${theme.borderRadius}px;
    background: ${
      active ? theme.colors.primary.light4 : theme.colors.grayscale.light5
    };
    padding: ${theme.gridUnit * 3}px;
    text-align: left;
    cursor: pointer;

    &:hover {
      border-color: ${theme.colors.primary.base};
    }
  `}
`;

const ThreadPreviewMeta = styled.div`
  color: ${({ theme }) => theme.colors.text.label};
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
  margin-bottom: ${({ theme }) => theme.gridUnit}px;
`;

const ThreadPreviewBody = styled.div`
  color: ${({ theme }) => theme.colors.text.label};
  margin-top: ${({ theme }) => theme.gridUnit}px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const ThreadPreviewReplies = styled.div`
  color: ${({ theme }) => theme.colors.primary.base};
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
  margin-top: ${({ theme }) => theme.gridUnit}px;
`;

const CommentCard = styled.div<{ depth: number }>`
  border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  padding: ${({ theme }) => theme.gridUnit * 3}px;
  margin-left: ${({ theme, depth }) => depth * theme.gridUnit * 4}px;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.gridUnit * 2}px;
`;

const AuthorGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.gridUnit * 2}px;
`;

const AuthorName = styled.div`
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

const Timestamp = styled.div`
  color: ${({ theme }) => theme.colors.text.label};
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
`;

const CommentBody = styled.div`
  margin-bottom: ${({ theme }) => theme.gridUnit * 2}px;
  white-space: normal;

  .comment-mention {
    background-color: ${({ theme }) => theme.colors.primary.light4};
    color: ${({ theme }) => theme.colors.primary.dark1};
    border-radius: ${({ theme }) => theme.borderRadius}px;
    padding: 0 ${({ theme }) => theme.gridUnit / 2}px;
    font-weight: ${({ theme }) => theme.typography.weights.medium};
  }
`;

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.gridUnit * 2}px;
`;

const Composer = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  padding-top: ${({ theme }) => theme.gridUnit * 3}px;
  margin-top: ${({ theme }) => theme.gridUnit * 4}px;
`;

const ComposerHint = styled.div`
  color: ${({ theme }) => theme.colors.text.label};
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
  margin-top: ${({ theme }) => theme.gridUnit}px;
`;

const ReplyComposer = styled.div`
  margin-top: ${({ theme }) => theme.gridUnit * 2}px;
`;

const MentionInput = styled(Mentions)`
  width: 100%;
`;

const InlineTextButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.primary.base};
  padding: 0;
  cursor: pointer;
`;

const DeletedText = styled.span`
  color: ${({ theme }) => theme.colors.grayscale.base};
  font-style: italic;
`;

const ResolvedBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.gridUnit}px;
  color: ${({ theme }) => theme.colors.success.base};
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
  margin-bottom: ${({ theme }) => theme.gridUnit * 2}px;
`;

const ResolveButton = styled.button<{ resolved: boolean }>`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.gridUnit}px;
  color: ${({ theme, resolved }) =>
    resolved ? theme.colors.success.base : theme.colors.grayscale.base};
  font-size: ${({ theme }) => theme.typography.sizes.s}px;

  &:hover {
    color: ${({ theme, resolved }) =>
      resolved ? theme.colors.warning.base : theme.colors.success.base};
  }
`;

type CommentsDrawerProps = {
  dashboardId: number;
};

const { Option: MentionOption } = Mentions;

function getInitials(name: string): string {
  const tokens = name.split(' ').filter(Boolean);
  if (tokens.length === 0) {
    return '?';
  }
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
}

function formatTimestamp(rawTimestamp?: string | null): string {
  if (!rawTimestamp) {
    return '';
  }
  const date = new Date(rawTimestamp);
  if (Number.isNaN(date.getTime())) {
    return rawTimestamp;
  }
  return date.toLocaleString();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMentionsInHtml(
  bodyHtml: string,
  mentionedUsers: (CommentUser | null)[] = [],
): string {
  if (!bodyHtml || typeof document === 'undefined') {
    return bodyHtml;
  }
  const usernames = mentionedUsers
    .map(user => user?.username)
    .filter((username): username is string => Boolean(username));
  if (!usernames.length) {
    return bodyHtml;
  }

  const mentionsPattern = usernames.map(escapeRegExp).join('|');
  if (!mentionsPattern) {
    return bodyHtml;
  }

  const mentionRegex = new RegExp(
    `(^|[^\\w])@(${mentionsPattern})(?=$|[^\\w])`,
    'gi',
  );
  const container = document.createElement('div');
  container.innerHTML = bodyHtml;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  textNodes.forEach(textNode => {
    const text = textNode.nodeValue || '';
    mentionRegex.lastIndex = 0;
    if (!mentionRegex.test(text)) {
      return;
    }

    mentionRegex.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match = mentionRegex.exec(text);
    while (match !== null) {
      const fullMatch = match[0];
      const boundary = match[1] || '';
      const username = match[2];
      const fullIndex = match.index;
      const mentionIndex = fullIndex + boundary.length;

      const textBefore = text.slice(lastIndex, mentionIndex);
      if (textBefore) {
        fragment.appendChild(document.createTextNode(textBefore));
      }

      const mentionNode = document.createElement('span');
      mentionNode.className = 'comment-mention';
      mentionNode.textContent = `@${username}`;
      fragment.appendChild(mentionNode);

      lastIndex = mentionIndex + username.length + 1;

      if (fullMatch.length === 0) {
        break;
      }

      match = mentionRegex.exec(text);
    }

    const remaining = text.slice(lastIndex);
    if (remaining) {
      fragment.appendChild(document.createTextNode(remaining));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  });

  return container.innerHTML;
}

const CommentsDrawer = ({ dashboardId }: CommentsDrawerProps) => {
  const { addDangerToast } = useToasts();
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<OpenCommentsEventDetail>({
    scopeType: 'dashboard',
    dashboardId,
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [composerValue, setComposerValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [mentionCount, setMentionCount] = useState(0);
  const [mentionUsers, setMentionUsers] = useState<CommentUser[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const mentionRequestIdRef = useRef(0);

  const notifyCommentsChanged = useCallback(() => {
    dispatchCommentsChanged({
      scopeType: scope.scopeType,
      dashboardId: scope.dashboardId,
      sliceId: scope.sliceId,
    });
  }, [scope.dashboardId, scope.scopeType, scope.sliceId]);

  const handleApiError = useCallback(
    async (error: Response | { response: Response } | string) => {
      const clientError = await getClientErrorObject(error);
      addDangerToast(
        clientError.message || clientError.error || t('Unexpected error'),
      );
    },
    [addDangerToast],
  );

  const refreshComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listComments({
        scopeType: scope.scopeType,
        dashboardId: scope.dashboardId,
        sliceId: scope.sliceId,
        page: 0,
        pageSize: 200,
      });
      let nextComments = response.result || [];
      const effectiveDashboardId = scope.dashboardId || dashboardId;

      // Fallback for chart drawer: include only dashboard pin threads that
      // spatially belong to this chart.
      if (scope.scopeType === 'chart' && effectiveDashboardId) {
        const dashboardResponse = await listComments({
          scopeType: 'dashboard',
          dashboardId: effectiveDashboardId,
          page: 0,
          pageSize: 200,
        });
        const dashboardComments = dashboardResponse.result || [];
        const dashboardPinnedThreads = dashboardComments.filter(
          comment =>
            comment.parent_id === null &&
            comment.x_pct !== null &&
            comment.y_pct !== null &&
            !comment.deleted_on,
        );
        const dashboardPinsForChart = filterDashboardPinsForChart(
          dashboardPinnedThreads,
          scope.sliceId,
        );
        const dashboardPinnedThreadIds = new Set(
          dashboardPinsForChart.map(comment => comment.id),
        );
        const dashboardPinnedCommentsForChart = dashboardComments.filter(
          comment =>
            dashboardPinnedThreadIds.has(comment.id) ||
            (comment.parent_id !== null &&
              dashboardPinnedThreadIds.has(comment.parent_id)),
        );
        const byId = new Map<number, Comment>();
        [...nextComments, ...dashboardPinnedCommentsForChart].forEach(
          comment => {
            byId.set(comment.id, comment);
          },
        );
        nextComments = Array.from(byId.values()).sort((a, b) => {
          const aCreated = new Date(a.created_on || 0).getTime();
          const bCreated = new Date(b.created_on || 0).getTime();
          if (aCreated === bCreated) {
            return a.id - b.id;
          }
          return aCreated - bCreated;
        });
      }

      setComments(nextComments);
    } catch (error) {
      await handleApiError(error as Response);
    } finally {
      setLoading(false);
    }
  }, [
    dashboardId,
    handleApiError,
    scope.dashboardId,
    scope.scopeType,
    scope.sliceId,
  ]);

  const refreshMentions = useCallback(async () => {
    try {
      const mentions = await listMyMentions(0, 1, {
        scopeType: scope.scopeType,
        dashboardId: scope.dashboardId,
        sliceId: scope.sliceId,
      });
      setMentionCount(mentions.count || 0);
    } catch {
      setMentionCount(0);
    }
  }, [scope.dashboardId, scope.scopeType, scope.sliceId]);

  const fetchMentionUsers = useCallback(async (query: string) => {
    const nextRequestId = mentionRequestIdRef.current + 1;
    mentionRequestIdRef.current = nextRequestId;
    const requestId = nextRequestId;
    try {
      const users = await searchMentionUsers(query, 8);
      if (requestId === mentionRequestIdRef.current) {
        setMentionUsers(users);
      }
    } catch {
      if (requestId === mentionRequestIdRef.current) {
        setMentionUsers([]);
      }
    }
  }, []);

  const handleMentionSearch = useCallback(
    (query: string, prefix: string) => {
      if (prefix !== '@') {
        return;
      }
      fetchMentionUsers(query);
    },
    [fetchMentionUsers],
  );

  const resetInlineEditors = useCallback(() => {
    setReplyingTo(null);
    setEditingCommentId(null);
    setEditingValue('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    refreshComments();
    refreshMentions();
  }, [isOpen, refreshComments, refreshMentions]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleOpenDrawer = (event: Event) => {
      const customEvent = event as CustomEvent<OpenCommentsEventDetail>;
      const { detail } = customEvent;
      if (!detail) {
        return;
      }
      setLoading(true);
      setScope({
        scopeType: detail.scopeType,
        dashboardId: detail.dashboardId || dashboardId,
        sliceId: detail.sliceId,
      });
      setSelectedThreadId(detail.threadId ?? null);
      setComposerValue('');
      setReplyDrafts({});
      setReplyingTo(null);
      setEditingCommentId(null);
      setEditingValue('');
      setIsOpen(true);
    };

    window.addEventListener(COMMENTS_OPEN_EVENT, handleOpenDrawer);
    return () =>
      window.removeEventListener(COMMENTS_OPEN_EVENT, handleOpenDrawer);
  }, [dashboardId]);

  useEffect(() => {
    setScope(prevScope => ({
      ...prevScope,
      dashboardId: prevScope.dashboardId || dashboardId,
    }));
  }, [dashboardId]);

  const groupedComments = useMemo(() => {
    const byParentId = new Map<number | null, Comment[]>();
    comments.forEach(comment => {
      const parentId = comment.parent_id || null;
      const group = byParentId.get(parentId) || [];
      group.push(comment);
      byParentId.set(parentId, group);
    });
    return byParentId;
  }, [comments]);
  const topLevelComments = useMemo(
    () => groupedComments.get(null) || [],
    [groupedComments],
  );
  const pinnedThreads = useMemo(
    () =>
      topLevelComments
        .filter(
          comment =>
            comment.x_pct !== null &&
            comment.y_pct !== null &&
            !comment.deleted_on,
        )
        .sort(
          (a, b) =>
            new Date(a.created_on || 0).getTime() -
            new Date(b.created_on || 0).getTime(),
        ),
    [topLevelComments],
  );
  const selectedThread = useMemo(
    () =>
      selectedThreadId === null
        ? null
        : pinnedThreads.find(thread => thread.id === selectedThreadId) || null,
    [pinnedThreads, selectedThreadId],
  );
  const isChartScope = scope.scopeType === 'chart';
  const isPinnedListView = isChartScope && selectedThreadId === null;

  useEffect(() => {
    if (!isChartScope || selectedThreadId === null || loading) {
      return;
    }
    if (!pinnedThreads.some(thread => thread.id === selectedThreadId)) {
      setSelectedThreadId(null);
    }
  }, [isChartScope, loading, pinnedThreads, selectedThreadId]);

  const submitNewComment = async () => {
    const body = composerValue.trim();
    if (!body) {
      return;
    }

    setSubmitting(true);
    try {
      if (selectedThreadId !== null) {
        await replyToComment(selectedThreadId, body);
      } else {
        await createComment({
          scopeType: scope.scopeType,
          dashboardId: scope.dashboardId,
          sliceId: scope.sliceId,
          body,
        });
      }
      setComposerValue('');
      resetInlineEditors();
      await refreshComments();
      await refreshMentions();
      notifyCommentsChanged();
    } catch (error) {
      await handleApiError(error as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelComposer = () => {
    if (selectedThreadId !== null && !composerValue.trim()) {
      setSelectedThreadId(null);
      return;
    }
    if (
      composerValue.trim() ||
      replyingTo !== null ||
      editingCommentId !== null
    ) {
      setComposerValue('');
      setReplyDrafts({});
      resetInlineEditors();
      return;
    }
    setIsOpen(false);
  };

  const submitReply = async (commentId: number) => {
    const body = (replyDrafts[commentId] || '').trim();
    if (!body) {
      return;
    }

    setSubmitting(true);
    try {
      await replyToComment(commentId, body);
      setReplyDrafts(prev => ({ ...prev, [commentId]: '' }));
      setReplyingTo(null);
      await refreshComments();
      await refreshMentions();
      notifyCommentsChanged();
    } catch (error) {
      await handleApiError(error as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (commentId: number) => {
    const body = editingValue.trim();
    if (!body) {
      return;
    }

    setSubmitting(true);
    try {
      await editComment(commentId, body);
      setEditingCommentId(null);
      setEditingValue('');
      await refreshComments();
      await refreshMentions();
      notifyCommentsChanged();
    } catch (error) {
      await handleApiError(error as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const removeComment = async (commentId: number) => {
    setSubmitting(true);
    try {
      await deleteComment(commentId);
      await refreshComments();
      await refreshMentions();
      notifyCommentsChanged();
    } catch (error) {
      await handleApiError(error as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleResolve = async (comment: Comment) => {
    setSubmitting(true);
    try {
      const updated = comment.resolved
        ? await reopenComment(comment.id)
        : await resolveComment(comment.id);
      setComments(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      notifyCommentsChanged();
    } catch (error) {
      await handleApiError(error as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSelectedPin = async () => {
    if (!selectedThread || selectedThread.deleted_on) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteComment(selectedThread.id);
      setSelectedThreadId(null);
      await refreshComments();
      await refreshMentions();
      notifyCommentsChanged();
    } catch (error) {
      await handleApiError(error as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const mentionOptions = useMemo(
    () =>
      mentionUsers.map(user => (
        <MentionOption key={user.username} value={user.username}>
          {`${user.name} (@${user.username})`}
        </MentionOption>
      )),
    [mentionUsers],
  );

  const renderPinnedThreadPreview = (thread: Comment, index: number) => {
    const replies = (groupedComments.get(thread.id) || []).filter(
      child => !child.deleted_on,
    );
    const authorName = thread.author?.name || t('Unknown user');
    return (
      <ThreadPreviewCard
        key={thread.id}
        type="button"
        active={thread.id === selectedThreadId}
        onClick={() => {
          setSelectedThreadId(thread.id);
          setComposerValue('');
          setReplyingTo(null);
          setEditingCommentId(null);
          setEditingValue('');
        }}
      >
        <ThreadPreviewMeta>{`#${index + 1} · ${formatTimestamp(
          thread.created_on,
        )}${thread.resolved ? ` · ${t('Resolved')}` : ''}`}</ThreadPreviewMeta>
        <AuthorName>{authorName}</AuthorName>
        <ThreadPreviewBody>{thread.body || t('[deleted]')}</ThreadPreviewBody>
        <ThreadPreviewReplies>
          {t('%s replies', replies.length)}
        </ThreadPreviewReplies>
      </ThreadPreviewCard>
    );
  };

  const renderComment = (comment: Comment, depth = 0): JSX.Element => {
    const children = groupedComments.get(comment.id) || [];
    const authorName = comment.author?.name || t('Unknown user');
    const isDeleted = Boolean(comment.deleted_on);
    const hideInlineDeleteAction =
      isChartScope &&
      selectedThreadId !== null &&
      depth === 0 &&
      comment.id === selectedThreadId;

    return (
      <div key={comment.id}>
        <CommentCard depth={depth}>
          <CommentHeader>
            <AuthorGroup>
              <Avatar
                src={comment.author?.avatar_url || undefined}
                size="small"
              >
                {getInitials(authorName)}
              </Avatar>
              <div>
                <AuthorName>{authorName}</AuthorName>
                <Timestamp>{formatTimestamp(comment.created_on)}</Timestamp>
              </div>
            </AuthorGroup>
          </CommentHeader>

          {editingCommentId === comment.id ? (
            <>
              <MentionInput
                prefix={['@']}
                rows={3}
                value={editingValue}
                onChange={setEditingValue}
                onSearch={handleMentionSearch}
                placeholder={t('Write a comment...')}
              >
                {mentionOptions}
              </MentionInput>
              <Space style={{ marginTop: 8 }}>
                <Button
                  buttonSize="small"
                  buttonStyle="primary"
                  disabled={submitting}
                  onClick={() => submitEdit(comment.id)}
                >
                  {t('Submit')}
                </Button>
                <Button
                  buttonSize="small"
                  buttonStyle="default"
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditingValue('');
                  }}
                >
                  {t('Cancel')}
                </Button>
              </Space>
            </>
          ) : (
            <CommentBody>
              {isDeleted ? (
                <DeletedText>{t('[deleted]')}</DeletedText>
              ) : (
                /*
                 * Safe because body_html comes from backend markdown sanitization
                 * via superset.utils.core.markdown (nh3-cleaned HTML).
                 */
                // eslint-disable-next-line react/no-danger
                <div
                  dangerouslySetInnerHTML={{
                    __html: highlightMentionsInHtml(
                      comment.body_html,
                      comment.mentioned_users,
                    ),
                  }}
                />
              )}
            </CommentBody>
          )}

          {!isDeleted && comment.resolved && (
            <ResolvedBanner>
              <Check size={12} />
              {t('Resolved')}
            </ResolvedBanner>
          )}

          {!isDeleted && editingCommentId !== comment.id && (
            <ActionsRow>
              <InlineTextButton
                type="button"
                onClick={() => {
                  setReplyingTo(comment.id);
                  setEditingCommentId(null);
                }}
              >
                {t('Reply')}
              </InlineTextButton>
              {comment.can_edit && (
                <InlineTextButton
                  type="button"
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditingValue(comment.body);
                    setReplyingTo(null);
                  }}
                >
                  {t('Edit')}
                </InlineTextButton>
              )}
              {comment.can_delete && !hideInlineDeleteAction && (
                <InlineTextButton
                  type="button"
                  onClick={() => removeComment(comment.id)}
                >
                  {t('Delete')}
                </InlineTextButton>
              )}
              {comment.can_resolve && (
                <ResolveButton
                  type="button"
                  resolved={comment.resolved}
                  disabled={submitting}
                  onClick={() => toggleResolve(comment)}
                >
                  {comment.resolved ? (
                    <>
                      <RotateCcw size={11} />
                      {t('Reopen')}
                    </>
                  ) : (
                    <>
                      <Check size={11} />
                      {t('Resolve')}
                    </>
                  )}
                </ResolveButton>
              )}
            </ActionsRow>
          )}

          {replyingTo === comment.id && (
            <ReplyComposer>
              <MentionInput
                prefix={['@']}
                rows={3}
                value={replyDrafts[comment.id] || ''}
                onChange={value =>
                  setReplyDrafts(prev => ({
                    ...prev,
                    [comment.id]: value,
                  }))
                }
                onSearch={handleMentionSearch}
                placeholder={t('Write a comment...')}
              >
                {mentionOptions}
              </MentionInput>
              <Space style={{ marginTop: 8 }}>
                <Button
                  buttonSize="small"
                  buttonStyle="primary"
                  disabled={submitting}
                  onClick={() => submitReply(comment.id)}
                >
                  {t('Submit')}
                </Button>
                <Button
                  buttonSize="small"
                  buttonStyle="default"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyDrafts(prev => ({ ...prev, [comment.id]: '' }));
                  }}
                >
                  {t('Cancel')}
                </Button>
              </Space>
            </ReplyComposer>
          )}
        </CommentCard>

        {children.map(child => renderComment(child, depth + 1))}
      </div>
    );
  };

  const scopeLabel = isChartScope
    ? t('Pins: %s', pinnedThreads.length)
    : t('Dashboard thread');
  const showComposer = selectedThreadId !== null ? true : !isChartScope;
  const composerPlaceholder =
    selectedThreadId !== null && selectedThread
      ? t('Reply to this thread...')
      : t('Write a comment...');
  const composerHint =
    selectedThreadId !== null && selectedThread
      ? t('Reply to the selected pin')
      : t('Mention a user with @username');

  return (
    <Drawer
      title={
        <DrawerTitle>
          <Space>
            <strong>{t('Comments')}</strong>
            <Badge count={mentionCount} size="small" showZero>
              <ScopeLabel>{t('Mentions')}</ScopeLabel>
            </Badge>
          </Space>
          <ScopeLabel>{scopeLabel}</ScopeLabel>
        </DrawerTitle>
      }
      visible={isOpen}
      onClose={() => setIsOpen(false)}
      placement="right"
      width={440}
      destroyOnClose={false}
      data-test="comments-drawer"
    >
      <ThreadList>
        {isChartScope && selectedThread && !selectedThread.deleted_on && (
          <ThreadToolbar>
            <Popconfirm
              title={t(
                'Delete this pin? The pin and its thread will be marked as deleted.',
              )}
              okText={t('Delete')}
              okButtonProps={{ danger: true }}
              cancelText={t('Cancel')}
              onConfirm={deleteSelectedPin}
              disabled={submitting || !selectedThread.can_delete}
            >
              <Button
                buttonStyle="danger"
                buttonSize="small"
                disabled={submitting || !selectedThread.can_delete}
              >
                {t('Delete pin')}
              </Button>
            </Popconfirm>
          </ThreadToolbar>
        )}
        {loading ? (
          <ScopeLabel>{t('Loading comments...')}</ScopeLabel>
        ) : selectedThreadId !== null ? (
          selectedThread ? (
            renderComment(selectedThread)
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('Thread not found')}
            />
          )
        ) : isPinnedListView ? (
          pinnedThreads.length > 0 ? (
            pinnedThreads.map((thread, index) =>
              renderPinnedThreadPreview(thread, index),
            )
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('No pins yet')}
            />
          )
        ) : topLevelComments.length > 0 ? (
          topLevelComments.map(comment => renderComment(comment))
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('No comments yet')}
          />
        )}
      </ThreadList>

      {showComposer && (
        <Composer>
          <MentionInput
            prefix={['@']}
            rows={4}
            value={composerValue}
            placeholder={composerPlaceholder}
            onChange={setComposerValue}
            onSearch={handleMentionSearch}
          >
            {mentionOptions}
          </MentionInput>
          <ComposerHint>{composerHint}</ComposerHint>
          <Space style={{ marginTop: 8 }}>
            <Button
              buttonStyle="primary"
              buttonSize="small"
              disabled={submitting}
              onClick={submitNewComment}
            >
              {t('Submit')}
            </Button>
            <Button
              buttonStyle="default"
              buttonSize="small"
              onClick={cancelComposer}
            >
              {t('Cancel')}
            </Button>
          </Space>
        </Composer>
      )}
    </Drawer>
  );
};

export default CommentsDrawer;

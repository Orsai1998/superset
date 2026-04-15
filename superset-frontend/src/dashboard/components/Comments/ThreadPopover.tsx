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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mentions, Popover } from 'antd';
import { Check, RotateCcw, X } from 'lucide-react';
import { css, getClientErrorObject, styled, t } from '@superset-ui/core';
import { Avatar, Button, Space } from '@superset-ui/core/components';
import { useToasts } from 'src/components/MessageToasts/withToasts';
import {
  Comment,
  CommentUser,
  deleteComment,
  reopenComment,
  replyToComment,
  resolveComment,
  searchMentionUsers,
} from './api';

const { Option: MentionOption } = Mentions;

const Card = styled.div`
  ${({ theme }) => css`
    width: 320px;
    max-height: 480px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: ${theme.sizeUnit * 2}px;
  `}
`;

const ThreadHeader = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: ${theme.sizeUnit * 2}px;
    border-bottom: 1px solid ${theme.colorBorderSecondary};
  `}
`;

const CommentItem = styled.div<{ isReply: boolean }>`
  ${({ theme, isReply }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.sizeUnit}px;
    ${isReply &&
    `
      margin-left: ${theme.sizeUnit * 4}px;
      padding-left: ${theme.sizeUnit * 2}px;
      border-left: 2px solid ${theme.colorBorderSecondary};
    `}
  `}
`;

const AuthorRow = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit * 2}px;
  `}
`;

const AuthorName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeightStrong};
  font-size: ${({ theme }) => theme.fontSizeSM}px;
`;

const Timestamp = styled.span`
  color: ${({ theme }) => theme.colorTextSecondary};
  font-size: ${({ theme }) => theme.fontSizeXS}px;
`;

const Body = styled.div`
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  word-break: break-word;
`;

const ActionsRow = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit * 2}px;
    flex-wrap: wrap;
  `}
`;

const InlineBtn = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colorPrimary};
  font-size: ${({ theme }) => theme.fontSizeXS}px;
  padding: 0;
  cursor: pointer;
`;

const ResolvedBanner = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit}px;
    color: ${theme.colorSuccess};
    font-size: ${theme.fontSizeXS}px;
  `}
`;

const ResolveBtn = styled.button<{ resolved: boolean }>`
  ${({ theme, resolved }) => css`
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    gap: ${theme.sizeUnit}px;
    font-size: ${theme.fontSizeXS}px;
    color: ${resolved ? theme.colorSuccess : theme.colorTextSecondary};
    &:hover {
      color: ${resolved ? theme.colorWarning : theme.colorSuccess};
    }
  `}
`;

const ReplyArea = styled.div`
  ${({ theme }) => css`
    border-top: 1px solid ${theme.colorBorderSecondary};
    padding-top: ${theme.sizeUnit * 2}px;
    margin-top: ${theme.sizeUnit}px;
  `}
`;

const MentionInput = styled(Mentions)`
  width: 100%;
  font-size: ${({ theme }) => theme.fontSizeSM}px;
`;

function getInitials(name: string): string {
  const tokens = name.split(' ').filter(Boolean);
  if (tokens.length === 0) return '?';
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
}

function formatTs(raw?: string | null): string {
  if (!raw) return '';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
}

function highlightMentions(
  html: string,
  users: (CommentUser | null)[] = [],
): string {
  if (!html || typeof document === 'undefined') return html;
  const names = users
    .map(u => u?.username)
    .filter((u): u is string => Boolean(u));
  if (!names.length) return html;
  const pattern = names
    .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const re = new RegExp(`(^|[^\\w])@(${pattern})(?=$|[^\\w])`, 'gi');
  const el = document.createElement('div');
  el.innerHTML = html;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let cur = walker.nextNode();
  while (cur) {
    nodes.push(cur as Text);
    cur = walker.nextNode();
  }
  nodes.forEach(node => {
    const text = node.nodeValue || '';
    re.lastIndex = 0;
    if (!re.test(text)) return;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m = re.exec(text);
    while (m !== null) {
      const boundary = m[1] || '';
      const uname = m[2];
      const start = m.index + boundary.length;
      if (text.slice(last, start)) {
        frag.appendChild(document.createTextNode(text.slice(last, start)));
      }
      const span = document.createElement('span');
      span.className = 'comment-mention';
      span.textContent = `@${uname}`;
      frag.appendChild(span);
      last = start + uname.length + 1;
      if (m[0].length === 0) break;
      m = re.exec(text);
    }
    if (text.slice(last)) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    node.parentNode?.replaceChild(frag, node);
  });
  return el.innerHTML;
}

type ThreadPopoverProps = {
  topComment: Comment;
  replies: Comment[];
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
  onThreadChange: () => void;
};

const ThreadPopover = ({
  topComment,
  replies,
  visible,
  children,
  onClose,
  onThreadChange,
}: ThreadPopoverProps) => {
  const { addDangerToast } = useToasts();
  const [replyValue, setReplyValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<CommentUser[]>([]);
  const [currentComment, setCurrentComment] = useState<Comment>(topComment);

  useEffect(() => {
    setCurrentComment(topComment);
  }, [topComment]);

  const handleApiError = useCallback(
    async (err: Response | string) => {
      const clientErr = await getClientErrorObject(err);
      addDangerToast(
        clientErr.message || clientErr.error || t('Unexpected error'),
      );
    },
    [addDangerToast],
  );

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

  const mentionOptions = useMemo(
    () =>
      mentionUsers.map(u => (
        <MentionOption key={u.username} value={u.username}>
          {`${u.name} (@${u.username})`}
        </MentionOption>
      )),
    [mentionUsers],
  );

  const handleReply = async () => {
    const body = replyValue.trim();
    if (!body) return;
    setSubmitting(true);
    try {
      await replyToComment(topComment.id, body);
      setReplyValue('');
      onThreadChange();
    } catch (err) {
      await handleApiError(err as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async () => {
    setSubmitting(true);
    try {
      const updated = currentComment.resolved
        ? await reopenComment(currentComment.id)
        : await resolveComment(currentComment.id);
      setCurrentComment(updated);
      onThreadChange();
    } catch (err) {
      await handleApiError(err as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    setSubmitting(true);
    try {
      await deleteComment(commentId);
      onThreadChange();
    } catch (err) {
      await handleApiError(err as Response);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, isReply: boolean) => {
    const author = comment.author?.name || t('Unknown');
    const isDeleted = Boolean(comment.deleted_on);
    return (
      <CommentItem key={comment.id} isReply={isReply}>
        <AuthorRow>
          <Avatar src={comment.author?.avatar_url || undefined} size="small">
            {getInitials(author)}
          </Avatar>
          <div>
            <AuthorName>{author}</AuthorName>
            <Timestamp> · {formatTs(comment.created_on)}</Timestamp>
          </div>
        </AuthorRow>
        <Body>
          {isDeleted ? (
            <em>{t('[deleted]')}</em>
          ) : (
            // eslint-disable-next-line react/no-danger
            <div
              dangerouslySetInnerHTML={{
                __html: highlightMentions(
                  comment.body_html,
                  comment.mentioned_users,
                ),
              }}
            />
          )}
        </Body>
        {!isDeleted && comment.resolved && !isReply && (
          <ResolvedBanner>
            <Check size={11} />
            {t('Resolved')}
          </ResolvedBanner>
        )}
        {!isDeleted && (
          <ActionsRow>
            {!isReply && comment.can_resolve && (
              <ResolveBtn
                type="button"
                resolved={currentComment.resolved}
                disabled={submitting}
                onClick={handleToggleResolve}
              >
                {currentComment.resolved ? (
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
              </ResolveBtn>
            )}
            {comment.can_delete && (
              <InlineBtn type="button" onClick={() => handleDelete(comment.id)}>
                {t('Delete')}
              </InlineBtn>
            )}
          </ActionsRow>
        )}
      </CommentItem>
    );
  };

  const content = (
    <Card>
      <ThreadHeader>
        <strong>{t('Comment')}</strong>
        <button
          type="button"
          css={css`
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            line-height: 1;
          `}
          onClick={onClose}
          aria-label={t('Close')}
        >
          <X size={14} />
        </button>
      </ThreadHeader>

      {renderComment(currentComment, false)}

      {replies.map(reply => renderComment(reply, true))}

      <ReplyArea>
        <MentionInput
          prefix={['@']}
          rows={2}
          value={replyValue}
          onChange={setReplyValue}
          onSearch={handleMentionSearch}
          placeholder={t('Reply…')}
        >
          {mentionOptions}
        </MentionInput>
        <Space style={{ marginTop: 6 }}>
          <Button
            buttonSize="small"
            buttonStyle="primary"
            disabled={submitting || !replyValue.trim()}
            onClick={handleReply}
          >
            {t('Reply')}
          </Button>
        </Space>
      </ReplyArea>
    </Card>
  );

  return (
    <Popover
      content={content}
      visible={visible}
      trigger={[]}
      placement="rightTop"
      destroyTooltipOnHide={false}
      overlayStyle={{ zIndex: 1050 }}
    >
      {children as React.ReactElement}
    </Popover>
  );
};

export { ThreadPopover };

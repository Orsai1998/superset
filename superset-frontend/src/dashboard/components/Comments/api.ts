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

import { SupersetClient } from '@superset-ui/core';
import { CommentScopeType } from './events';

const COMMENTS_ENDPOINT = '/api/v1/comments';

export type CommentUser = {
  id: number;
  username: string;
  name: string;
  avatar_url: string | null;
};

export type Comment = {
  id: number;
  scope_type: CommentScopeType;
  dashboard_id: number | null;
  slice_id: number | null;
  parent_id: number | null;
  body: string;
  body_html: string;
  created_on: string;
  updated_on: string;
  deleted_on: string | null;
  resolved: boolean;
  resolved_on: string | null;
  resolved_by: CommentUser | null;
  x_pct: number | null;
  y_pct: number | null;
  filter_state: Record<string, unknown> | null;
  author: CommentUser | null;
  mentioned_users: (CommentUser | null)[];
  can_edit: boolean;
  can_delete: boolean;
  can_resolve: boolean;
};

export type CommentsResponse = {
  count: number;
  page: number;
  page_size: number;
  total_unresolved_count: number;
  result: Comment[];
};

export type Mention = {
  id: number;
  created_on: string;
  comment: Comment;
};

export type MentionsResponse = {
  count: number;
  page: number;
  page_size: number;
  result: Mention[];
};

type ScopeParams = {
  scopeType: CommentScopeType;
  dashboardId?: number;
  sliceId?: number;
};

function buildScopeQuery({
  scopeType,
  dashboardId,
  sliceId,
  page,
  pageSize,
}: ScopeParams & { page: number; pageSize: number }): string {
  const searchParams = new URLSearchParams();
  searchParams.set('scope_type', scopeType);

  if (dashboardId) {
    searchParams.set('dashboard_id', String(dashboardId));
  }

  if (sliceId) {
    searchParams.set('slice_id', String(sliceId));
  }

  searchParams.set('page', String(page));
  searchParams.set('page_size', String(pageSize));

  return searchParams.toString();
}

export async function listComments(
  params: ScopeParams & { page?: number; pageSize?: number },
): Promise<CommentsResponse> {
  const query = buildScopeQuery({
    ...params,
    page: params.page ?? 0,
    pageSize: params.pageSize ?? 50,
  });
  const { json } = await SupersetClient.get({
    endpoint: `${COMMENTS_ENDPOINT}/?${query}`,
  });
  return json as CommentsResponse;
}

export async function createComment({
  scopeType,
  dashboardId,
  sliceId,
  body,
  xPct,
  yPct,
  filterState,
}: ScopeParams & {
  body: string;
  xPct?: number | null;
  yPct?: number | null;
  filterState?: Record<string, unknown> | null;
}): Promise<Comment> {
  const { json } = await SupersetClient.post({
    endpoint: `${COMMENTS_ENDPOINT}/`,
    jsonPayload: {
      scope_type: scopeType,
      dashboard_id: dashboardId,
      slice_id: sliceId,
      body,
      x_pct: xPct ?? null,
      y_pct: yPct ?? null,
      filter_state: filterState ? JSON.stringify(filterState) : null,
    },
  });
  return json.result;
}

export async function resolveComment(commentId: number): Promise<Comment> {
  const { json } = await SupersetClient.request({
    endpoint: `${COMMENTS_ENDPOINT}/${commentId}/resolve`,
    method: 'PATCH',
    parseMethod: 'json',
  });
  return json.result;
}

export async function reopenComment(commentId: number): Promise<Comment> {
  const { json } = await SupersetClient.request({
    endpoint: `${COMMENTS_ENDPOINT}/${commentId}/reopen`,
    method: 'PATCH',
    parseMethod: 'json',
  });
  return json.result;
}

export async function replyToComment(
  commentId: number,
  body: string,
): Promise<Comment> {
  const { json } = await SupersetClient.post({
    endpoint: `${COMMENTS_ENDPOINT}/${commentId}/reply`,
    jsonPayload: { body },
  });
  return json.result;
}

export async function editComment(
  commentId: number,
  body: string,
): Promise<Comment> {
  const { json } = await SupersetClient.request({
    endpoint: `${COMMENTS_ENDPOINT}/${commentId}`,
    method: 'PATCH',
    jsonPayload: { body },
    parseMethod: 'json',
  });
  return json.result;
}

export async function deleteComment(commentId: number): Promise<void> {
  await SupersetClient.delete({
    endpoint: `${COMMENTS_ENDPOINT}/${commentId}`,
  });
}

export async function searchMentionUsers(
  query = '',
  pageSize = 8,
): Promise<CommentUser[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('q', query);
  searchParams.set('page_size', String(pageSize));

  const { json } = await SupersetClient.get({
    endpoint: `${COMMENTS_ENDPOINT}/users/?${searchParams.toString()}`,
  });
  return json.result || [];
}

export async function listMyMentions(
  page = 0,
  pageSize = 100,
  scope?: ScopeParams,
): Promise<MentionsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(page));
  searchParams.set('page_size', String(pageSize));
  if (scope?.scopeType) {
    searchParams.set('scope_type', scope.scopeType);
  }
  if (scope?.dashboardId) {
    searchParams.set('dashboard_id', String(scope.dashboardId));
  }
  if (scope?.sliceId) {
    searchParams.set('slice_id', String(scope.sliceId));
  }

  const { json } = await SupersetClient.get({
    endpoint: `${COMMENTS_ENDPOINT}/mentions/?${searchParams.toString()}`,
  });
  return json as MentionsResponse;
}

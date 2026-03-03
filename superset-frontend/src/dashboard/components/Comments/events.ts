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

export type CommentScopeType = 'dashboard' | 'chart';

export type OpenCommentsEventDetail = {
  scopeType: CommentScopeType;
  dashboardId: number;
  sliceId?: number;
  threadId?: number;
};

export const COMMENTS_OPEN_EVENT = 'superset.dashboard.comments.open';
export const COMMENTS_CHANGED_EVENT = 'superset.dashboard.comments.changed';

export function dispatchOpenComments(detail: OpenCommentsEventDetail) {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<OpenCommentsEventDetail>(COMMENTS_OPEN_EVENT, { detail }),
  );
}

export function dispatchCommentsChanged(detail: OpenCommentsEventDetail) {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<OpenCommentsEventDetail>(COMMENTS_CHANGED_EVENT, {
      detail,
    }),
  );
}

export type CommentModeScope = {
  scopeType: CommentScopeType;
  dashboardId: number;
  sliceId?: number;
};

export const COMMENT_MODE_ENTER_EVENT =
  'superset.dashboard.comments.mode.enter';
export const COMMENT_MODE_EXIT_EVENT = 'superset.dashboard.comments.mode.exit';

export function dispatchEnterCommentMode(scope: CommentModeScope): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<CommentModeScope>(COMMENT_MODE_ENTER_EVENT, {
      detail: scope,
    }),
  );
}

export function dispatchExitCommentMode(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(COMMENT_MODE_EXIT_EVENT));
}

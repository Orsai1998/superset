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

import { act } from '@testing-library/react';
import { render, screen } from 'spec/helpers/testing-library';
import userEvent from '@testing-library/user-event';
import CommentsDrawer from './CommentsDrawer';
import { COMMENTS_OPEN_EVENT, OpenCommentsEventDetail } from './events';
import {
  createComment,
  listComments,
  listMyMentions,
  replyToComment,
  editComment,
  deleteComment,
  searchMentionUsers,
} from './api';
import { filterDashboardPinsForChart } from './pinScope';

jest.mock('./api');
jest.mock('./pinScope', () => ({
  filterDashboardPinsForChart: jest.fn((pins: unknown[]) => pins),
}));

const mockedListComments = listComments as jest.Mock;
const mockedListMyMentions = listMyMentions as jest.Mock;
const mockedCreateComment = createComment as jest.Mock;
const mockedReplyToComment = replyToComment as jest.Mock;
const mockedEditComment = editComment as jest.Mock;
const mockedDeleteComment = deleteComment as jest.Mock;
const mockedSearchMentionUsers = searchMentionUsers as jest.Mock;
const mockedFilterDashboardPinsForChart =
  filterDashboardPinsForChart as jest.Mock;

const sampleComment = {
  id: 11,
  scope_type: 'dashboard',
  dashboard_id: 42,
  slice_id: null,
  parent_id: null,
  body: 'hello',
  body_html: '<p>hello</p>',
  created_on: '2026-03-03T00:00:00',
  updated_on: '2026-03-03T00:00:00',
  deleted_on: null,
  author: {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    avatar_url: null,
  },
  mentioned_users: [],
  can_edit: true,
  can_delete: true,
  can_resolve: true,
  resolved: false,
  resolved_on: null,
  resolved_by: null,
  x_pct: null,
  y_pct: null,
};

const samplePinnedThreadA = {
  ...sampleComment,
  id: 101,
  scope_type: 'chart',
  slice_id: 7,
  body: 'pin thread A',
  body_html: '<p>pin thread A</p>',
  x_pct: 0.1,
  y_pct: 0.2,
};

const samplePinnedThreadB = {
  ...sampleComment,
  id: 102,
  scope_type: 'chart',
  slice_id: 7,
  body: 'pin thread B',
  body_html: '<p>pin thread B</p>',
  x_pct: 0.6,
  y_pct: 0.4,
};

const samplePinnedReplyA = {
  ...sampleComment,
  id: 201,
  scope_type: 'chart',
  slice_id: 7,
  parent_id: 101,
  body: 'reply A',
  body_html: '<p>reply A</p>',
};

const samplePinnedReplyB = {
  ...sampleComment,
  id: 202,
  scope_type: 'chart',
  slice_id: 7,
  parent_id: 102,
  body: 'reply B',
  body_html: '<p>reply B</p>',
};

const sampleDashboardPinnedThread = {
  ...sampleComment,
  id: 301,
  scope_type: 'dashboard',
  slice_id: null,
  body: 'dashboard pin thread',
  body_html: '<p>dashboard pin thread</p>',
  x_pct: 0.25,
  y_pct: 0.35,
};

const sampleDashboardPinnedReply = {
  ...sampleComment,
  id: 302,
  scope_type: 'dashboard',
  slice_id: null,
  parent_id: 301,
  body: 'dashboard pin reply',
  body_html: '<p>dashboard pin reply</p>',
};

async function openDrawer(detail: OpenCommentsEventDetail) {
  await act(async () => {
    window.dispatchEvent(new CustomEvent(COMMENTS_OPEN_EVENT, { detail }));
  });
}

describe('CommentsDrawer', () => {
  beforeEach(() => {
    mockedListComments.mockReset();
    mockedListMyMentions.mockReset();
    mockedCreateComment.mockReset();
    mockedReplyToComment.mockReset();
    mockedEditComment.mockReset();
    mockedDeleteComment.mockReset();
    mockedSearchMentionUsers.mockReset();
    mockedFilterDashboardPinsForChart.mockReset();

    mockedListComments.mockResolvedValue({
      count: 1,
      page: 0,
      page_size: 200,
      result: [sampleComment],
    });
    mockedListMyMentions.mockResolvedValue({
      count: 2,
      page: 0,
      page_size: 1,
      result: [],
    });
    mockedCreateComment.mockResolvedValue(sampleComment);
    mockedReplyToComment.mockResolvedValue(sampleComment);
    mockedEditComment.mockResolvedValue(sampleComment);
    mockedDeleteComment.mockResolvedValue(undefined);
    mockedSearchMentionUsers.mockResolvedValue([]);
    mockedFilterDashboardPinsForChart.mockImplementation(
      (pins: unknown[]) => pins,
    );
  });

  test('opens via event and renders comments', async () => {
    render(<CommentsDrawer dashboardId={42} />, {
      useRedux: true,
      useRouter: true,
    });

    await openDrawer({
      scopeType: 'dashboard',
      dashboardId: 42,
    });

    expect(await screen.findByText('Comments')).toBeInTheDocument();
    expect(await screen.findByText('Admin User')).toBeInTheDocument();
    expect(mockedListComments).toHaveBeenCalledWith({
      scopeType: 'dashboard',
      dashboardId: 42,
      sliceId: undefined,
      page: 0,
      pageSize: 200,
    });
    expect(mockedListMyMentions).toHaveBeenCalledWith(0, 1, {
      scopeType: 'dashboard',
      dashboardId: 42,
      sliceId: undefined,
    });
  });

  test('submits a new comment', async () => {
    render(<CommentsDrawer dashboardId={42} />, {
      useRedux: true,
      useRouter: true,
    });

    await openDrawer({
      scopeType: 'dashboard',
      dashboardId: 42,
    });

    const input = await screen.findByPlaceholderText('Write a comment...');
    userEvent.type(input, 'new comment');
    userEvent.click(screen.getAllByText('Submit')[0]);

    expect(mockedCreateComment).toHaveBeenCalledWith({
      scopeType: 'dashboard',
      dashboardId: 42,
      sliceId: undefined,
      body: 'new comment',
    });
  });

  test('cancel clears composer draft', async () => {
    render(<CommentsDrawer dashboardId={42} />, {
      useRedux: true,
      useRouter: true,
    });

    await openDrawer({
      scopeType: 'dashboard',
      dashboardId: 42,
    });

    const input = (await screen.findByPlaceholderText(
      'Write a comment...',
    )) as HTMLTextAreaElement;
    userEvent.type(input, 'draft text');
    userEvent.click(screen.getAllByText('Cancel')[0]);

    expect(input.value).toBe('');
  });

  test('replies to selected thread id instead of creating top-level comment', async () => {
    render(<CommentsDrawer dashboardId={42} />, {
      useRedux: true,
      useRouter: true,
    });

    mockedListComments.mockResolvedValue({
      count: 4,
      page: 0,
      page_size: 200,
      result: [
        samplePinnedThreadA,
        samplePinnedReplyA,
        samplePinnedThreadB,
        samplePinnedReplyB,
      ],
    });

    await openDrawer({
      scopeType: 'dashboard',
      dashboardId: 42,
      threadId: 102,
    });

    expect(await screen.findByText('pin thread B')).toBeInTheDocument();
    expect(screen.queryByText('pin thread A')).not.toBeInTheDocument();
    expect(screen.queryByText('reply A')).not.toBeInTheDocument();
    expect(await screen.findByText('reply B')).toBeInTheDocument();

    const input = await screen.findByPlaceholderText('Reply to this thread...');
    userEvent.type(input, 'reply only for thread');
    userEvent.click(screen.getAllByText('Submit')[0]);

    expect(mockedReplyToComment).toHaveBeenCalledWith(
      102,
      'reply only for thread',
    );
    expect(mockedCreateComment).not.toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'reply only for thread',
      }),
    );
  });

  test('shows dashboard pin threads in chart drawer when chart has no pins', async () => {
    render(<CommentsDrawer dashboardId={42} />, {
      useRedux: true,
      useRouter: true,
    });

    mockedListComments
      .mockResolvedValueOnce({
        count: 0,
        page: 0,
        page_size: 200,
        result: [],
      })
      .mockResolvedValueOnce({
        count: 2,
        page: 0,
        page_size: 200,
        result: [sampleDashboardPinnedThread, sampleDashboardPinnedReply],
      });

    await openDrawer({
      scopeType: 'chart',
      dashboardId: 42,
      sliceId: 7,
    });

    expect(await screen.findByText('dashboard pin thread')).toBeInTheDocument();
    expect(screen.queryByText('No pins yet')).not.toBeInTheDocument();
    expect(mockedFilterDashboardPinsForChart).toHaveBeenCalledWith(
      expect.any(Array),
      7,
    );
  });

  test('shows top-level delete pin action for selected chart thread', async () => {
    render(<CommentsDrawer dashboardId={42} />, {
      useRedux: true,
      useRouter: true,
    });

    mockedListComments.mockResolvedValue({
      count: 2,
      page: 0,
      page_size: 200,
      result: [samplePinnedThreadA, samplePinnedReplyA],
    });

    await openDrawer({
      scopeType: 'chart',
      dashboardId: 42,
      sliceId: 7,
      threadId: 101,
    });

    expect(await screen.findByText('Delete pin')).toBeInTheDocument();
  });
});

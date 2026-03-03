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

import { Comment } from './api';

function hasValidRect(rect: DOMRect | ClientRect): boolean {
  return rect.width > 0 && rect.height > 0;
}

export function filterDashboardPinsForChart(
  pins: Comment[],
  sliceId?: number,
): Comment[] {
  if (!sliceId) {
    return [];
  }

  // Prefer explicit chart linkage if available.
  const explicitScopePins = pins.filter(pin => pin.slice_id === sliceId);
  if (explicitScopePins.length > 0) {
    return explicitScopePins;
  }

  if (typeof document === 'undefined') {
    return [];
  }

  const chartElement = document.querySelector(
    `.dashboard-chart-id-${sliceId}`,
  ) as HTMLElement | null;
  const dashboardOverlay = document.querySelector(
    '[data-test="dashboard-pin-overlay"]',
  ) as HTMLElement | null;

  if (!chartElement || !dashboardOverlay) {
    return [];
  }

  const chartRect = chartElement.getBoundingClientRect();
  const overlayRect = dashboardOverlay.getBoundingClientRect();
  if (!hasValidRect(chartRect) || !hasValidRect(overlayRect)) {
    return [];
  }

  return pins.filter(pin => {
    if (pin.x_pct === null || pin.y_pct === null) {
      return false;
    }
    const pinX = overlayRect.left + pin.x_pct * overlayRect.width;
    const pinY = overlayRect.top + pin.y_pct * overlayRect.height;
    return (
      pinX >= chartRect.left &&
      pinX <= chartRect.right &&
      pinY >= chartRect.top &&
      pinY <= chartRect.bottom
    );
  });
}

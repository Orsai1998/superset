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

import { CSSProperties } from 'react';
import { css, styled } from '@superset-ui/core';
import { rgba } from 'emotion-rgba';

const PinButton = styled.button<{ resolved: boolean }>`
  ${({ theme, resolved }) => css`
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid
      ${resolved ? theme.colors.grayscale.light1 : theme.colors.primary.base};
    background: ${resolved
      ? theme.colors.grayscale.light2
      : theme.colors.primary.base};
    color: ${theme.colors.grayscale.light5};
    font-size: 10px;
    font-weight: ${theme.typography.weights.bold};
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 8px ${rgba(theme.colors.grayscale.dark2, 0.25)};
    transform: translate(-50%, -50%);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
    padding: 0;
    user-select: none;
    z-index: 11;

    &:hover {
      transform: translate(-50%, -50%) scale(1.2);
      box-shadow: 0 4px 12px ${rgba(theme.colors.grayscale.dark2, 0.3)};
    }
  `}
`;

type PinProps = {
  index: number | string;
  resolved: boolean;
  style: CSSProperties;
  onClick: (e: React.MouseEvent) => void;
};

const Pin = ({ index, resolved, style, onClick }: PinProps) => (
  <PinButton
    type="button"
    resolved={resolved}
    style={style}
    onClick={onClick}
    aria-label={`Comment pin ${index}`}
  >
    {index}
  </PinButton>
);

export { Pin };

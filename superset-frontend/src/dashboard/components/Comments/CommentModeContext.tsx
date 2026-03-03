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
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  COMMENT_MODE_ENTER_EVENT,
  COMMENT_MODE_EXIT_EVENT,
  CommentModeScope,
} from './events';

type CommentModeContextType = {
  activeScope: CommentModeScope | null;
  enterCommentMode: (scope: CommentModeScope) => void;
  exitCommentMode: () => void;
};

const CommentModeContext = createContext<CommentModeContextType>({
  activeScope: null,
  enterCommentMode: () => {},
  exitCommentMode: () => {},
});

type CommentModeProviderProps = {
  children: ReactNode;
};

const CommentModeProvider: FC<CommentModeProviderProps> = ({ children }) => {
  const [activeScope, setActiveScope] = useState<CommentModeScope | null>(null);

  const enterCommentMode = useCallback((scope: CommentModeScope) => {
    setActiveScope(scope);
  }, []);

  const exitCommentMode = useCallback(() => {
    setActiveScope(null);
  }, []);

  const contextValue = useMemo(
    () => ({ activeScope, enterCommentMode, exitCommentMode }),
    [activeScope, enterCommentMode, exitCommentMode],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleEnter = (event: Event) => {
      const custom = event as CustomEvent<CommentModeScope>;
      if (custom.detail) {
        setActiveScope(custom.detail);
      }
    };

    const handleExit = () => {
      setActiveScope(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveScope(null);
      }
    };

    window.addEventListener(COMMENT_MODE_ENTER_EVENT, handleEnter);
    window.addEventListener(COMMENT_MODE_EXIT_EVENT, handleExit);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener(COMMENT_MODE_ENTER_EVENT, handleEnter);
      window.removeEventListener(COMMENT_MODE_EXIT_EVENT, handleExit);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <CommentModeContext.Provider value={contextValue}>
      {children}
    </CommentModeContext.Provider>
  );
};

function useCommentMode(): CommentModeContextType {
  return useContext(CommentModeContext);
}

export { CommentModeContext, CommentModeProvider, useCommentMode };
export type { CommentModeScope };

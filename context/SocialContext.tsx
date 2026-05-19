import React from 'react';
import { LogProvider, useLogs } from '@/context/LogContext';
import { ReviewProvider, useReviews } from '@/context/ReviewContext';
import { FollowProvider, useFollow } from '@/context/FollowContext';

// This is now a "Composite Context" that aggregates the modular contexts
// to maintain backward compatibility during the migration phase.
export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LogProvider>
      <ReviewProvider>
        <FollowProvider>
          {children}
        </FollowProvider>
      </ReviewProvider>
    </LogProvider>
  );
};

export const useSocial = () => {
  const logs = useLogs();
  const reviews = useReviews();
  const follow = useFollow();

  return {
    ...logs,
    ...reviews,
    ...follow,
    // Map refreshLogs to the name expected by legacy code
    refreshLogs: logs.refreshLogs,
    userLogs: logs.userLogs,
    loadingLogs: logs.loadingLogs,
  };
};

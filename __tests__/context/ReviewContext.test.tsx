/**
 * Tests: context/ReviewContext.tsx
 * Focus: getComments, addComment methods
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

// We'll test the logic via a simple consumer component
import { ReviewProvider, useReviews } from '../../context/ReviewContext';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';

// ── Helpers ─────────────────────────────────────────────────────────────────

function TestConsumer({ reviewId }: { reviewId: string }) {
  const { getComments } = useReviews();
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    getComments(reviewId).then((list) => setCount(list.length));
  }, [reviewId, getComments]);

  return <Text testID="comment-count">{count ?? 'loading'}</Text>;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ReviewProvider>{children}</ReviewProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ReviewContext — getComments', () => {
  it('returns an empty array when there are no comments', async () => {
    const { getByTestId } = render(
      <Wrapper>
        <TestConsumer reviewId="fake-review-id" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(getByTestId('comment-count').props.children).toBe(0);
    });
  });
});

describe('ReviewContext — addComment', () => {
  it('returns false when user is not logged in', async () => {
    let result: boolean | null = null;

    function AddCommentConsumer() {
      const { addComment } = useReviews();
      React.useEffect(() => {
        addComment('fake-review-id', 'Test comment').then((r) => { result = r; });
      }, [addComment]);
      return null;
    }

    render(
      <Wrapper>
        <AddCommentConsumer />
      </Wrapper>
    );

    await waitFor(() => {
      expect(result).toBe(false);
    });
  });
});

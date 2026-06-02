/**
 * Tests: context/FavoritesContext.tsx
 * Focus: Favorites Context hooks and operations
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { FavoritesProvider, useFavorites } from '../../context/FavoritesContext';
import { AuthProvider } from '../../context/AuthContext';

function FavoriteChecker({ movieId }: { movieId: number }) {
  const { isFavorite } = useFavorites();
  const fav = isFavorite(movieId);
  return <Text testID="favorite-state">{fav ? 'favorite' : 'not-favorite'}</Text>;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </AuthProvider>
  );
}

describe('FavoritesContext — isFavorite', () => {
  it('returns false for a movie that is not favorited', async () => {
    const { getByTestId } = render(
      <Wrapper>
        <FavoriteChecker movieId={9999} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(getByTestId('favorite-state').props.children).toBe('not-favorite');
    });
  });
});

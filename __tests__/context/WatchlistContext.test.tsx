/**
 * Tests: context/WatchlistContext.tsx
 * Focus: isEpisodeWatched, tv episode state management
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

import { WatchlistProvider, useWatchlist } from '../../context/WatchlistContext';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';

// ── Helpers ─────────────────────────────────────────────────────────────────

function EpisodeChecker({ tvId, season, episode }: { tvId: number; season: number; episode: number }) {
  const { isEpisodeWatched } = useWatchlist();
  const watched = isEpisodeWatched(tvId, season, episode);
  return <Text testID="watched-state">{watched ? 'watched' : 'not-watched'}</Text>;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WatchlistProvider>{children}</WatchlistProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('WatchlistContext — isEpisodeWatched', () => {
  it('returns false for an episode with no tracked data', async () => {
    const { getByTestId } = render(
      <Wrapper>
        <EpisodeChecker tvId={123456} season={1} episode={1} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(getByTestId('watched-state').props.children).toBe('not-watched');
    });
  });
});

describe('WatchlistContext — fetchWatchedEpisodes', () => {
  it('initializes watchedEpisodesMap as empty for an unauthenticated user', async () => {
    let mapKeys: string[] = [];

    function MapConsumer() {
      const { watchedEpisodesMap } = useWatchlist();
      mapKeys = Object.keys(watchedEpisodesMap);
      return null;
    }

    render(
      <Wrapper>
        <MapConsumer />
      </Wrapper>
    );

    await waitFor(() => {
      expect(mapKeys).toHaveLength(0);
    });
  });
});

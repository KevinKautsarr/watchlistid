/**
 * Tests: components/common/RatingBadge.tsx
 * Pure presentational component — renders a rating to one decimal place.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import RatingBadge from '../../components/common/RatingBadge';

describe('RatingBadge', () => {
  it('renders the rating with one decimal place', () => {
    const { getByText } = render(<RatingBadge rating={7.5} />);
    expect(getByText('7.5')).toBeTruthy();
  });

  it('rounds to one decimal place', () => {
    const { getByText } = render(<RatingBadge rating={8.27} />);
    expect(getByText('8.3')).toBeTruthy();
  });

  it('renders an integer rating with a trailing .0', () => {
    const { getByText } = render(<RatingBadge rating={9} size="sm" />);
    expect(getByText('9.0')).toBeTruthy();
  });
});

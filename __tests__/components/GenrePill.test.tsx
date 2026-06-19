/**
 * Tests: components/common/GenrePill.tsx
 * Pure presentational component — renders a label and fires onPress.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GenrePill from '../../components/common/GenrePill';

describe('GenrePill', () => {
  it('renders its label', () => {
    const { getByText } = render(<GenrePill label="Action" />);
    expect(getByText('Action')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<GenrePill label="Comedy" onPress={onPress} />);
    fireEvent.press(getByText('Comedy'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

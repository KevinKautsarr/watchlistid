import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';

interface ProfileAnalyticsChartsProps {
  userId: string;
}

export default function ProfileAnalyticsCharts({ userId }: ProfileAnalyticsChartsProps) {
  return (
    <View style={s.container}>
      <ActivityHeatmap userId={userId} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingTop: Spacing.xl,
  },
});

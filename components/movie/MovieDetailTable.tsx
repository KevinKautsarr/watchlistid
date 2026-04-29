import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Calendar, Clock, Globe, Info, DollarSign, Activity, Building2 } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { Movie } from '../../types';

interface MovieDetailTableProps {
  movie: Movie;
}

const TableRow = ({ 
  label, 
  value, 
  Icon 
}: { 
  label: string; 
  value: string | number | undefined;
  Icon: React.FC<any>;
}) => (
  <View style={styles.row}>
    <View style={styles.labelCol}>
      <Icon size={14} color={Colors.text.secondary} strokeWidth={2} />
      <Text style={styles.label} allowFontScaling={false}>{label}</Text>
    </View>
    <Text style={styles.value} allowFontScaling={false}>{value || 'N/A'}</Text>
  </View>
);

const MovieDetailTable: React.FC<MovieDetailTableProps> = ({ movie }) => {
  return (
    <View style={styles.container}>
      <TableRow 
        label="Release" 
        value={movie.release_date} 
        Icon={Calendar}
      />
      <TableRow 
        label="Language" 
        value={movie.original_language?.toUpperCase()} 
        Icon={Globe}
      />
      <TableRow 
        label="Runtime" 
        value={movie.runtime ? `${movie.runtime} min` : undefined} 
        Icon={Clock}
      />
      <TableRow 
        label="Budget" 
        value={movie.budget ? `$${movie.budget.toLocaleString()}` : undefined} 
        Icon={DollarSign}
      />
      <TableRow 
        label="Revenue" 
        value={movie.revenue ? `$${movie.revenue.toLocaleString()}` : undefined} 
        Icon={DollarSign}
      />
      <TableRow 
        label="Status" 
        value={movie.status} 
        Icon={Activity}
      />
      <TableRow 
        label="Production" 
        value={movie.production_companies?.map(c => c.name).slice(0, 1).join(', ')} 
        Icon={Building2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: Colors.dark, shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 130,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  value: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'right',
  },
});

export default MovieDetailTable;

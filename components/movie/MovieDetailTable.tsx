import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Calendar, Clock, Globe, Info, DollarSign, Activity, Building2 } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../constants/theme';
import { Movie } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface MovieDetailTableProps {
  movie: Movie;
}

const DetailCard = ({ 
  label, 
  value, 
  Icon 
}: { 
  label: string; 
  value: string | number | undefined;
  Icon: React.FC<any>;
}) => {
  if (!value || value === 'N/A' || value === '$0') return null;
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon size={14} color={Colors.primary} strokeWidth={2.5} />
        <Text style={styles.label} allowFontScaling={false}>{label}</Text>
      </View>
      <Text style={styles.value} allowFontScaling={false} numberOfLines={2}>{value}</Text>
    </View>
  );
};

const MovieDetailTable: React.FC<MovieDetailTableProps> = ({ movie }) => {
  const { t } = useLanguage();
  return (
    <View style={styles.grid}>
      <DetailCard 
        label={t('metaReleaseDate')} 
        value={movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : undefined} 
        Icon={Calendar}
      />
      <DetailCard 
        label={t('metaLanguage')} 
        value={movie.original_language?.toUpperCase()} 
        Icon={Globe}
      />
      <DetailCard 
        label={t('metaRuntime')} 
        value={movie.runtime ? `${movie.runtime} ${t('minutes')}` : undefined} 
        Icon={Clock}
      />
      <DetailCard 
        label={t('metaStatus')} 
        value={movie.status} 
        Icon={Activity}
      />
      <DetailCard 
        label={t('metaBudget')} 
        value={movie.budget ? `$${(movie.budget / 1000000).toFixed(1)}M` : undefined} 
        Icon={DollarSign}
      />
      <DetailCard 
        label={t('metaRevenue')} 
        value={movie.revenue ? `$${(movie.revenue / 1000000).toFixed(1)}M` : undefined} 
        Icon={DollarSign}
      />
      <View style={styles.fullWidthCard}>
        <DetailCard 
          label={t('metaProduction')} 
          value={movie.production_companies?.map(c => c.name).join(' • ')} 
          Icon={Building2}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '47%', // roughly half width with gap
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fullWidthCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    lineHeight: 20,
  },
});

export default MovieDetailTable;

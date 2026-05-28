import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, IconSize, Spacing, TMDB_IMAGE_SIZES } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';

interface PersonCardProps {
  person: {
    profile_path?: string;
    name: string;
    known_for_department?: string;
    known_for?: any[];
  };
  onPress: () => void;
  t: any;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, onPress, t }) => {
  const uri = person.profile_path ? `${TMDB_IMAGE_SIZES.thumb}${person.profile_path}` : null;
  
  return (
    <TouchableOpacity style={[styles.personRow, cursorPointer]} onPress={onPress} activeOpacity={0.75}>
      {uri ? (
        <Image source={{uri}} style={styles.personImg} />
      ) : (
        <View style={[styles.personImg, styles.personPholder]}>
          <User size={IconSize.lg} color={Colors.primary} strokeWidth={1.5} />
        </View>
      )}
      <View style={{flex: 1}}>
        <Text style={styles.personName} numberOfLines={1} allowFontScaling={false}>
          {person.name}
        </Text>
        <Text style={styles.personDept} numberOfLines={1} allowFontScaling={false}>
          {person.known_for_department === 'Acting' ? t('actor') : (person.known_for_department ?? t('actor'))}
          {person.known_for?.[0] ? ` · ${person.known_for[0]?.title ?? person.known_for[0]?.name ?? ""}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  personRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.xl, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.overlay.light, gap: Spacing.md },
  personImg: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surface },
  personPholder: { alignItems: "center", justifyContent: "center" },
  personName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },
  personDept: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 3 },
});

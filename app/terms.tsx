import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, FileText, UserCheck, AlertTriangle, Copyright, Scale } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';

export default function TermsScreen() {
  const router = useRouter();

  const sections = [
    {
      title: 'User Conduct',
      icon: UserCheck,
      content: 'Be kind. Do not post reviews or bios that contain hate speech, harassment, or offensive content. We reserve the right to remove any content that violates these rules.'
    },
    {
      title: 'Movie Data',
      icon: Copyright,
      content: 'Movie data, posters, and imagery are provided by TMDB (The Movie Database). While we strive for accuracy, we cannot guarantee that all information is perfect.'
    },
    {
      title: 'Disclaimer',
      icon: AlertTriangle,
      content: 'WatchlistID is provided "as is." We are not liable for any loss of data or service interruptions. Use the app as your personal movie tracking companion.'
    },
    {
      title: 'Account Termination',
      icon: Scale,
      content: 'We reserve the right to terminate accounts that repeatedly violate our community standards or attempt to compromise the security of our services.'
    }
  ];

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={s.safeArea}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={28} color={Colors.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Terms of Service</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.intro}>
            <View style={s.iconCircle}>
              <FileText size={32} color={Colors.primary} />
            </View>
            <Text style={s.introTitle}>Terms of Service</Text>
            <Text style={s.introSub}>By using WatchlistID, you agree to follow these simple rules to keep our community safe and enjoyable for everyone.</Text>
          </View>

          {sections.map((section, i) => (
            <View key={i} style={s.section}>
              <View style={s.sectionHeader}>
                <section.icon size={20} color={Colors.primary} />
                <Text style={s.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={s.sectionText}>{section.content}</Text>
            </View>
          ))}

          <View style={s.footer}>
            <Text style={s.lastUpdated}>Effective Date: May 2026</Text>
            <Text style={s.footerNote}>Continuing to use WatchlistID constitutes acceptance of these terms.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: 18, fontWeight: FontWeight.black, color: Colors.white },
  headerRight: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 60 },
  intro: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(229,9,20,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  introTitle: { fontSize: 24, fontWeight: FontWeight.black, color: Colors.white, marginBottom: 8 },
  introSub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  section: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius.xl, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white },
  sectionText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
  footer: { marginTop: 24, alignItems: 'center' },
  lastUpdated: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  footerNote: { fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Shield, Eye, Lock, Trash2, Globe } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';

export default function PrivacyScreen() {
  const router = useRouter();

  const sections = [
    {
      title: 'Data We Collect',
      icon: Eye,
      content: 'We collect your email address, username, profile picture, and your movie activity (logs, ratings, and watchlists) to provide our core services.'
    },
    {
      title: 'How We Use Data',
      icon: Globe,
      content: 'Your data is used to personalize your profile, generate your cinematic statistics, and enable social features like followers and shared lists.'
    },
    {
      title: 'Data Security',
      icon: Lock,
      content: 'We use secure cloud infrastructure (Supabase) to store and protect your personal information. Your password is never stored in plain text.'
    },
    {
      title: 'Your Rights',
      icon: Trash2,
      content: 'You have full control over your data. You can edit your profile or delete your account and all associated data at any time from your settings.'
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
          <Text style={s.headerTitle}>Privacy Policy</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.intro}>
            <View style={s.iconCircle}>
              <Shield size={32} color={Colors.primary} />
            </View>
            <Text style={s.introTitle}>Your Privacy Matters</Text>
            <Text style={s.introSub}>At WatchlistID, we believe in radical transparency about how your data is handled.</Text>
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
            <Text style={s.lastUpdated}>Last Updated: May 2026</Text>
            <Text style={s.contact}>Questions? Contact us at kevinkautsar6@gmail.com</Text>
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
  contact: { fontSize: 13, color: Colors.primary, fontWeight: FontWeight.medium },
});

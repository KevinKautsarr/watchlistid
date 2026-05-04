import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Share, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Globe, Twitter, Shield, FileText, Heart, Film, Github, ExternalLink } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Join me on WatchlistID and start your cinematic journey today! 🎬 https://watchlistid.com',
        title: 'WatchlistID',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={s.safeArea}>
        <View style={s.header}>
          <TouchableOpacity 
            style={s.backBtn} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color={Colors.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('about')}</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView 
          style={s.scroll} 
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero / Logo Section */}
          <View style={s.hero}>
            <View style={s.logoContainer}>
              <View style={s.logoIcon}>
                <Film color="#FFFFFF" size={40} strokeWidth={2.5} />
              </View>
            </View>
            <Text style={s.appName}>WatchlistID</Text>
            <Text style={s.version}>Version 1.0.0 (Build 42)</Text>
            <Text style={s.tagline}>{t('authTagline') || 'Your personal movie universe'}</Text>
          </View>

          {/* Description Section */}
          <View style={s.section}>
            <Text style={s.description}>
              WatchlistID is more than just a list. It's your personal cinematic memory. Track every movie and show you watch, rate your favorites, and discover your next obsession.
            </Text>
          </View>

          {/* Main Links */}
          <View style={s.linkSection}>
            <TouchableOpacity style={s.linkItem} onPress={() => handleOpenLink('https://watchlistid.com')}>
              <View style={[s.linkIconBox, { backgroundColor: 'rgba(66,133,244,0.1)' }]}>
                <Globe size={20} color="#4285F4" />
              </View>
              <Text style={s.linkLabel}>Official Website</Text>
              <ExternalLink size={16} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>

            <TouchableOpacity style={s.linkItem} onPress={handleShareApp}>
              <View style={[s.linkIconBox, { backgroundColor: 'rgba(229,9,20,0.1)' }]}>
                <Heart size={20} color={Colors.primary} />
              </View>
              <Text style={s.linkLabel}>Share WatchlistID</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          </View>

          {/* Legal Section */}
          <View style={s.legalSection}>
            <Text style={s.sectionTitle}>LEGAL</Text>
            <View style={s.legalBox}>
              <TouchableOpacity style={s.legalItem} onPress={() => router.push('/privacy')}>
                <Shield size={18} color="rgba(255,255,255,0.4)" />
                <Text style={s.legalLabel}>Privacy Policy</Text>
              </TouchableOpacity>
              <View style={s.legalDivider} />
              <TouchableOpacity style={s.legalItem} onPress={() => router.push('/terms')}>
                <FileText size={18} color="rgba(255,255,255,0.4)" />
                <Text style={s.legalLabel}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>© 2026 WatchlistID Team</Text>
            <Text style={s.footerSubText}>Made with ❤️ for cinema lovers</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Reuse some styles for consistency
const ChevronRight = ({ size, color }: { size: number, color: string }) => (
  <View style={{ transform: [{ rotate: '-180deg' }] }}>
    <ChevronLeft size={size} color={color} />
  </View>
);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  header: { 
    height: 56, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.md 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  headerTitle: { fontSize: 18, fontWeight: FontWeight.black, color: Colors.white },
  headerRight: { width: 40 },
  
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 60 },

  hero: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 28, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    padding: 2, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20
  },
  logoIcon: { 
    flex: 1, 
    backgroundColor: Colors.primary, 
    borderRadius: 25, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15 },
      android: { elevation: 12 }
    })
  },
  appName: { fontSize: 28, fontWeight: FontWeight.black, color: Colors.white, marginBottom: 4 },
  version: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: FontWeight.bold, letterSpacing: 0.5, marginBottom: 12 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },

  section: { marginBottom: 32 },
  description: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 24 },

  linkSection: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: Radius.xxl, 
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32
  },
  linkItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    gap: 16 
  },
  linkIconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  linkLabel: { flex: 1, fontSize: 16, color: Colors.white, fontWeight: FontWeight.medium },

  legalSection: { marginBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: FontWeight.black, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, marginBottom: 12, paddingLeft: 4 },
  legalBox: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: Radius.xl, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  legalItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  legalLabel: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: FontWeight.medium },
  legalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16 },

  footer: { alignItems: 'center' },
  footerText: { fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: FontWeight.bold, marginBottom: 4 },
  footerSubText: { fontSize: 11, color: 'rgba(255,255,255,0.1)' },
});

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Animated,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Mail, ArrowLeft, Send, Sparkles } from "lucide-react-native";

import { supabase } from "../../supabase";
import { getAuthRedirectUrl } from "@/utils/authRedirect";
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  FontWeight,
  Shadow,
} from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";

const LOGO_WEB = require("../../assets/images/icon.png");

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();

  // Dynamic dimension tracking for absolute web responsiveness
  const [dims, setDims] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setDims(window);
    });
    return () => sub.remove();
  }, []);

  const isDesktop = dims.width >= 900;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Animated values for premium micro-interactions
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleReset = async () => {
    setError(null);
    if (!email.trim()) {
      setError(t("emailRequired"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    // Runtime-correct callback URL (NOT __DEV__, which is true even in prod web)
    const resetRedirect = getAuthRedirectUrl();

    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: resetRedirect }
    );
    setLoading(false);

    if (err) {
      setError(err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    }
  };

  const animateEmailFocus = (focused: boolean) => {
    Animated.timing(emailBorderAnim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const emailBorderColor = emailBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", Colors.primary],
  });

  // ── Shareable Form / Success Container ─────────────────────────────────────
  const FormContent = (
    <Animated.View
      style={[
        isDesktop ? s.desktopFormContainer : s.card,
        {
          opacity: formOpacity,
          transform: [{ translateY: formTranslateY }],
        },
      ]}
    >
      {sent ? (
        // ── SUCCESS STATE ──
        <View style={s.sentWrap}>
          <Text style={s.sentEmoji}>📬</Text>
          <Text style={s.sentTitle} maxFontSizeMultiplier={1.3}>
            {t("emailSent")}
          </Text>
          <Text style={s.sentSub} maxFontSizeMultiplier={1.3}>
            {t("checkInboxForReset").replace("{email}", email)}
          </Text>
          <TouchableOpacity
            style={s.backToLoginBtn}
            onPress={() => router.replace("/auth/login")}
            activeOpacity={0.85}
          >
            <Text style={s.backToLoginText} maxFontSizeMultiplier={1.3}>
              {t("backToLogin")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ── REQUEST FORM STATE ──
        <>
          {!isDesktop && (
            <View style={s.formHeader}>
              <View style={s.welcomeBadge}>
                <Sparkles size={14} color={Colors.primary} strokeWidth={2.5} />
                <Text style={s.welcomeBadgeText} maxFontSizeMultiplier={1.3}>
                  {language === "id" ? "Pemulihan Akun" : "Account Recovery"}
                </Text>
              </View>
            </View>
          )}

          <Text
            style={[s.formTitle, { textAlign: isDesktop ? "left" : "center" }]}
            maxFontSizeMultiplier={1.3}
          >
            {t("forgotPasswordTitle")}
          </Text>
          <Text
            style={[s.formSub, { textAlign: isDesktop ? "left" : "center" }]}
            maxFontSizeMultiplier={1.3}
          >
            {t("forgotPasswordDesc")}
          </Text>

          {/* Email input with animated border */}
          <View style={s.inputWrapper}>
            <Text style={s.inputLabel} maxFontSizeMultiplier={1.3}>
              {t("email")}
            </Text>
            <Animated.View
              style={[s.inputContainer, { borderColor: emailBorderColor }]}
            >
              <Mail
                size={18}
                color="rgba(255, 255, 255, 0.4)"
                strokeWidth={2}
              />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                onFocus={() => animateEmailFocus(true)}
                onBlur={() => animateEmailFocus(false)}
                placeholder={
                  language === "id" ? "nama@email.com" : "name@email.com"
                }
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxFontSizeMultiplier={1.3}
              />
            </Animated.View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText} maxFontSizeMultiplier={1.3}>
                ⚠️ {error}
              </Text>
            </View>
          )}

          {/* Submit button with spring scale */}
          <Pressable
            onPressIn={() => {
              Animated.spring(buttonScale, {
                toValue: 0.96,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(buttonScale, {
                toValue: 1,
                useNativeDriver: true,
              }).start();
            }}
            onPress={handleReset}
            disabled={loading}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <LinearGradient
                colors={[Colors.primary, "#C5050F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.btn, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Send size={18} color={Colors.white} strokeWidth={2.5} />
                    <Text style={s.btnText} maxFontSizeMultiplier={1.3}>
                      {language === "id" ? "Kirim Tautan" : "Send Reset Link"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          </Pressable>

          {/* Return to login link */}
          <TouchableOpacity
            style={s.backLinkBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={Colors.primary} strokeWidth={2.5} />
            <Text style={s.backLinkText} maxFontSizeMultiplier={1.3}>
              {t("backToLogin")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#050505", "#0c0c0c"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Absolute header back navigation for mobile layout */}
        {!isDesktop && (
          <TouchableOpacity
            style={s.backBtnMobile}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        <ScrollView
          contentContainerStyle={isDesktop ? s.scrollDesktop : s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isDesktop ? (
            /* ── DESKTOP SPLIT VIEW ── */
            <View style={s.desktopContainer}>
              {/* LEFT SIDE: Slogan, badges, ambient orbs */}
              <View style={s.leftSection}>
                <View style={[s.orb, s.orb1]} />
                <View style={[s.orb, s.orb2]} />

                <Animated.View
                  style={[
                    s.leftContent,
                    {
                      opacity: logoOpacity,
                      transform: [{ scale: logoScale }],
                    },
                  ]}
                >
                  <Image
                    source={LOGO_WEB}
                    style={s.webLogo}
                    contentFit="contain"
                  />

                  <Text style={s.brandLogo} maxFontSizeMultiplier={1.3}>
                    WatchList<Text style={{ color: Colors.primary }}>ID</Text>
                  </Text>

                  <Text style={s.heroTitle} maxFontSizeMultiplier={1.3}>
                    {language === "id" ? (
                      <>
                        Rancang daftar tontonan impian Anda dan jelajahi rekomendasi{" "}
                        <Text style={s.gradientText}>sinema terbaik</Text> dunia.
                      </>
                    ) : (
                      <>
                        Build your dream watchlist and explore the world's{" "}
                        <Text style={s.gradientText}>best cinema</Text> recommendations.
                      </>
                    )}
                  </Text>

                </Animated.View>
              </View>

              {/* VERTICAL DIVIDER */}
              <View style={s.verticalDivider} />

              {/* RIGHT SIDE: Reset Request Form */}
              <View style={s.rightSection}>
                {FormContent}

                <View style={s.footerBrand}>
                  <Text style={s.footerText} maxFontSizeMultiplier={1.3}>
                    🍿 WatchlistID © 2026
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* ── MOBILE VIEW ── */
            <>
              <Animated.View
                style={[
                  s.logoWrap,
                  {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                  },
                ]}
              >
                <Image
                  source={LOGO_WEB}
                  style={s.mobileLogo}
                  contentFit="contain"
                />
                <Text style={s.logo} maxFontSizeMultiplier={1.3}>
                  WatchList<Text style={s.logoAccent}>ID</Text>
                </Text>
              </Animated.View>

              {FormContent}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  scrollDesktop: {
    flexGrow: 1,
    backgroundColor: "#0a0a0a",
  },

  // Desktop Split Layout
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
    minHeight: "100vh" as any,
  },
  leftSection: {
    flex: 1.2,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60,
    position: "relative",
    overflow: "hidden",
  },
  leftContent: {
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
    zIndex: 2,
  },
  webLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  brandLogo: {
    fontSize: 56,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: -2,
    marginBottom: 36,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    lineHeight: 46,
    letterSpacing: -0.5,
    marginBottom: 48,
  },
  gradientText: {
    color: Colors.primary,
    fontWeight: "900",
  },
  featureBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  featureBadgeIcon: { fontSize: 16 },
  featureBadgeText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },

  // Gradient orbs
  orb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.12,
  },
  orb1: {
    width: 500,
    height: 500,
    backgroundColor: Colors.primary,
    top: -150,
    right: -150,
    ...Platform.select({
      web: { filter: "blur(100px)" } as any,
    }),
  },
  orb2: {
    width: 400,
    height: 400,
    backgroundColor: "#C5050F",
    bottom: -100,
    left: -100,
    ...Platform.select({
      web: { filter: "blur(100px)" } as any,
    }),
  },

  verticalDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  rightSection: {
    flex: 1,
    backgroundColor: "#0c0c0c",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  desktopFormContainer: {
    width: "100%",
    maxWidth: 380,
  },

  // Mobile navigation
  backBtnMobile: {
    position: "absolute",
    top: 24,
    left: Spacing.xl,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  mobileLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  logo: {
    fontSize: 34,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: -1,
  },
  logoAccent: { color: Colors.primary },

  // Glassmorphic Card
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: "rgba(28, 28, 30, 0.85)",
    borderRadius: 24,
    padding: 24,
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      } as any,
    }),
  },
  formHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(229, 9, 20, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(229, 9, 20, 0.2)",
  },
  welcomeBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  formSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 28,
    lineHeight: 20,
    fontWeight: "500",
  },

  // Form Fields
  inputWrapper: {
    marginBottom: 24,
    width: "100%",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: "500",
  },

  errorBox: {
    backgroundColor: "rgba(220,53,69,0.12)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(220,53,69,0.3)",
  },
  errorText: {
    fontSize: 13,
    color: "#ff6b7a",
    fontWeight: "600",
    textAlign: "center",
  },

  btn: {
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...Shadow.md,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },

  backLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "700",
  },

  // Success view details
  sentWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  sentEmoji: { fontSize: 64, marginBottom: Spacing.xl },
  sentTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.black,
    color: Colors.white,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  sentSub: {
    fontSize: FontSize.base,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  backToLoginBtn: {
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },

  footerBrand: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.3)",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

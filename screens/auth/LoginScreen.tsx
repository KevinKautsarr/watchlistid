import EmptyStateIcon from "@/components/common/EmptyStateIcon";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, LogIn, Mail, Sparkles } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CaptchaModal from "@/components/auth/CaptchaModal";
import {
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing
} from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const LOGO_WEB = require("../../assets/images/icon.png");

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
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
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  // Animated values for high-end micro-interactions
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;
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

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError(t("emailPasswordRequired"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(language === "id" ? "Format email tidak valid." : "Invalid email format.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError(null);
    setShowCaptcha(true);
  };

  const onCaptchaVerified = async (token: string) => {
    setShowCaptcha(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const err = await signIn(email.trim().toLowerCase(), password, token);
    setLoading(false);
    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGoogleLoading(true);
    setError(null);
    const err = await signInWithGoogle();
    setGoogleLoading(false);

    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const animateEmailFocus = (focused: boolean) => {
    Animated.timing(emailBorderAnim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const animatePasswordFocus = (focused: boolean) => {
    Animated.timing(passwordBorderAnim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const emailBorderColor = emailBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", Colors.primary],
  });

  const passwordBorderColor = passwordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", Colors.primary],
  });

  // ── Shareable form elements ────────────────────────────────────────────────
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
      {!isDesktop && (
        <View style={s.formHeader}>
          <View style={s.welcomeBadge}>
            <Sparkles size={14} color={Colors.primary} strokeWidth={2.5} />
            <Text style={s.welcomeBadgeText} maxFontSizeMultiplier={1.3}>
              {t("welcomeBack")}
            </Text>
          </View>
        </View>
      )}

      <Text
        style={[s.formTitle, { textAlign: isDesktop ? "left" : "center" }]}
        maxFontSizeMultiplier={1.3}
      >
        {isDesktop
          ? language === "id"
            ? "Masuk ke WatchlistID"
            : "Login to WatchlistID"
          : language === "id"
          ? "Masuk ke Akun Anda"
          : "Sign In to Your Account"}
      </Text>

      {/* Email input with animated border */}
      <View style={s.inputWrapper}>
        <Text style={s.inputLabel} maxFontSizeMultiplier={1.3}>
          {language === "id" ? "Email atau Username" : "Email or Username"}
        </Text>
        <Animated.View
          style={[s.inputContainer, { borderColor: emailBorderColor }]}
        >
          <Mail size={18} color="rgba(255, 255, 255, 0.4)" strokeWidth={2} />
          <TextInput
            style={s.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            onFocus={() => animateEmailFocus(true)}
            onBlur={() => animateEmailFocus(false)}
            placeholder={language === "id" ? "nama@email.com" : "name@email.com"}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxFontSizeMultiplier={1.3}
          />
        </Animated.View>
      </View>

      {/* Password input with animated border */}
      <View style={s.inputWrapper}>
        <View style={s.labelRow}>
          <Text style={s.inputLabel} maxFontSizeMultiplier={1.3}>
            {t("password")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/forgot")}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.forgotTextInline} maxFontSizeMultiplier={1.3}>
              {language === "id" ? "Lupa?" : "Forgot?"}
            </Text>
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[s.inputContainer, { borderColor: passwordBorderColor }]}
        >
          <Lock size={18} color="rgba(255, 255, 255, 0.4)" strokeWidth={2} />
          <TextInput
            style={s.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            onFocus={() => animatePasswordFocus(true)}
            onBlur={() => animatePasswordFocus(false)}
            placeholder="••••••••"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            secureTextEntry={!showPass}
            maxFontSizeMultiplier={1.3}
          />
          <TouchableOpacity
            onPress={() => {
              setShowPass((v) => !v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPass ? (
              <EyeOff
                size={18}
                color="rgba(255, 255, 255, 0.5)"
                strokeWidth={2}
              />
            ) : (
              <Eye size={18} color="rgba(255, 255, 255, 0.5)" strokeWidth={2} />
            )}
          </TouchableOpacity>
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

      {/* Login Button with gradient & spring scale on press */}
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
        onPress={handleLogin}
        disabled={loading || googleLoading}
      >
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <LinearGradient
            colors={[Colors.primary, "#C5050F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.btn, (loading || googleLoading) && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <LogIn size={18} color={Colors.white} strokeWidth={2.5} />
                <Text style={s.btnText} maxFontSizeMultiplier={1.3}>
                  {language === "id" ? "Masuk Sekarang" : "Sign In Now"}
                </Text>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>

      {/* Divider */}
      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText} maxFontSizeMultiplier={1.3}>
          {t("or")}
        </Text>
        <View style={s.dividerLine} />
      </View>

      {/* Google Login Button */}
      <TouchableOpacity
        style={[s.googleBtn, googleLoading && { opacity: 0.7 }]}
        onPress={handleGoogleLogin}
        disabled={loading || googleLoading}
        activeOpacity={0.8}
      >
        <View style={s.googleIconWrapper}>
          {googleLoading ? (
            <ActivityIndicator color={Colors.text.primary} size="small" />
          ) : (
            <EmptyStateIcon name="google" size={20} />
          )}
        </View>
        <Text style={s.googleBtnText} maxFontSizeMultiplier={1.3}>
          {language === "id" ? "Lanjutkan dengan Google" : "Continue with Google"}
        </Text>
      </TouchableOpacity>

      {/* Create Account Link */}
      <View style={s.signupRow}>
        <Text style={s.signupText} maxFontSizeMultiplier={1.3}>
          {t("noAccount")}{" "}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/auth/register");
          }}
          activeOpacity={0.7}
        >
          <Text style={s.signupLink} maxFontSizeMultiplier={1.3}>
            {t("signUpNow")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skip Button */}
      <TouchableOpacity
        style={s.skipBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.replace("/(tabs)");
        }}
        activeOpacity={0.7}
      >
        <Text style={s.skipText} maxFontSizeMultiplier={1.3}>
          {t("skipAndExplore")}
        </Text>
      </TouchableOpacity>
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
        <ScrollView
          contentContainerStyle={isDesktop ? s.scrollDesktop : s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isDesktop ? (
            /* ── DESKTOP SPLIT VIEW (Instagram Inspired Premium Redesign) ── */
            <View style={s.desktopContainer}>
              {/* LEFT SIDE: Minimalist Brand, Logo, and Elegant Typography */}
              <View style={s.leftSection}>
                <Animated.View
                  style={[
                    s.leftContent,
                    {
                      opacity: logoOpacity,
                      transform: [{ scale: logoScale }],
                    },
                  ]}
                >
                  {/* Web logo image above the text */}
                  <Image
                    source={LOGO_WEB}
                    style={s.webLogo}
                    contentFit="contain"
                  />

                  {/* Brand name */}
                  <Text style={s.brandLogo} maxFontSizeMultiplier={1.3}>
                    WatchList<Text style={{ color: Colors.primary }}>ID</Text>
                  </Text>

                  {/* Hero tagline */}
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

              {/* RIGHT SIDE: Instagram-Style Clean Dark Login Form */}
              <View style={s.rightSection}>
                {FormContent}

                {/* Minimalist footer brand */}
                <View style={s.footerBrand}>
                  <Text style={s.footerText} maxFontSizeMultiplier={1.3}>
                    🍿 WatchlistID © 2026
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* ── MOBILE VIEW (Clean Responsive Direct Children) ── */
            <>
              {/* Logo section with entrance animations */}
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
                <Text style={s.logoSub} maxFontSizeMultiplier={1.3}>
                  {t("authTagline")}
                </Text>
              </Animated.View>

              {FormContent}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CaptchaModal
        visible={showCaptcha}
        onVerify={onCaptchaVerified}
        onCancel={() => setShowCaptcha(false)}
      />
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

  // ── Desktop Layout ──────────────────────────────────────────
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
    minHeight: "100vh" as any,
  },
  leftSection: {
    flex: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60,
  },
  leftContent: {
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
  },
  webLogo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  brandLogo: {
    fontSize: 48,
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: -1,
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    lineHeight: 46,
    letterSpacing: -0.5,
    marginBottom: 60,
  },
  gradientText: {
    color: Colors.primary,
    fontWeight: "800",
  },

  // ── Vertical Separator ──
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
    paddingVertical: Spacing.xl,
  },
  desktopFormContainer: {
    width: "100%",
    maxWidth: 380, // Matches Instagram clean input form width
  },

  // ── Mobile Logo Section ─────────────────────────────────────
  logoWrap: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
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
  logoSub: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.5)",
    marginTop: 6,
    fontWeight: "500",
  },

  // ── Glassmorphism Form Card ─────────────────────────────────
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
    marginBottom: 28,
    letterSpacing: -0.5,
  },

  // ── Custom Input Fields ─────────────────────────────────────
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forgotTextInline: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
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

  // ── Action Buttons ──────────────────────────────────────────
  btn: {
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    ...Shadow.md,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  dividerText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "600",
  },

  googleBtn: {
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  googleIconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  signupText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  signupLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "700",
  },

  skipBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
  },

  errorBox: {
    backgroundColor: "rgba(220,53,69,0.12)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(220,53,69,0.3)",
  },
  errorText: {
    fontSize: 13,
    color: "#ff6b7a",
    fontWeight: "600",
    textAlign: "center",
  },

  footerBrand: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    alignSelf: "center",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.3)",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

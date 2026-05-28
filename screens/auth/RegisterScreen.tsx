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
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react-native";
import EmptyStateIcon from "@/components/common/EmptyStateIcon";

import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  FontWeight,
  Shadow,
} from "@/constants/theme";
import CaptchaModal from "@/components/auth/CaptchaModal";
import { useLanguage } from "@/context/LanguageContext";
import { typedFrom } from "@/supabase";

const LOGO_WEB = require("../../assets/images/icon.png");

// ─── Username validation ──────────────────────────────────────────────────────
const DOUBLE_SYMBOL = /[._-]{2,}/;
const FORBIDDEN_NAMES = [
  "admin",
  "administrator",
  "owner",
  "official",
  "support",
  "staff",
  "mod",
  "moderator",
];

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function validateUsername(raw: string, lang: "en" | "id"): string | null {
  if (/\s/.test(raw)) {
    return lang === "id"
      ? "Username tidak boleh mengandung spasi"
      : "Username cannot contain spaces";
  }
  if (raw.length < 3) {
    return lang === "id"
      ? "Username minimal 3 karakter"
      : "Username must be at least 3 characters";
  }
  if (raw.length > 30) {
    return lang === "id"
      ? "Username maksimal 30 karakter"
      : "Username must be at most 30 characters";
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(raw)) {
    return lang === "id"
      ? "Hanya huruf, angka, titik, underscore, dan strip diperbolehkan"
      : "Only letters, numbers, dots, underscores, and hyphens are allowed";
  }
  if (/^[._-]|[._-]$/.test(raw)) {
    return lang === "id"
      ? "Username tidak boleh diawali atau diakhiri dengan simbol"
      : "Username cannot start or end with a symbol";
  }
  if (DOUBLE_SYMBOL.test(raw)) {
    return lang === "id"
      ? "Tidak boleh ada dua simbol berurutan"
      : "Cannot have consecutive symbols";
  }
  const lower = raw.toLowerCase();
  if (FORBIDDEN_NAMES.some((n) => lower.includes(n))) {
    return lang === "id"
      ? "Nama ini tidak diizinkan untuk alasan keamanan"
      : "This username is not allowed for security reasons";
  }
  return null; // valid
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
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

  const [username, setUsernameRaw] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Username live status
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated values for high-end micro-interactions
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const usernameBorderAnim = useRef(new Animated.Value(0)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;
  const confirmBorderAnim = useRef(new Animated.Value(0)).current;
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

  const handleUsernameChange = (raw: string) => {
    const cleaned = raw.replace(/\s/g, "");
    setUsernameRaw(cleaned);
    setUsernameStatus("idle");
    setUsernameHint(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!cleaned) return;

    const formatErr = validateUsername(cleaned, language);
    if (formatErr) {
      setUsernameStatus("invalid");
      setUsernameHint(formatErr);
      return;
    }

    setUsernameStatus("checking");
    debounceRef.current = setTimeout(() => checkAvailability(cleaned), 500);
  };

  const checkAvailability = async (name: string) => {
    try {
      const { data } = await typedFrom("profiles")
        .select("id")
        .ilike("username", name)
        .limit(1)
        .maybeSingle();

      if (data) {
        setUsernameStatus("taken");
        setUsernameHint(
          language === "id" ? "Username sudah dipakai" : "Username is already taken"
        );
      } else {
        setUsernameStatus("available");
        setUsernameHint(
          language === "id" ? "Username tersedia" : "Username is available"
        );
      }
    } catch {
      setUsernameStatus("idle");
      setUsernameHint(null);
    }
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleRegister = async () => {
    setError(null);

    if (!username.trim() || !email.trim() || !password || !confirm) {
      setError(t("allFieldsRequired"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (usernameStatus === "checking") {
      setError(
        language === "id"
          ? "Sedang memeriksa ketersediaan username, harap tunggu..."
          : "Checking username availability, please wait..."
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (usernameStatus === "taken") {
      setError(
        language === "id"
          ? "Username sudah dipakai, pilih username lain"
          : "Username is taken, choose another username"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (usernameStatus === "invalid") {
      setError(
        usernameHint ||
          (language === "id" ? "Username tidak valid" : "Invalid username")
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const formatErr = validateUsername(username, language);
    if (formatErr) {
      setError(formatErr);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirm) {
      setError(t("passwordsDontMatch"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(
        language === "id" ? "Format email tidak valid." : "Invalid email format."
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setShowCaptcha(true);
  };

  const handleCaptchaVerify = async (token: string) => {
    setShowCaptcha(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const err = await signUp(
      email.trim().toLowerCase(),
      password,
      username.trim().toLowerCase(),
      token
    );
    setLoading(false);

    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
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

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const getBorderColor = (anim: Animated.Value, status?: UsernameStatus) => {
    if (status === "available") return "#22c55e";
    if (status === "taken" || status === "invalid") return "#ef4444";
    return anim.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,255,255,0.08)", Colors.primary],
    });
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={s.root} edges={["top", "bottom"]}>
        <LinearGradient
          colors={["#050505", '#0c0c0c']}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.successWrap}>
          <Text style={s.successEmoji}>🎉</Text>
          <Text style={s.successTitle} allowFontScaling={false}>
            {t("accountCreated")}
          </Text>
          <Text style={s.successSub} allowFontScaling={false}>
            {t("checkEmailVerification")}
          </Text>
          <TouchableOpacity
            style={s.btn}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={s.btnText} allowFontScaling={false}>
              {t("backToLogin")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Username status indicator ───────────────────────────────────────────────
  const renderUsernameStatus = () => {
    if (!username || usernameStatus === "idle") return null;
    if (usernameStatus === "checking") {
      return (
        <View style={s.hintRow}>
          <ActivityIndicator size={12} color={Colors.text.secondary} />
          <Text
            style={[s.hintText, { color: Colors.text.secondary }]}
            allowFontScaling={false}
          >
            {language === "id" ? "Memeriksa ketersediaan..." : "Checking availability..."}
          </Text>
        </View>
      );
    }
    if (usernameStatus === "available") {
      return (
        <View style={s.hintRow}>
          <CheckCircle2 size={13} color="#22c55e" strokeWidth={2.5} />
          <Text
            style={[s.hintText, { color: "#22c55e" }]}
            allowFontScaling={false}
          >
            {usernameHint}
          </Text>
        </View>
      );
    }
    return (
      <View style={s.hintRow}>
        <XCircle size={13} color="#ef4444" strokeWidth={2.5} />
        <Text
          style={[s.hintText, { color: "#ef4444" }]}
          allowFontScaling={false}
        >
          {usernameHint}
        </Text>
      </View>
    );
  };

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
            <Text style={s.welcomeBadgeText} allowFontScaling={false}>
              {t("joinCommunity")}
            </Text>
          </View>
        </View>
      )}

      <Text
        style={[s.formTitle, { textAlign: isDesktop ? "left" : "center" }]}
        allowFontScaling={false}
      >
        {isDesktop
          ? language === "id"
            ? "Daftar ke WatchListID"
            : "Sign Up for WatchListID"
          : t("signUp")}
      </Text>

      {/* Username Field */}
      <View style={s.inputWrapper}>
        <Text style={s.inputLabel} allowFontScaling={false}>
          {t("username")}
        </Text>
        <Animated.View
          style={[
            s.inputContainer,
            { borderColor: getBorderColor(usernameBorderAnim, usernameStatus) },
          ]}
        >
          <User size={18} color="rgba(255, 255, 255, 0.4)" strokeWidth={2} />
          <TextInput
            style={s.input}
            value={username}
            onChangeText={handleUsernameChange}
            onFocus={() => animateFocus(usernameBorderAnim, true)}
            onBlur={() => animateFocus(usernameBorderAnim, false)}
            placeholder="moviefan123"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            autoCapitalize="none"
            autoCorrect={false}
            allowFontScaling={false}
            maxLength={30}
          />
        </Animated.View>
        {renderUsernameStatus()}
      </View>

      {/* Email Field */}
      <View style={s.inputWrapper}>
        <Text style={s.inputLabel} allowFontScaling={false}>
          {t("email")}
        </Text>
        <Animated.View
          style={[
            s.inputContainer,
            { borderColor: getBorderColor(emailBorderAnim) },
          ]}
        >
          <Mail size={18} color="rgba(255, 255, 255, 0.4)" strokeWidth={2} />
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            onFocus={() => animateFocus(emailBorderAnim, true)}
            onBlur={() => animateFocus(emailBorderAnim, false)}
            placeholder={language === "id" ? "nama@email.com" : "name@email.com"}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            allowFontScaling={false}
          />
        </Animated.View>
      </View>

      {/* Password Field */}
      <View style={s.inputWrapper}>
        <Text style={s.inputLabel} allowFontScaling={false}>
          {t("password")}
        </Text>
        <Animated.View
          style={[
            s.inputContainer,
            { borderColor: getBorderColor(passwordBorderAnim) },
          ]}
        >
          <Lock size={18} color="rgba(255, 255, 255, 0.4)" strokeWidth={2} />
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            onFocus={() => animateFocus(passwordBorderAnim, true)}
            onBlur={() => animateFocus(passwordBorderAnim, false)}
            placeholder={language === "id" ? "Min. 6 karakter" : "Min. 6 characters"}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            secureTextEntry={!showPass}
            allowFontScaling={false}
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

      {/* Confirm Password Field */}
      <View style={s.inputWrapper}>
        <Text style={s.inputLabel} allowFontScaling={false}>
          {t("confirmPassword")}
        </Text>
        <Animated.View
          style={[
            s.inputContainer,
            { borderColor: getBorderColor(confirmBorderAnim) },
          ]}
        >
          <Lock size={18} color="rgba(255, 255, 255, 0.4)" strokeWidth={2} />
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={setConfirm}
            onFocus={() => animateFocus(confirmBorderAnim, true)}
            onBlur={() => animateFocus(confirmBorderAnim, false)}
            placeholder={language === "id" ? "Ulangi kata sandi" : "Repeat password"}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            secureTextEntry={!showPass}
            allowFontScaling={false}
          />
        </Animated.View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={s.errorBox}>
          <Text style={s.errorText} allowFontScaling={false}>
            ⚠️ {error}
          </Text>
        </View>
      )}

      {/* Register Button */}
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
        onPress={handleRegister}
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
                <UserPlus size={18} color={Colors.white} strokeWidth={2.5} />
                <Text style={s.btnText} allowFontScaling={false}>
                  {t("signUp")}
                </Text>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>

      {/* Divider */}
      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText} allowFontScaling={false}>
          {t("or")}
        </Text>
        <View style={s.dividerLine} />
      </View>

      {/* Google Signup Button */}
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
        <Text style={s.googleBtnText} allowFontScaling={false}>
          {language === "id"
            ? "Daftar dengan Google"
            : "Sign Up with Google"}
        </Text>
      </TouchableOpacity>

      {/* Back to Login Link */}
      <View style={s.signupRow}>
        <Text style={s.signupText} allowFontScaling={false}>
          {t("alreadyHaveAccount")}{" "}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/auth/login");
          }}
          activeOpacity={0.7}
        >
          <Text style={s.signupLink} allowFontScaling={false}>
            {t("signInHere")}
          </Text>
        </TouchableOpacity>
      </View>
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
                {/* Animated gradient orbs */}
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
                  {/* Web logo image above the text */}
                  <Image
                    source={LOGO_WEB}
                    style={s.webLogo}
                    contentFit="contain"
                  />

                  {/* Brand name */}
                  <Text style={s.brandLogo} allowFontScaling={false}>
                    WatchList<Text style={{ color: Colors.primary }}>ID</Text>
                  </Text>

                  {/* Hero tagline */}
                  <Text style={s.heroTitle} allowFontScaling={false}>
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

                  {/* Feature badges */}
                  <View style={s.featureBadges}>
                    <View style={s.featureBadge}>
                      <Text style={s.featureBadgeIcon}>🎬</Text>
                      <Text style={s.featureBadgeText}>
                        {language === "id" ? "10k+ Review" : "10k+ Reviews"}
                      </Text>
                    </View>
                    <View style={s.featureBadge}>
                      <Text style={s.featureBadgeIcon}>⭐</Text>
                      <Text style={s.featureBadgeText}>
                        {language === "id" ? "Rating Terpercaya" : "Trusted Ratings"}
                      </Text>
                    </View>
                    <View style={s.featureBadge}>
                      <Text style={s.featureBadgeIcon}>👥</Text>
                      <Text style={s.featureBadgeText}>
                        {language === "id" ? "Komunitas Aktif" : "Active Community"}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* VERTICAL DIVIDER */}
              <View style={s.verticalDivider} />

              {/* RIGHT SIDE: Instagram-Style Clean Dark Login Form */}
              <View style={s.rightSection}>
                {FormContent}

                {/* Minimalist footer brand */}
                <View style={s.footerBrand}>
                  <Text style={s.footerText} allowFontScaling={false}>
                    🍿 WatchListID © 2026
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
                <Text style={s.logo} allowFontScaling={false}>
                  WatchList<Text style={s.logoAccent}>ID</Text>
                </Text>
                <Text style={s.logoSub} allowFontScaling={false}>
                  {t("joinCommunity")}
                </Text>
              </Animated.View>

              {FormContent}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CaptchaModal
        visible={showCaptcha}
        onCancel={() => setShowCaptcha(false)}
        onVerify={handleCaptchaVerify}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureBadgeIcon: {
    fontSize: 16,
  },
  featureBadgeText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },

  // Blurred Ambient Background Orbs
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
      web: {
        filter: "blur(100px)",
      } as any,
    }),
  },
  orb2: {
    width: 400,
    height: 400,
    backgroundColor: "#C5050F",
    bottom: -100,
    left: -100,
    ...Platform.select({
      web: {
        filter: "blur(100px)",
      } as any,
    }),
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

  // Username hint row
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingLeft: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: "600",
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
    borderColor: "rgba(255, 255, 255, 0.15)",
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

  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  successEmoji: { fontSize: 64, marginBottom: Spacing.xl },
  successTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.black,
    color: Colors.white,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  successSub: {
    fontSize: FontSize.base,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxl,
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

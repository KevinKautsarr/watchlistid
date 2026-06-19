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
import { Lock, Eye, EyeOff, CheckCircle, Sparkles, ArrowLeft } from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session, isLoading, updatePassword } = useAuth();
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

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Animated values for premium micro-interactions
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
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

  const handleResetPassword = async () => {
    setError(null);

    // 1. Password length validation
    if (password.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t("passwordMin8Err"));
      return;
    }

    // 2. Confirm password match validation
    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t("passwordsDontMatch"));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const errMessage = await updatePassword(password);
      setLoading(false);

      if (errMessage) {
        if (errMessage.includes("same as old")) {
          setError(t("newPasswordSameAsOldErr"));
        } else if (
          errMessage.includes("session") ||
          errMessage.includes("invalid claim")
        ) {
          setError(t("recoverySessionExpiredErr"));
        } else {
          setError(errMessage);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        // Redirect to main tabs flow after showing success message briefly
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 2000);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || t("resetPasswordSystemErr"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const getBorderColor = (anim: Animated.Value) => {
    return anim.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,255,255,0.08)", Colors.primary],
    });
  };

  // ── Shareable form content ──────────────────────────────────────────────────
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
      {success ? (
        // ── SUCCESS STATE ──
        <View style={s.successContainer}>
          <CheckCircle size={56} color="#22C55E" strokeWidth={2} />
          <Text style={s.successTitle} allowFontScaling={false}>
            {t("successResetTitle")}
          </Text>
          <Text style={s.successMessage} allowFontScaling={false}>
            {t("successResetMsg")}
          </Text>
        </View>
      ) : !session && !isLoading ? (
        // ── EXPIRED / INVALID SESSION WARNING STATE ──
        <View style={s.successContainer}>
          <Text style={{ fontSize: 56, marginBottom: 12 }}>⚠️</Text>
          <Text style={s.successTitle} allowFontScaling={false}>
            {language === "id" ? "Sesi Berakhir" : "Session Expired"}
          </Text>
          <Text style={[s.successMessage, { marginBottom: Spacing.xl }]} allowFontScaling={false}>
            {t("recoverySessionExpiredErr")}
          </Text>
          <TouchableOpacity
            style={s.backToLoginBtn}
            onPress={() => router.replace("/auth/forgot")}
            activeOpacity={0.85}
          >
            <Text style={s.backToLoginText} allowFontScaling={false}>
              {language === "id" ? "Minta Link Baru" : "Request New Link"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ── PASSWORD RESET FORM ──
        <>
          {!isDesktop && (
            <View style={s.formHeader}>
              <View style={s.welcomeBadge}>
                <Sparkles size={14} color={Colors.primary} strokeWidth={2.5} />
                <Text style={s.welcomeBadgeText} allowFontScaling={false}>
                  {t("resetPassword")}
                </Text>
              </View>
            </View>
          )}

          <Text
            style={[s.formTitle, { textAlign: isDesktop ? "left" : "center" }]}
            allowFontScaling={false}
          >
            {t("resetPasswordTitle")}
          </Text>
          <Text
            style={[s.formSub, { textAlign: isDesktop ? "left" : "center" }]}
            allowFontScaling={false}
          >
            {t("resetPasswordSub")}
          </Text>

          {/* New Password input */}
          <View style={s.inputWrapper}>
            <Text style={s.inputLabel} allowFontScaling={false}>
              {t("newPassword")}
            </Text>
            <Animated.View
              style={[
                s.inputContainer,
                { borderColor: getBorderColor(passwordBorderAnim) },
              ]}
            >
              <Lock
                size={18}
                color="rgba(255, 255, 255, 0.4)"
                strokeWidth={2}
              />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                onFocus={() => animateFocus(passwordBorderAnim, true)}
                onBlur={() => animateFocus(passwordBorderAnim, false)}
                placeholder="••••••••"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
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
                  <Eye
                    size={18}
                    color="rgba(255, 255, 255, 0.5)"
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Confirm New Password input */}
          <View style={s.inputWrapper}>
            <Text style={s.inputLabel} allowFontScaling={false}>
              {t("confirmNewPassword")}
            </Text>
            <Animated.View
              style={[
                s.inputContainer,
                { borderColor: getBorderColor(confirmBorderAnim) },
              ]}
            >
              <Lock
                size={18}
                color="rgba(255, 255, 255, 0.4)"
                strokeWidth={2}
              />
              <TextInput
                style={s.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError(null);
                }}
                onFocus={() => animateFocus(confirmBorderAnim, true)}
                onBlur={() => animateFocus(confirmBorderAnim, false)}
                placeholder="••••••••"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                secureTextEntry={!showConfirmPass}
                autoCapitalize="none"
                autoCorrect={false}
                allowFontScaling={false}
              />
              <TouchableOpacity
                onPress={() => {
                  setShowConfirmPass((v) => !v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPass ? (
                  <EyeOff
                    size={18}
                    color="rgba(255, 255, 255, 0.5)"
                    strokeWidth={2}
                  />
                ) : (
                  <Eye
                    size={18}
                    color="rgba(255, 255, 255, 0.5)"
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
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
            onPress={handleResetPassword}
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
                  <Text style={s.btnText} allowFontScaling={false}>
                    {t("savePassword")}
                  </Text>
                )}
              </LinearGradient>
            </Animated.View>
          </Pressable>
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
        {isLoading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={isDesktop ? s.scrollDesktop : s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isDesktop ? (
              /* ── DESKTOP SPLIT VIEW ── */
              <View style={s.desktopContainer}>
                {/* LEFT SIDE: Brand presentation */}
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

                    <Text style={s.brandLogo} allowFontScaling={false}>
                      WatchList<Text style={{ color: Colors.primary }}>ID</Text>
                    </Text>

                    <Text style={s.heroTitle} allowFontScaling={false}>
                      {language === "id" ? (
                        <>
                          Rancang daftar tontonan impian Anda dan jelajahi rekomendasi{" "}
                          <Text style={s.gradientText}>sinema terbaik</Text> dunia.
                        </>
                      ) : (
                        <>
                          Build your dream watchlist and explore the world&apos;s{" "}
                          <Text style={s.gradientText}>best cinema</Text> recommendations.
                        </>
                      )}
                    </Text>
                  </Animated.View>
                </View>

                {/* VERTICAL DIVIDER */}
                <View style={s.verticalDivider} />

                {/* RIGHT SIDE: Password Form */}
                <View style={s.rightSection}>
                  {FormContent}

                  <View style={s.footerBrand}>
                    <Text style={s.footerText} allowFontScaling={false}>
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
                  <Text style={s.logo} allowFontScaling={false}>
                    WatchList<Text style={s.logoAccent}>ID</Text>
                  </Text>
                </Animated.View>

                {FormContent}
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
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

  // Mobile Layout
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

  // Input Fields
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
    marginTop: 8,
    ...Shadow.md,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },

  // Success view details
  successContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  successTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.black,
    color: Colors.white,
    textAlign: "center",
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  successMessage: {
    fontSize: FontSize.base,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
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

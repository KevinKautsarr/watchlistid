import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "../../supabase";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/context/LanguageContext";

/**
 * OAuth & Password Reset callback handler — supports PKCE and Implicit flows
 * on both Web and Native (iOS/Android).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const { language } = useLanguage();

  useEffect(() => {
    if (!url) return;

    const handleCallback = async () => {
      try {
        // Replace '#' with '?' so Linking.parse extracts hash parameters as queryParams
        const cleanUrl = url.replace("#", "?");
        const parsed = Linking.parse(cleanUrl);
        const { queryParams } = parsed;

        // 1. Capture error states (e.g. invalid or expired email links)
        if (queryParams?.error) {
          const errorMsg = queryParams.error_description || queryParams.error;
          let displayError = Array.isArray(errorMsg) ? (errorMsg[0] as string) : (errorMsg as string) || "";
          if (displayError) {
            if (
              displayError.includes("expired") ||
              displayError.includes("invalid") ||
              displayError.includes("verify")
            ) {
              displayError =
                language === "id"
                  ? "Tautan pemulihan sandi sudah kedaluwarsa atau tidak valid."
                  : "The password recovery link has expired or is invalid.";
            }
          }
          router.replace(
            `/auth/forgot?error=${encodeURIComponent(displayError)}`
          );
          return;
        }

        const code = queryParams?.code as string;
        const accessToken = queryParams?.access_token as string;
        const refreshToken = queryParams?.refresh_token as string;
        const type = queryParams?.type as string;

        // 2. PKCE flow code exchange (Web & Native code capture)
        if (code) {
          const {
            data: { session },
            error,
          } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("PKCE Code exchange error:", error.message);
            router.replace(
              `/auth/forgot?error=${encodeURIComponent(error.message)}`
            );
            return;
          }

          if (session) {
            // Check if this was a password recovery flow
            if (type === "recovery" || url.includes("recovery")) {
              router.replace("/auth/reset-password");
            } else {
              router.replace("/(tabs)");
            }
            return;
          }
        }

        // 3. Implicit Flow session exchange (hash fragment tokens)
        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            console.error("Implicit callback session error:", error.message);
            router.replace(
              `/auth/forgot?error=${encodeURIComponent(error.message)}`
            );
            return;
          }

          if (type === "recovery" || url.includes("recovery")) {
            router.replace("/auth/reset-password");
          } else {
            router.replace("/(tabs)");
          }
          return;
        }

        // 4. Fallback: check existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace("/(tabs)");
        } else {
          router.replace("/auth/login");
        }
      } catch (err: any) {
        console.error("Auth callback exception:", err);
        router.replace("/auth/login");
      }
    };

    handleCallback();
  }, [url, router, language]);

  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});

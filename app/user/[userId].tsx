import ScreenErrorBoundary from "@/components/common/ScreenErrorBoundary";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLoginPrompt } from "@/hooks/useLoginPrompt";
import { Colors, FontSize, FontWeight, Radius, Spacing } from "@/constants/theme";
import ProfileScreen from "@/screens/ProfileScreen";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

export default function UserProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { showLoginPrompt } = useLoginPrompt();

  // Invalid or missing userId in the route
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: Spacing.xl,
        }}
      >
        <Text
          style={{
            color: Colors.danger,
            fontSize: FontSize.lg,
            fontWeight: FontWeight.bold,
            marginBottom: Spacing.xs,
            textAlign: "center",
          }}
        >
          {t("profileNotFound")}
        </Text>
        <Text
          style={{
            color: Colors.text.secondary,
            fontSize: FontSize.sm,
            textAlign: "center",
          }}
        >
          {t("profileNotFoundDesc")}
        </Text>
      </View>
    );
  }

  // Guest user — prompt to log in
  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: Spacing.xl,
        }}
      >
        <Text
          style={{
            color: Colors.white,
            fontSize: FontSize.lg,
            fontWeight: FontWeight.bold,
            marginBottom: Spacing.xs,
            textAlign: "center",
          }}
        >
          {t("loginToSeeActivity")}
        </Text>
        <Text
          style={{
            color: Colors.text.secondary,
            fontSize: FontSize.sm,
            textAlign: "center",
            marginBottom: Spacing.xl,
          }}
        >
          {t("findYourFriendsSub")}
        </Text>
        <Pressable
          onPress={showLoginPrompt}
          style={({ pressed }) => [
            {
              backgroundColor: Colors.danger,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderRadius: Radius.full,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.base }}>
            {t("signIn")} / {t("signUp")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenErrorBoundary screenName="User Profile">
      <ProfileScreen userId={userId} />
    </ScreenErrorBoundary>
  );
}

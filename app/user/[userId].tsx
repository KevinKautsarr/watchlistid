import ScreenErrorBoundary from "@/components/common/ScreenErrorBoundary";
import { useLanguage } from "@/context/LanguageContext";
import { Colors, FontSize, FontWeight, Spacing } from "@/constants/theme";
import ProfileScreen from "@/screens/ProfileScreen";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function UserProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { t } = useLanguage();

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

  // Public profile — viewable by anyone (logged in OR guest). All underlying
  // data (profile, logs, reviews, watchlist) is RLS-public, so a shared link
  // must render for recipients who aren't signed in. Follow actions still
  // prompt for login from within the profile.
  return (
    <ScreenErrorBoundary screenName="User Profile">
      <ProfileScreen userId={userId} />
    </ScreenErrorBoundary>
  );
}

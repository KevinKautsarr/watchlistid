import ScreenErrorBoundary from "@/components/common/ScreenErrorBoundary";
import { useAuth } from "@/context/AuthContext";
import ProfileScreen from "@/screens/ProfileScreen";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

export default function UserProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      (global as any).showLoginPrompt?.();
    }
  }, [user]);

  // Runtime check for userId in the route component
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#141414",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            color: "#E50914",
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
          Profil Tidak Ditemukan
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          User ID tidak valid atau tidak disediakan dalam rute.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#141414",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            color: "#F5F0F1",
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Login untuk melihat profil user lain
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Silakan masuk terlebih dahulu untuk menjelajahi profil komunitas.
        </Text>
        <Pressable
          onPress={() => {
            router.push("/auth/login");
          }}
          style={({ pressed }) => [
            {
              backgroundColor: "#E50914",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Masuk / Daftar
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

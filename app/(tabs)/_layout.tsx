import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Compass, Bookmark, User } from 'lucide-react-native';

const PRIMARY   = '#3F72AF';
const DARK      = '#112D4E';
const INACTIVE  = 'rgba(17,45,78,0.30)';
const BAR_BG    = '#FFFFFF';

type TabIconProps = {
  focused: boolean;
  IconComponent: React.FC<any>;
  label: string;
};

const TabIcon = ({ focused, IconComponent, label }: TabIconProps) => {
  if (focused) {
    return (
      <View
        style={{
          overflow: 'visible',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: PRIMARY,
            borderRadius: 22,
            paddingHorizontal: 13,
            paddingVertical: 8,
            gap: 5,
            // glow
            shadowColor: PRIMARY,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <IconComponent size={17} color="#FFFFFF" strokeWidth={2.5} />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 0.1,
              includeFontPadding: false,
            }}
            allowFontScaling={false}
          >
            {label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <IconComponent size={23} color={INACTIVE} strokeWidth={1.8} />
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          backgroundColor: BAR_BG,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 10,
          ...Platform.select({
            ios: {
              shadowColor: DARK,
              shadowOpacity: 0.12,
              shadowOffset: { width: 0, height: -8 },
              shadowRadius: 24,
            },
            android: { elevation: 28 },
          }),
        },
        tabBarItemStyle: {
          overflow: 'visible',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={Home} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={Compass} label="Discover" />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={Bookmark} label="Watchlist" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={User} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

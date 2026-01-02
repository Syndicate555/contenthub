import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, Search, Plus, User, Library } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Light theme colors
const COLORS = {
  tabBar: '#FFFFFF',
  tabBarBorder: '#F3F4F6',
  tabBarActive: '#1F2937',
  tabBarInactive: '#9CA3AF',
  addButton: '#1F2937',
  addButtonIcon: '#FFFFFF',
};

function TabBarIcon({ icon: Icon, focused, color }: { icon: any; focused: boolean; color: string }) {
  return (
    <View style={styles.iconContainer}>
      <Icon size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

function AddButton() {
  return (
    <View style={styles.addButton}>
      <Plus size={28} color={COLORS.addButtonIcon} strokeWidth={2.5} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopWidth: 1,
          borderTopColor: COLORS.tabBarBorder,
          height: 85 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.tabBarInactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 6,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon={Home} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon={Library} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => <AddButton />,
          tabBarStyle: { display: 'none' },
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('add');
          },
        })}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon={Search} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon={User} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    backgroundColor: COLORS.addButton,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});

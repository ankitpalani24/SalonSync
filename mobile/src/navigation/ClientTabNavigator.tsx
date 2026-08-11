import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/client/HomeScreen';
import { ExploreScreen } from '../screens/client/ExploreScreen';
import { AppointmentsScreen } from '../screens/client/AppointmentsScreen';
import { LoyaltyScreen } from '../screens/client/LoyaltyScreen';
import { ProfileScreen } from '../screens/client/ProfileScreen';
import { COLORS } from '../constants/theme';
import { Home, Compass, Calendar, Award, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const ClientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D0D',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primaryGold,
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass size={size || 20} color={color} />
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color, size }) => <Calendar size={size || 20} color={color} />
        }}
      />
      <Tab.Screen
        name="Loyalty"
        component={LoyaltyScreen}
        options={{
          tabBarLabel: 'Loyalty',
          tabBarIcon: ({ color, size }) => <Award size={size || 20} color={color} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

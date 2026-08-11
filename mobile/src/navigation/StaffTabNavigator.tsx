import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StaffDashboardScreen } from '../screens/staff/StaffDashboardScreen';
import { StaffAppointmentsScreen } from '../screens/staff/StaffAppointmentsScreen';
import { StaffCustomersScreen } from '../screens/staff/StaffCustomersScreen';
import { StaffPerformanceScreen } from '../screens/staff/StaffPerformanceScreen';
import { StaffProfileScreen } from '../screens/staff/StaffProfileScreen';
import { COLORS } from '../constants/theme';
import { LayoutDashboard, Calendar, Users, BarChart3, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const StaffTabNavigator = () => {
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
        name="Dashboard"
        component={StaffDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size || 20} color={color} />
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={StaffAppointmentsScreen}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color, size }) => <Calendar size={size || 20} color={color} />
        }}
      />
      <Tab.Screen
        name="Customers"
        component={StaffCustomersScreen}
        options={{
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color, size }) => <Users size={size || 20} color={color} />
        }}
      />
      <Tab.Screen
        name="Performance"
        component={StaffPerformanceScreen}
        options={{
          tabBarLabel: 'Performance',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size || 20} color={color} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={StaffProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

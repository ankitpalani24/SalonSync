import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ClientTabNavigator } from './ClientTabNavigator';
import { StaffTabNavigator } from './StaffTabNavigator';
import { SalonDetailsScreen } from '../screens/client/SalonDetailsScreen';
import { BookingScreen } from '../screens/client/BookingScreen';
import { AppointmentDetailsScreen } from '../screens/client/AppointmentDetailsScreen';
import { StaffAppointmentDetailsScreen } from '../screens/staff/StaffAppointmentDetailsScreen';
import { InvoicesScreen } from '../screens/client/InvoicesScreen';
import { ReviewSubmissionModal } from '../screens/client/ReviewSubmissionModal';
import { StaffReviewsScreen } from '../screens/staff/StaffReviewsScreen';
import { COLORS } from '../constants/theme';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { user, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primaryGold} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Unauthenticated Stack
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : role === 'CLIENT' ? (
        // Authenticated Client Stack
        <Stack.Group>
          <Stack.Screen name="ClientTabs" component={ClientTabNavigator} />
          <Stack.Screen name="SalonDetails" component={SalonDetailsScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
          <Stack.Screen name="InvoicesScreen" component={InvoicesScreen} />
          <Stack.Screen name="WriteReview" component={ReviewSubmissionModal} />
        </Stack.Group>
      ) : role === 'STAFF' ? (
        // Authenticated Staff Stack
        <Stack.Group>
          <Stack.Screen name="StaffTabs" component={StaffTabNavigator} />
          <Stack.Screen name="StaffAppointmentDetails" component={StaffAppointmentDetailsScreen} />
          <Stack.Screen name="Reviews" component={StaffReviewsScreen} />
        </Stack.Group>
      ) : (
        // Fallback for non-supported roles
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

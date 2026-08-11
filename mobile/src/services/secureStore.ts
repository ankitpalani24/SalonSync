import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'salonsync_user_token';
const USER_KEY = 'salonsync_user_data';

export const secureStorage = {
  async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (e) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },

  async saveUserData(userData: any): Promise<void> {
    const json = JSON.stringify(userData);
    await AsyncStorage.setItem(USER_KEY, json);
  },

  async getUserData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/constants';

/**
 * Storage Service
 * Wrapper around AsyncStorage with error handling
 */
class StorageService {
  /**
   * Get item from storage
   */
  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Get habits
   */
  async getHabits() {
    const habits = await this.getItem(STORAGE_KEYS.HABITS);
    return habits || [];
  }

  /**
   * Save habits
   */
  async saveHabits(habits) {
    return await this.setItem(STORAGE_KEYS.HABITS, habits);
  }

  /**
   * Get timer states
   */
  async getTimerStates() {
    const timers = await this.getItem(STORAGE_KEYS.TIMERS);
    return timers || {};
  }

  /**
   * Save timer states
   */
  async saveTimerStates(timers) {
    return await this.setItem(STORAGE_KEYS.TIMERS, timers);
  }

  /**
   * Get theme mode
   */
  async getThemeMode() {
    const mode = await this.getItem(STORAGE_KEYS.THEME);
    return mode || 'system';
  }

  /**
   * Save theme mode
   */
  async saveThemeMode(mode) {
    return await this.setItem(STORAGE_KEYS.THEME, mode);
  }
}

export default new StorageService();
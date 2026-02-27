import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SERVER_URL } from './config';

const KEYS = {
  SERVER_URL: 'server_url',
  USERNAME: 'last_username',
} as const;

export async function getServerUrl(): Promise<string> {
  const url = await AsyncStorage.getItem(KEYS.SERVER_URL);
  return url || DEFAULT_SERVER_URL;
}

export async function setServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SERVER_URL, url.replace(/\/+$/, ''));
}

export async function getLastUsername(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USERNAME);
}

export async function setLastUsername(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USERNAME, name);
}

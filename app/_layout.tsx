import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkAuth = () => {
    if (Platform.OS === 'web') {
      const token = window.sessionStorage.getItem('aggiefind_token');
      setIsLoggedIn(!!token);
    } else {
      setIsLoggedIn(true);
    }
  };

  useEffect(() => {
    checkAuth();

    // Standard web-only listener to detect logout from other components
    if (Platform.OS === 'web') {
      const handleStorageChange = () => checkAuth();
      window.addEventListener('storage', handleStorageChange);

      // Poll for changes because sessionStorage doesn't always trigger 'storage' events on the same tab
      const interval = setInterval(checkAuth, 1000);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [segments]);

  useEffect(() => {
    if (isLoggedIn === null) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!isLoggedIn && inTabsGroup) {
      router.replace('/');
    } else if (isLoggedIn && !inTabsGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
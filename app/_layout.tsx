import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      // hide the native stack header for all routes (prevents the small "index" title on web)
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/* modal route */}
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
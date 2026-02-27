import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function TastingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Tasting', headerTitle: 'Tasting Submission' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Tasting Details' }}
      />
    </Stack>
  );
}

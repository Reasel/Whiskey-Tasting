import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function TastingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvasCream },
        headerTintColor: colors.inkBlack,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.canvasCream },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Tasting', headerTitle: 'Tasting Submission' }}
      />
    </Stack>
  );
}

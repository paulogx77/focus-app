import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Screen from '../components/Screen';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const { signIn } = useAppState();

  async function handleContinue() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Informe seu nome', 'Use um nome para personalizar as telas.');
      return;
    }

    await signIn(trimmed);
  }

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.badge} />
        <Text style={styles.title}>Focus</Text>
        <Text style={styles.subtitle}>Organize hábitos, rotina e progresso com persistência local.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Seu nome</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex: Ana"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
        <Pressable onPress={handleContinue} style={styles.button}>
          <Text style={styles.buttonText}>Entrar</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.md,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 42,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

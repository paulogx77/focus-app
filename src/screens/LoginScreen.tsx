import { useState } from 'react';
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Screen from '../components/Screen';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authenticateLocal } = useAppState();

  async function handleSubmit() {
    const normalizedUsername = username.trim().toLowerCase();
    const trimmedName = name.trim();

    if (isRegistering && !trimmedName) {
      Alert.alert('Informe seu nome', 'Use um nome para personalizar seu perfil.');
      return;
    }
    if (!/^[a-z0-9._-]{3,32}$/.test(normalizedUsername)) {
      Alert.alert('Usuario invalido', 'Use de 3 a 32 caracteres: letras, numeros, ponto, hifen ou sublinhado.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Senha curta', 'Use pelo menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authenticateLocal(isRegistering ? 'register' : 'login', {
        username: normalizedUsername,
        password,
        name: trimmedName || undefined,
      });
    } catch (error) {
      Alert.alert('Falha ao entrar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.badge} />
        <Text style={styles.title}>Focus</Text>
        <Text style={styles.subtitle}>Organize hábitos, rotina e progresso com backup protegido.</Text>
      </View>

      <View style={styles.card}>
        {isRegistering ? <><Text style={styles.label}>Seu nome</Text><TextInput value={name} onChangeText={setName} placeholder="Ex: Ana" placeholderTextColor={colors.textSecondary} style={styles.input} /></> : null}
        <Text style={styles.label}>Usuario</Text>
        <TextInput value={username} onChangeText={setUsername} placeholder="Ex: ana.silva" placeholderTextColor={colors.textSecondary} style={styles.input} autoCapitalize="none" />
        <Text style={styles.label}>Senha</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Minimo 8 caracteres" placeholderTextColor={colors.textSecondary} style={styles.input} secureTextEntry returnKeyType="done" onSubmitEditing={handleSubmit} />
        <Pressable onPress={handleSubmit} disabled={isSubmitting} style={[styles.button, isSubmitting && styles.disabled]}>
          {isSubmitting ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.buttonText}>{isRegistering ? 'Criar conta' : 'Entrar'}</Text>}
        </Pressable>
        <Pressable onPress={() => setIsRegistering((value) => !value)}>
          <Text style={styles.helperText}>{isRegistering ? 'Ja possui conta? Entrar' : 'Primeiro acesso? Criar conta'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', gap: spacing.xl },
  hero: { gap: spacing.md },
  badge: { width: 72, height: 72, borderRadius: 22, backgroundColor: `${colors.primary}CC`, borderWidth: 1, borderColor: colors.borderStrong },
  title: { color: colors.textPrimary, fontSize: 42, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, maxWidth: 320 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  label: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, color: colors.textPrimary, paddingHorizontal: 14, paddingVertical: 14 },
  button: { alignItems: 'center', borderRadius: radius.md, paddingVertical: 14, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: `${colors.primary}E6` },
  disabled: { opacity: 0.55 },
  buttonText: { color: colors.textPrimary, fontWeight: '700' },
  helperText: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
});

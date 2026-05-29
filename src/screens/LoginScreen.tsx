import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '../components/Screen';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';

const GOOGLE_WEB_CLIENT_ID = '414746313533-iussv233o5osbdgjut9q472t8b23rpa7.apps.googleusercontent.com';

type GoogleLoginButtonProps = {
  isSigningIn: boolean;
  onAuthenticated: (accessToken: string) => Promise<void>;
};

function GoogleLoginButton({ isSigningIn, onAuthenticated }: GoogleLoginButtonProps) {
  const [request, response, promptAsync] = useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      return;
    }

    const accessToken = response.authentication?.accessToken;

    if (!accessToken) {
      Alert.alert('Falha no login', 'Nao foi possivel obter o token do Google.');
      return;
    }

    void onAuthenticated(accessToken);
  }, [onAuthenticated, response]);

  async function handleGoogleLogin() {
    if (!request) {
      Alert.alert('Login indisponivel', 'Aguarde o carregamento da autenticacao.');
      return;
    }

    const result = await promptAsync();

    if (result.type !== 'success') {
      Alert.alert('Login cancelado', 'Voce pode continuar com seu nome localmente.');
    }
  }

  return (
    <Pressable onPress={handleGoogleLogin} style={styles.googleButton} disabled={isSigningIn || !request}>
      {isSigningIn ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <>
          <MaterialCommunityIcons name="google" size={20} color={colors.textPrimary} />
          <Text style={styles.buttonText}>Continuar com Google</Text>
        </>
      )}
    </Pressable>
  );
}

function UnavailableGoogleLoginButton() {
  function handlePress() {
    Alert.alert('Nao disponivel ainda', 'O login com Google no app nativo ainda nao esta disponivel nesta versao.');
  }

  return (
    <Pressable onPress={handlePress} style={styles.googleButton}>
      <>
        <MaterialCommunityIcons name="google" size={20} color={colors.textPrimary} />
        <Text style={styles.buttonText}>Continuar com Google</Text>
      </>
    </Pressable>
  );
}

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleAuthReady, setIsGoogleAuthReady] = useState(false);
  const { signIn } = useAppState();
  const isGoogleLoginAvailable = Platform.OS === 'web';

  useEffect(() => {
    if (isGoogleLoginAvailable) {
      WebBrowser.maybeCompleteAuthSession();
      setIsGoogleAuthReady(true);
      return;
    }

    setIsGoogleAuthReady(false);
  }, [isGoogleLoginAvailable]);

  async function handleContinue() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Informe seu nome', 'Use um nome para personalizar as telas.');
      return;
    }

    await signIn({ name: trimmed, provider: 'local' });
  }

  async function handleGoogleAuthenticated(accessToken: string) {
    setIsSigningIn(true);

    try {
      const result = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!result.ok) {
        throw new Error('Nao foi possivel carregar os dados da conta Google.');
      }

      const data = await result.json();

      await signIn({
        name: String(data.name ?? data.given_name ?? 'Usuario').trim(),
        email: String(data.email ?? '').trim() || undefined,
        picture: String(data.picture ?? '').trim() || undefined,
        provider: 'google',
      });
    } catch (error) {
      Alert.alert('Falha no login', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <View style={styles.hero}>
        <View style={styles.badge} />
        <Text style={styles.title}>Focus</Text>
        <Text style={styles.subtitle}>Organize hábitos, rotina e progresso com persistência local.</Text>
      </View>

      <View style={styles.card}>
        {isGoogleLoginAvailable && isGoogleAuthReady ? (
          <GoogleLoginButton isSigningIn={isSigningIn} onAuthenticated={handleGoogleAuthenticated} />
        ) : isGoogleLoginAvailable ? (
          <View style={styles.googleButton}>
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        ) : <UnavailableGoogleLoginButton />}

        {!isGoogleLoginAvailable ? (
          <Text style={styles.helperText}>Toque no botao para ver o aviso. O login Google nativo ainda nao esta liberado nesta versao.</Text>
        ) : null}

        {isGoogleLoginAvailable && !isGoogleAuthReady ? (
          <Text style={styles.helperText}>Preparando login Google...</Text>
        ) : null}

        {isGoogleLoginAvailable ? (
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.divider} />
          </View>
        ) : null}

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
        <Pressable onPress={handleContinue} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Entrar sem Google</Text>
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
    backgroundColor: `${colors.primary}CC`,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
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
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  },
  googleButton: {
    backgroundColor: `${colors.primary}E6`,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
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
  buttonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -4,
  },
  secondaryButton: {
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  glowOne: {
    position: 'absolute',
    top: 30,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
  },
  glowTwo: {
    position: 'absolute',
    bottom: 20,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
});

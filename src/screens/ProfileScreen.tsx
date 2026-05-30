import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '../components/Screen';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing } from '../theme';

const ACCENTS = [
  '#7C3AED',
  '#A855F7',
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#EF4444',
];

const VISUAL_PREFERENCES = [
  { value: 'glass', label: 'Glass', description: 'Visual premium, translúcido e com destaque.' },
  { value: 'minimal', label: 'Minimal', description: 'Mais discreto, limpo e direto.' },
] as const;

export default function ProfileScreen() {
  const { user, syncNow, syncStatus, updateProfile, signOut } = useAppState();

  const [name, setName] = useState(user?.name ?? '');
  const [focusGoal, setFocusGoal] = useState(user?.focusGoal ?? '');
  const [picture, setPicture] = useState(user?.picture ?? '');
  const [accentColor, setAccentColor] = useState(user?.accentColor ?? colors.primary);
  const [visualPreference, setVisualPreference] = useState<'glass' | 'minimal'>(user?.visualPreference === 'minimal' ? 'minimal' : 'glass');

  useEffect(() => {
    setName(user?.name ?? '');
    setFocusGoal(user?.focusGoal ?? '');
    setPicture(user?.picture ?? '');
    setAccentColor(user?.accentColor ?? colors.primary);
    setVisualPreference(user?.visualPreference === 'minimal' ? 'minimal' : 'glass');
  }, [user]);

  const initials = useMemo(() => {
    const words = (name || user?.name || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'F';
    return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  }, [name, user?.name]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Nome obrigatório', 'Digite um nome para o perfil.');
      return;
    }

    await updateProfile({
      name: trimmedName,
      focusGoal: focusGoal.trim(),
      picture: picture.trim(),
      accentColor,
      notificationsEnabled: false,
      visualPreference,
    });
    Alert.alert('Perfil atualizado', 'As alterações foram salvas.');
  }

  function getSyncMessage() {
    if (!syncStatus.syncEnabled) {
      return 'Sincronizacao remota desativada. Configure a URL da API em app.json para enviar os dados.';
    }

    if (syncStatus.isSyncing) {
      return 'Sincronizando seus dados com a API externa.';
    }

    if (!syncStatus.isOnline) {
      return 'Sem internet no momento. O app continua salvando offline e envia quando a conexao voltar.';
    }

    if (syncStatus.lastSyncError) {
      return `Falha na ultima sincronizacao: ${syncStatus.lastSyncError}`;
    }

    if (syncStatus.hasPendingChanges) {
      return 'Existem alteracoes locais pendentes de sincronizacao.';
    }

    if (syncStatus.lastSyncedAt) {
      return `Ultima sincronizacao: ${new Date(syncStatus.lastSyncedAt).toLocaleString('pt-BR')}`;
    }

    return 'Nenhuma sincronizacao remota foi feita ainda.';
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.kicker}>Perfil</Text>
        <Text style={styles.title}>Personalize sua conta</Text>
        <Text style={styles.subtitle}>Ajuste nome, meta pessoal e aparência do perfil.</Text>
      </View>

      <View style={styles.card}>
        <View style={[styles.banner, { borderColor: accentColor + '66', backgroundColor: accentColor + '14' }]}>
          <View>
            <Text style={styles.bannerKicker}>Conta ativa</Text>
            <Text style={styles.bannerTitle}>{user?.provider === 'google' ? 'Google' : 'Local'}</Text>
          </View>
          <View style={styles.bannerMeta}>
            <Text style={styles.bannerMetaLabel}>Email</Text>
            <Text style={styles.bannerMetaValue}>{user?.email ?? 'Nao informado'}</Text>
          </View>
        </View>

        <View style={styles.avatarWrap}>
          {picture.trim() ? (
            <Image source={{ uri: picture.trim() }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: accentColor + '22' }]}>
              <Text style={[styles.avatarLetters, { color: accentColor }]}>{initials}</Text>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: user?.provider === 'google' ? colors.success : colors.warning }]} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nome exibido</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Seu nome" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Meta principal</Text>
          <TextInput value={focusGoal} onChangeText={setFocusGoal} style={styles.input} placeholder="Ex: Ler 20 min por dia" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Foto / avatar</Text>
          <TextInput value={picture} onChangeText={setPicture} style={styles.input} placeholder="URL da imagem, se quiser" placeholderTextColor={colors.textSecondary} autoCapitalize="none" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notificações</Text>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>Desativadas</Text>
              <Text style={styles.preferenceDescription}>Foram desligadas temporariamente para estabilizar a versao que vai para o GitHub.</Text>
            </View>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sincronizacao</Text>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>{syncStatus.isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={styles.preferenceDescription}>{getSyncMessage()}</Text>
            </View>
            <MaterialCommunityIcons name={syncStatus.isOnline ? 'cloud-check-outline' : 'cloud-off-outline'} size={20} color={syncStatus.isOnline ? accentColor : colors.textSecondary} />
          </View>
          <Pressable onPress={() => void syncNow()} disabled={!syncStatus.syncEnabled || syncStatus.isSyncing || !syncStatus.isOnline} style={[styles.button, styles.secondaryButton, styles.syncButton, (!syncStatus.syncEnabled || syncStatus.isSyncing || !syncStatus.isOnline) && styles.buttonDisabled]}>
            <MaterialCommunityIcons name="cloud-sync-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>{syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Visual preferido</Text>
          <View style={styles.preferenceColumn}>
            {VISUAL_PREFERENCES.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setVisualPreference(item.value)}
                style={[styles.preferenceRow, visualPreference === item.value && styles.preferenceRowSelected]}
              >
                <View style={styles.preferenceCopy}>
                  <Text style={styles.preferenceTitle}>{item.label}</Text>
                  <Text style={styles.preferenceDescription}>{item.description}</Text>
                </View>
                <View style={[styles.preferenceIndicator, visualPreference === item.value && { borderColor: accentColor, backgroundColor: `${accentColor}22` }]} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cor de destaque</Text>
          <View style={styles.colorRow}>
            {ACCENTS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setAccentColor(item)}
                style={[styles.colorDot, { backgroundColor: item }, accentColor === item && styles.colorDotSelected]}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={signOut} style={[styles.button, styles.secondaryButton]}>
            <MaterialCommunityIcons name="logout" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Sair</Text>
          </Pressable>

          <Pressable onPress={handleSave} style={[styles.button, styles.primaryButton]}>
            <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.primaryButtonText}>Salvar</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  kicker: {
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.textSecondary,
    lineHeight: 21,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
  },
  bannerKicker: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  bannerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  bannerMeta: {
    alignItems: 'flex-end',
    flex: 1,
  },
  bannerMetaLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  bannerMetaValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  avatarWrap: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: colors.borderGlass,
  },
  avatarFallback: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  avatarLetters: {
    fontSize: 28,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surfaceGlassStrong,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  preferenceColumn: {
    gap: 10,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.surfaceGlassStrong,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  preferenceRowSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: `${colors.primaryLight}18`,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  preferenceDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  preferenceIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: colors.textPrimary,
    borderWidth: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  primaryButton: {
    backgroundColor: `${colors.primary}E6`,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  syncButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

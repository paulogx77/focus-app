import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

export default function StatCard({ label, value, accent = colors.primary, helper }) {
  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
  },
  accent: {
    width: 40,
    height: 4,
    borderRadius: 999,
    marginBottom: 6,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});

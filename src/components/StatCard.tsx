import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

type StatCardProps = {
  label: string;
  value: ReactNode;
  accent?: string;
  helper?: ReactNode;
};

export default function StatCard({ label, value, accent = colors.primary, helper }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.glow, { backgroundColor: `${accent}20` }]} />
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
    overflow: 'hidden',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  glow: {
    position: 'absolute',
    top: -22,
    right: -10,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.glow,
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
    letterSpacing: -0.4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});

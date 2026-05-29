import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export default function Screen({ children, scroll = false, contentStyle, style }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={styles.topHairline} />
        <View style={styles.leftHairline} />
        <View style={styles.rightHairline} />
        <View style={styles.diagonalPanelLarge} />
        <View style={styles.centerBand} />
        <View style={styles.bottomPanel} />
      </View>

      {scroll ? (
        <ScrollView style={[styles.container, contentStyle]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topHairline: {
    position: 'absolute',
    top: 12,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: colors.lineSoft,
  },
  leftHairline: {
    position: 'absolute',
    top: 84,
    left: 18,
    width: 1,
    height: 120,
    backgroundColor: colors.lineSoft,
  },
  rightHairline: {
    position: 'absolute',
    top: '22%',
    right: 18,
    width: 1,
    height: 120,
    backgroundColor: colors.lineSoft,
  },
  diagonalPanelLarge: {
    position: 'absolute',
    top: -80,
    right: -140,
    width: 260,
    height: 420,
    backgroundColor: colors.panelTintStrong,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    transform: [{ rotate: '18deg' }],
  },
  centerBand: {
    position: 'absolute',
    top: '38%',
    left: 32,
    right: 32,
    height: 1,
    backgroundColor: colors.lineSoft,
    transform: [{ rotate: '-4deg' }],
  },
  bottomPanel: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 180,
    height: 220,
    backgroundColor: colors.panelTint,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    transform: [{ rotate: '-14deg' }],
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 32,
    gap: spacing.lg,
  },
});

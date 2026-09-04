import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { colors, radius, spacing } from '../theme';

export default function TestAdBanner() {
  useEffect(() => {
    void mobileAds().initialize();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ANUNCIO DE TESTE</Text>
      <BannerAd unitId={TestIds.ADAPTIVE_BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderGlass,
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: spacing.sm,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';

type ProgressBarProps = {
  value?: number;
  trackColor?: string;
  fillColor?: string;
};

export default function ProgressBar({ value = 0, trackColor = colors.surfaceGlassStrong, fillColor = colors.primary }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(1, value));

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <View style={[styles.fill, { width: `${safeValue * 100}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  fill: {
    height: '100%',
    borderRadius: radius.xl,
  },
});

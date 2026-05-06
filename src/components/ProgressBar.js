import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';

export default function ProgressBar({ value = 0, trackColor = colors.surfaceElevated, fillColor = colors.primary }) {
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
  },
  fill: {
    height: '100%',
    borderRadius: radius.xl,
  },
});

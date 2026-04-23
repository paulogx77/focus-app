import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ProgressBarProps {
  percentage: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  height = 6,
  color = '#7C3AED',
  backgroundColor = '#2A2A3E',
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, backgroundColor }]}>
      <Animated.View
        style={[styles.fill, { width, height, backgroundColor: color }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { borderRadius: 100, overflow: 'hidden', width: '100%' },
  fill:  { borderRadius: 100 },
});
import React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

type Props = {
  slots: (string | null)[];
  shakeAnim: Animated.Value;
  errorTint: boolean;
  successTint: boolean;
  onSlotPress: (index: number) => void;
};

const SLOT = 52;

export default function WordSlots({
  slots,
  shakeAnim,
  errorTint,
  successTint,
  onSlotPress,
}: Props) {
  const translateX = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });

  return (
    <Animated.View
      style={[
        styles.row,
        {transform: [{translateX}]},
        errorTint && styles.rowError,
        successTint && styles.rowSuccess,
      ]}>
      {slots.map((char, index) => (
        <Pressable
          key={`slot-${index}`}
          accessibilityRole="button"
          accessibilityLabel={
            char
              ? `Slot ${index + 1}, letter ${char}. Double tap to remove.`
              : `Empty slot ${index + 1}`
          }
          onPress={() => onSlotPress(index)}
          style={({pressed}) => [
            styles.slot,
            char ? styles.slotFilled : styles.slotEmpty,
            pressed && styles.slotPressed,
          ]}>
          <Text style={[styles.slotText, !char && styles.slotTextEmpty]}>
            {char ?? '_'}
          </Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  rowError: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  rowSuccess: {
    backgroundColor: 'rgba(67, 233, 123, 0.2)',
  },
  slot: {
    minWidth: SLOT,
    minHeight: SLOT,
    margin: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(250,138,62,0.45)',
    backgroundColor: 'rgba(250,138,62,0.06)',
  },
  slotFilled: {
    borderWidth: 2,
    borderColor: '#FA8A3E',
    backgroundColor: 'rgba(255,243,232,0.95)',
  },
  slotPressed: {
    opacity: 0.85,
  },
  slotText: {
    fontSize: 26,
    fontFamily: 'CarmenSans-Bold',
    color: '#1A2B4C',
    letterSpacing: 2,
  },
  slotTextEmpty: {
    color: '#90A4AE',
  },
});

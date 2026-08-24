import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

type ButtonProps = {
  title:  string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles. button,
        variant === 'secondary' && styles.secondaryButton,
      ]}
      onPress={onPress}>
      <Text
        style={[
          styles. buttonText,
          variant === 'secondary' && styles.secondaryText,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor:  '#fff',
    borderWidth:  2,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#007AFF',
  },
});
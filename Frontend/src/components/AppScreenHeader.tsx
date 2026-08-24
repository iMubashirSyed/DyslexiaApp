import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type AppScreenHeaderProps = {
  title: string;
  onBack: () => void;
  onHelp?: () => void;
};

/**
 * Matches Reading Coach / Letter Trace / Alphabet Matcher headers.
 */
export default function AppScreenHeader({
  title,
  onBack,
  onHelp,
}: AppScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.headerBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <Text style={styles.headerIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {onHelp ? (
        <TouchableOpacity
          onPress={onHelp}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Help">
          <Text style={styles.headerIcon}>?</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 22,
    color: '#2c3e50',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '800',
  },
});

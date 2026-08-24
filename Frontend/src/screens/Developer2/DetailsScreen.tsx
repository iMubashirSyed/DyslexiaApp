import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, SafeAreaView} from 'react-native';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList, MainTabParamList} from '../../navigation/types';

type DetailsScreenProps = {
  navigation: CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'Details'>,
    BottomTabScreenProps<MainTabParamList, 'Home'>
  >['navigation'];
  route: NativeStackScreenProps<HomeStackParamList, 'Details'>['route'];
};

export default function DetailsScreen({navigation, route}:  DetailsScreenProps) {
  const {itemId} = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Exercise Details</Text>
        <Text style={styles.subtitle}>Developer 2's Screen</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Exercise ID:</Text>
          <Text style={styles.value}>{itemId}</Text>

          <Text style={styles.label}>Description:</Text>
          <Text style={styles.description}>
            This is a detailed view of the selected exercise. You can add more
            information about the exercise here, including instructions, duration,
            difficulty level, etc.
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>15 min</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles. statBox}>
              <Text style={styles.statValue}>Medium</Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>← Back to Search</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle:  {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  card:  {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  statsContainer:  {
    flexDirection: 'row',
    justifyContent:  'space-around',
    marginTop: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize:  14,
    color: '#666',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
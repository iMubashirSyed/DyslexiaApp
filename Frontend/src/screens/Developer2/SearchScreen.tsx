import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList, MainTabParamList} from '../../navigation/types';

type SearchScreenProps = {
  navigation: CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'Search'>,
    BottomTabScreenProps<MainTabParamList, 'Home'>
  >['navigation'];
};

const SAMPLE_DATA = [
  {id: '1', title: 'Reading Exercise 1', category: 'Reading'},
  {id: '2', title: 'Writing Practice', category: 'Writing'},
  {id: '3', title: 'Spelling Game', category: 'Spelling'},
  {id: '4', title: 'Memory Training', category: 'Memory'},
];

export default function SearchScreen({navigation}: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = SAMPLE_DATA.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderItem = ({item}:  {item: typeof SAMPLE_DATA[0]}) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('Details', {itemId: item.id})}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Search Exercises</Text>
        <Text style={styles.subheader}>Developer 2's Screen</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search for exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles. list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No results found</Text>
          }
        />
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
    padding:  20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  list: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding:  15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  itemTitle: {
    fontSize:  18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemCategory:  {
    fontSize: 14,
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
  },
});
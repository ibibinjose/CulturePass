import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Linking } from 'react-native';
import { useURL } from 'expo-linking';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DeepLinkTestScreen() {
  const insets = useSafeAreaInsets();
  const url = useURL();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (url) {
      setHistory(prev => [url, ...prev].slice(0, 20));
      console.log('[DeepLinkTest] Received URL:', url);
    }
  }, [url]);

  const testLink = (link: string) => {
    Linking.openURL(link);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Deep Link Test' }} />

      <Text style={styles.title}>Deep Link Debugger</Text>
      <Text style={styles.subtitle}>Open links from outside the app or use the buttons below.</Text>

      <View style={styles.current}>
        <Text style={styles.label}>Current / Last URL:</Text>
        <Text style={styles.url}>{url || 'None yet'}</Text>
      </View>

      <ScrollView style={styles.history}>
        <Text style={styles.label}>History (last 20):</Text>
        {history.length === 0 ? (
          <Text style={styles.empty}>No deep links received yet.</Text>
        ) : (
          history.map((h, i) => (
            <Text key={i} style={styles.historyItem}>{h}</Text>
          ))
        )}
      </ScrollView>

      <View style={styles.buttons}>
        <Button title="Test: culturepass://profile" onPress={() => testLink('culturepass://profile')} />
        <Button title="Test: https://culturepass.co/tickets/123" onPress={() => testLink('https://culturepass.co/tickets/123')} />
        <Button title="Test: culturepass://hostspace" onPress={() => testLink('culturepass://hostspace')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0B0B14' },
  title: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  subtitle: { color: '#aaa', marginBottom: 16 },
  current: { backgroundColor: '#1a1a2e', padding: 12, borderRadius: 8, marginBottom: 16 },
  label: { color: '#888', fontSize: 12, marginBottom: 4 },
  url: { color: '#4ade80', fontSize: 14, fontFamily: 'monospace' },
  history: { flex: 1, backgroundColor: '#111', borderRadius: 8, padding: 12, marginBottom: 16 },
  historyItem: { color: '#ccc', fontSize: 12, marginBottom: 4, fontFamily: 'monospace' },
  empty: { color: '#666', fontStyle: 'italic' },
  buttons: { gap: 8 },
});
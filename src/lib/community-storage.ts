import AsyncStorage from '@react-native-async-storage/async-storage';

const communityJoinKey = (id: string) => `joined:${id}`;

export async function markCommunityJoined(id: string): Promise<void> {
  await AsyncStorage.setItem(communityJoinKey(id), '1');
}

export async function clearCommunityJoinedMark(id: string): Promise<void> {
  await AsyncStorage.removeItem(communityJoinKey(id));
}

export async function getMarkedJoinedCommunityIds(): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  const joinedKeys = keys.filter((key) => key.startsWith('joined:'));
  return joinedKeys.map((key) => key.replace(/^joined:/, ''));
}

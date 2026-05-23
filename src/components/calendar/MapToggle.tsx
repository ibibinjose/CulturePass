import { View, Text, Switch, StyleSheet } from "react-native"
import { useColors } from '@/hooks/useColors';

export default function MapToggle({ showMap, onToggle }: { showMap: boolean, onToggle: (value: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.text }]}>Map View</Text>
      <Switch value={showMap} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  label: {
    fontSize: 15,
    marginRight: 10,
  },
})
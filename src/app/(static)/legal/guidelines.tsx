import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles } from '@/design-system/tokens/theme';
import { M3TopAppBar } from '@/design-system/ui';
import { goBackOrReplace } from '@/lib/navigation';

const RULES = [
  {
    title: 'Be respectful and inclusive',
    body: 'Treat all members with dignity. Harassment, hate speech, or discriminatory behaviour is not allowed.',
  },
  {
    title: 'Share authentic and lawful content',
    body: 'Only upload content you own or are authorised to share. Avoid misinformation, spam, and illegal content.',
  },
  {
    title: 'Protect privacy',
    body: 'Do not publish private personal information without consent. Respect community and event participant privacy.',
  },
  {
    title: 'Event and ticket integrity',
    body: 'Do not create misleading event listings or misuse tickets/perks. Fraudulent activity may result in account suspension.',
  },
  {
    title: 'Report issues responsibly',
    body: 'Use reporting/support channels for abusive content or suspicious activity. Repeated false reports are not allowed.',
  },
];

export default function CommunityGuidelinesScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={styles.container}>
      <M3TopAppBar title="Guidelines" onBack={() => goBackOrReplace('/menu')} denseWeb webChromeless />
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset + 16 }}
      >
        <View style={{ height: 8 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, paddingTop: 10 }}>
        <Text style={styles.lead}> 
          These rules help keep CulturePass safe, welcoming, and useful for everyone.
        </Text>

        {RULES.map((rule, idx) => (
          <View key={rule.title} style={styles.card}>
            <Text style={styles.cardTitle}>{idx + 1}. {rule.title}</Text>
            <Text style={styles.cardBody}>{rule.body}</Text>
          </View>
        ))}

        <View style={styles.footerCard}>
          <Ionicons name="shield-checkmark" size={20} color={CultureTokens.indigo} />
          <Text style={styles.footerText}>
            By using CulturePass, you agree to follow these guidelines together with our Terms and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  lead:       { ...TextStyles.cardBody, lineHeight: 22, marginBottom: 20, color: colors.textSecondary, textAlign: 'center' },
  card:       { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 16, backgroundColor: colors.surface, borderColor: colors.borderLight },
  cardTitle:  { ...TextStyles.headline, marginBottom: 6, color: colors.text },
  cardBody:   { ...TextStyles.cardBody, lineHeight: 22, color: colors.textSecondary },
  footerCard: { marginTop: 12, borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, backgroundColor: CultureTokens.indigo + '15', borderWidth: 1, borderColor: CultureTokens.indigo + '30' },
  footerText: { ...TextStyles.label, lineHeight: 20, color: colors.textSecondary },
});

import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CultureTokens, gradients } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';

interface WidgetIdentityQRCardProps {
  displayName: string;
  culturePassId: string;
  role?: string;
  membershipTier?: string;
}

export function WidgetIdentityQRCard({
  displayName,
  culturePassId,
  role,
  membershipTier,
}: WidgetIdentityQRCardProps) {
  const isPlus =
    (membershipTier ?? '').toLowerCase().includes('+') ||
    (membershipTier ?? '').toLowerCase().includes('plus') ||
    (membershipTier ?? '').toLowerCase().includes('premium');

  const roleLabel =
    role === 'business' ? 'BUSINESS CARD' :
    role === 'organizer' ? 'ORGANISER CARD' :
    isPlus ? 'CULTUREPASS+' :
    'DIGITAL IDENTITY';

  const tierColor = isPlus ? CultureTokens.gold : CultureTokens.teal;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push('/profile/digital-id')}
      accessibilityRole="button"
      accessibilityLabel="Open Identity QR Code"
    >
      {/* Signature gradient — violet → coral */}
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Gloss highlight */}
      <View style={styles.gloss} pointerEvents="none" />

      {/* Content row */}
      <View style={styles.content}>
        {/* Left: identity info */}
        <View style={styles.infoSide}>
          <Text style={[TextStyles.labelSemibold, { color: 'rgba(255,255,255,0.65)', letterSpacing: 1, fontSize: 9 }]}>
            {roleLabel}
          </Text>
          <Text style={[TextStyles.title3, styles.nameText]} numberOfLines={1}>
            {displayName}
          </Text>

          {/* CP ID chip */}
          <View style={styles.idChip}>
            <Ionicons name="finger-print" size={13} color="#FFFFFF" />
            <Text style={[TextStyles.captionSemibold, { color: '#FFFFFF', fontSize: 11 }]}>
              {culturePassId}
            </Text>
          </View>

          {/* Membership tier badge */}
          {membershipTier ? (
            <View style={[styles.tierBadge, { borderColor: `${tierColor}60`, backgroundColor: `${tierColor}20` }]}>
              {isPlus ? <Ionicons name="star" size={10} color={tierColor} /> : null}
              <Text style={[styles.tierText, { color: tierColor }]}>
                {membershipTier}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Right: QR placeholder */}
        <View style={styles.qrSide}>
          <View style={styles.qrContainer}>
            <Ionicons name="qr-code" size={46} color={CultureTokens.indigo} />
          </View>
          <Text style={styles.scanLabel}>SCAN TO CONNECT</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 148,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(147,51,234,0.4)',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(79,70,229,0.25)' } as object,
      default: {
        shadowColor: CultureTokens.violet,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  gloss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoSide: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
    paddingRight: 12,
  },
  nameText: {
    color: '#FFFFFF',
    marginTop: 2,
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  tierText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  qrSide: {
    alignItems: 'center',
    gap: 6,
  },
  qrContainer: {
    width: 72,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: 'inset 0 0 10px rgba(0,0,0,0.08)' } as object,
      default: {},
    }),
  },
  scanLabel: {
    fontSize: 8,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },
});

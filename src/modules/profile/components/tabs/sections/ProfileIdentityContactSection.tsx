import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, MaterialExpressive, BorderTokens } from '@/design-system/tokens/theme';
import { M3SectionHeader } from '@/design-system/ui';
import { GlassView } from '@/design-system/ui/GlassView';
import { TIER_CFG, memberDate } from '@/modules/profile/components/tabs/ProfileUtils';
import { cpid as cpidStyles, det as detStyles } from '@/modules/profile/components/tabs/ProfileStyles';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { profileSectionLayout } from './profileSectionLayout';

interface ProfileIdentityContactSectionProps {
  userId: string | null;
  displayUser: any;
  tierKey: string;
  locationText: string;
  nav: (path: string) => void;
}

export const ProfileIdentityContactSection = React.memo(({
  userId,
  displayUser,
  tierKey,
  locationText,
  nav,
}: ProfileIdentityContactSectionProps) => {
  const m3 = useM3Colors();
  const { hPad } = useLayout();

  const tierConf = TIER_CFG[tierKey] ?? TIER_CFG.free;
  const cpidStr = displayUser?.culturePassId ?? `CP-${(userId || '').slice(-6).toUpperCase()}`;
  const since = memberDate(displayUser?.createdAt);

  return (
    <>
      <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader title="CulturePass ID" />
        <GlassView style={[styles.idGlass, { borderColor: m3.primary + '35' }]} contentStyle={styles.idGlassContent}>
          <View style={[styles.idTopRow, styles.idTopRowStart]}>
            <View style={cpidStyles.brandRow}>
              <View style={cpidStyles.brandLogoWrap}>
                <Image
                  source={require('@/assets/images/culturepass-logo.png')}
                  style={cpidStyles.brandLogoImage}
                  contentFit="contain"
                  accessibilityLabel="CulturePass"
                />
              </View>
            </View>
          </View>

          <View style={styles.idMiddleRow}>
            <View style={cpidStyles.metaCol}>
              <Text style={[cpidStyles.idLabel, { color: m3.onSurfaceVariant }]} numberOfLines={1}>SERIAL NUMBER</Text>
              <Text style={[cpidStyles.idValue, styles.idValueLarge, { color: m3.onSurface }]} numberOfLines={1}>{cpidStr}</Text>
              <Text style={[cpidStyles.idLabel, { color: tierConf.color, marginTop: 6 }]} numberOfLines={1}>MEMBER SINCE</Text>
              <Text style={[cpidStyles.memberText, { color: m3.onSurface }]} numberOfLines={1}>{since || 'N/A'}</Text>
            </View>
            <View style={[cpidStyles.qrWrap, { borderColor: m3.outlineVariant, backgroundColor: BorderTokens.white }]}>
              <QRCode
                value={`culturepass://profile/${displayUser?.id || userId}`}
                size={64}
                backgroundColor="transparent"
                color={BorderTokens.black}
                ecl="H"
                logo={require('@/assets/images/culturepass-logo.png')}
                logoSize={64 * 0.22}
                logoBorderRadius={3}
                logoBackgroundColor={BorderTokens.white}
                logoMargin={1.5}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.idBtn, { backgroundColor: m3.primary, opacity: pressed ? 0.88 : 1 }]}
            onPress={() => nav('/profile/qr')}
            accessibilityRole="button"
            accessibilityLabel="Show digital ID"
          >
            <Text style={[styles.idBtnText, { color: m3.onPrimary }]} numberOfLines={1}>Show Digital ID</Text>
            <Ionicons name="arrow-forward" size={16} color={m3.onPrimary} />
          </Pressable>
        </GlassView>
      </View>

      {(locationText || displayUser?.website || displayUser?.phone || displayUser?.lgaCode) ? (
        <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
          <M3SectionHeader title="Contact info" />
          <View style={[styles.shell, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant }]}>
            {locationText ? (
              <View style={detStyles.row}>
                <View style={[detStyles.iconWrap, { backgroundColor: m3.primaryContainer }]}>
                  <Ionicons name="location" size={20} color={m3.onPrimaryContainer} />
                </View>
                <View style={detStyles.text}>
                  <Text style={[detStyles.label, { color: m3.onSurfaceVariant }]} numberOfLines={1}>Current city</Text>
                  <Text style={[detStyles.value, { color: m3.onSurface }]} numberOfLines={2}>{locationText}</Text>
                </View>
              </View>
            ) : null}
            {displayUser?.lgaCode ? (
              <>
                {locationText ? <View style={[styles.divider, { backgroundColor: m3.outlineVariant }]} /> : null}
                <Pressable style={detStyles.row} onPress={() => nav('/my-council')} accessibilityRole="button">
                  <View style={[detStyles.iconWrap, { backgroundColor: m3.secondaryContainer }]}>
                    <Ionicons name="business" size={20} color={m3.onSecondaryContainer} />
                  </View>
                  <View style={detStyles.text}>
                    <Text style={[detStyles.label, { color: m3.onSurfaceVariant }]} numberOfLines={1}>Council area</Text>
                    <Text style={[detStyles.value, { color: m3.secondary }]} numberOfLines={1}>LGA {displayUser.lgaCode}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={m3.onSurfaceVariant} />
                </Pressable>
              </>
            ) : null}
            {displayUser?.website ? (
              <>
                {(locationText || displayUser?.lgaCode) ? <View style={[styles.divider, { backgroundColor: m3.outlineVariant }]} /> : null}
                <Pressable style={detStyles.row} onPress={() => openExternalUrl(displayUser.website!)} accessibilityRole="link">
                  <View style={[detStyles.iconWrap, { backgroundColor: m3.tertiaryContainer }]}>
                    <Ionicons name="globe" size={20} color={m3.onTertiaryContainer} />
                  </View>
                  <View style={detStyles.text}>
                    <Text style={[detStyles.label, { color: m3.onSurfaceVariant }]} numberOfLines={1}>Website</Text>
                    <Text style={[detStyles.value, { color: m3.tertiary }]} numberOfLines={1}>{displayUser.website}</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={m3.onSurfaceVariant} />
                </Pressable>
              </>
            ) : null}
            {displayUser?.phone ? (
              <>
                <View style={[styles.divider, { backgroundColor: m3.outlineVariant }]} />
                <View style={detStyles.row}>
                  <View style={[detStyles.iconWrap, { backgroundColor: m3.errorContainer }]}>
                    <Ionicons name="call" size={20} color={m3.onErrorContainer} />
                  </View>
                  <View style={detStyles.text}>
                    <Text style={[detStyles.label, { color: m3.onSurfaceVariant }]} numberOfLines={1}>Phone</Text>
                    <Text style={[detStyles.value, { color: m3.onSurface }]} numberOfLines={1}>{displayUser.phone}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );
});

ProfileIdentityContactSection.displayName = 'ProfileIdentityContactSection';

const styles = StyleSheet.create({
  shell: {
    borderRadius: MaterialExpressive.shape.cornerExtraLarge,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    marginRight: 16,
  },
  idGlass: {},
  idGlassContent: { padding: 24 },
  idTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  idTopRowStart: { justifyContent: 'flex-start' },
  idMiddleRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 24 },
  idValueLarge: { fontSize: 20 },
  idBtn: { height: 52, borderRadius: MaterialExpressive.shape.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  idBtnText: { fontSize: 15, fontFamily: FontFamily.bold },
});
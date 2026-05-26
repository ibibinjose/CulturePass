import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { StaticPageLayout } from '@/components/static/StaticPageLayout';
import cookiesData from '@/data/static/cookies.json';
import { goBackOrReplace } from '@/lib/navigation';

export default function CookiesScreen() {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <StaticPageLayout
      title={cookiesData.title}
      lastUpdated={cookiesData.lastUpdated}
      intro={cookiesData.heroSubtitle}
      sections={cookiesData.sections}
      heroIcon="shield-checkmark"
      heroColor={CultureTokens.gold}
      onBack={() => goBackOrReplace('/menu')}
    >
      <View style={styles.customContent}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          Types of Data We Collect
        </Text>
        
        <View style={styles.cookieList}>
          {cookiesData.cookieTypes.map((ct, idx) => (
            <Animated.View 
              key={idx} 
              entering={FadeInDown.delay(200 + idx * 100).springify().damping(16)}
            >
              <View style={styles.cookieCard}>
                <View style={styles.cookieCardHeader}>
                  <View style={[styles.cookieIconWell, { backgroundColor: `${ct.color}15` }]}>
                    <Ionicons name={ct.icon as any} size={24} color={ct.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cookieName, { color: colors.text }]}>{ct.name}</Text>
                    {ct.required && (
                      <View style={[styles.requiredBadge, { backgroundColor: `${CultureTokens.coral}15` }]}>
                        <Text style={[styles.requiredBadgeText, { color: CultureTokens.coral }]}>Required</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.cookieDesc, { color: colors.textSecondary }]}>{ct.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
      </View>
    </StaticPageLayout>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  customContent: {
    marginBottom: 40,
  },
  sectionHeader: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    marginBottom: 24,
  },
  cookieList: {
    gap: 16,
  },
  cookieCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.06)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0px 8px 24px rgba(0,0,0,0.04)" }
    })
  },
  cookieCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cookieIconWell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cookieName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    marginBottom: 4,
  },
  requiredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  requiredBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cookieDesc: {
    ...TextStyles.body,
    fontSize: 15,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 40,
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Card } from '@/design-system/ui';
import { M3Typography, Radius } from '@/design-system/tokens/theme';

interface NationBuildersPromoProps {
  variant?: 'compact' | 'full';
  onCTAPress?: () => void;
}

export function NationBuildersPromo({ 
  variant = 'full', 
  onCTAPress 
}: NationBuildersPromoProps) {
  const m3Colors = useM3Colors();

  const handleCTAPress = () => {
    if (onCTAPress) {
      onCTAPress();
    } else {
      // Navigate to the Nation Builders Program page
      router.push('/NationBuildersProgram');
    }
  };

  const handleExternalLink = () => {
    // External linking would typically happen here
  };

  if (variant === 'compact') {
    return (
      <M3Card 
        variant="elevated" 
        style={[
          styles.compactCard, 
          { 
            backgroundColor: m3Colors.primaryContainer,
            borderColor: m3Colors.outlineVariant,
          }
        ]}
        onPress={handleCTAPress}
      >
        <View style={styles.compactContent}>
          <View style={[styles.compactBadge, { backgroundColor: m3Colors.primary }]}>
            <Ionicons name="star" size={16} color={m3Colors.onPrimary} />
          </View>
          <Text style={[styles.compactTitle, { color: m3Colors.onPrimaryContainer }]}>
            Nation Builders
          </Text>
          <Text style={[styles.compactSubtitle, { color: m3Colors.onPrimaryContainer }]}>
            You serve Sydney. Now let Sydney serve you back.
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={m3Colors.onPrimaryContainer} 
            style={styles.compactChevron} 
          />
        </View>
      </M3Card>
    );
  }

  return (
    <M3Card 
      variant="elevated" 
      style={[
        styles.fullCard, 
        { 
          backgroundColor: m3Colors.secondaryContainer,
          borderColor: m3Colors.outlineVariant,
        }
      ]}
    >
      <View style={styles.fullContent}>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: m3Colors.primary }]}>
            <Ionicons name="star" size={16} color={m3Colors.onPrimary} />
            <Text style={[styles.badgeText, { color: m3Colors.onPrimary }]}>
              NATION BUILDERS
            </Text>
          </View>
          <Text style={[styles.title, { color: m3Colors.onSecondaryContainer }]}>
            You serve Sydney. Now let Sydney serve you back.
          </Text>
        </View>

        <Text style={[styles.description, { color: m3Colors.onSecondaryContainer }]}>
          Essential workers get 50% off CulturePass+ membership. The people who build Sydney deserve to experience and shape its culture too.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="ticket" size={20} color={m3Colors.primary} />
            <Text style={[styles.featureText, { color: m3Colors.onSecondaryContainer, marginLeft: 8 }]}>
              $69/year (50% off)
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="gift" size={20} color={m3Colors.primary} />
            <Text style={[styles.featureText, { color: m3Colors.onSecondaryContainer, marginLeft: 8 }]}>
              Birthday gifts
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={20} color={m3Colors.primary} />
            <Text style={[styles.featureText, { color: m3Colors.onSecondaryContainer, marginLeft: 8 }]}>
              Exclusive access
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: m3Colors.primary }]}
            onPress={handleCTAPress}
            accessibilityLabel="Learn More about Nation Builders program"
          >
            <Text style={[styles.actionButtonText, { color: m3Colors.onPrimary }]}>
              Learn More
            </Text>
            <Ionicons name="chevron-forward" size={16} color={m3Colors.onPrimary} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.linkButton]}
            onPress={handleExternalLink}
            accessibilityLabel="Apply for Nation Builders program"
          >
            <Text style={[styles.linkButtonText, { color: m3Colors.primary }]}>
              Apply Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </M3Card>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    margin: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  compactBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactTitle: {
    ...M3Typography.titleMedium,
    flex: 1,
  },
  compactSubtitle: {
    ...M3Typography.bodySmall,
    flex: 1,
    marginRight: 8,
  },
  compactChevron: {
    marginLeft: 8,
  },
  fullCard: {
    margin: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
    }),
  },
  fullContent: {
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 6,
  },
  badgeText: {
    ...M3Typography.labelSmall,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    ...M3Typography.headlineSmall,
  },
  description: {
    ...M3Typography.bodyMedium,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    ...M3Typography.bodySmall,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  actionButtonText: {
    ...M3Typography.labelLarge,
  },
  linkButton: {
    padding: 8,
  },
  linkButtonText: {
    ...M3Typography.labelLarge,
  },
});
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { HeaderTokens, FontFamily, CultureTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button } from '@/design-system/ui';

interface MemberData {
  id: string;
  name: string;
  username: string;
  email: string;
  birthday: string;
  attendedCount: number;
  communitiesCount: number;
  favoriteCategory: string;
  interests: string[];
  moneySpentCents: number;
  timeSpentHours: number;
}

// Mock seed database for member monitoring
const SEED_MEMBERS: MemberData[] = [
  {
    id: 'mem-01',
    name: 'Sofia Rodriguez',
    username: 'sofia_r',
    email: 'sofia.r@example.com',
    birthday: '1995-06-12',
    attendedCount: 8,
    communitiesCount: 4,
    favoriteCategory: 'Dining & Classes',
    interests: ['Tango', 'Latin', 'Yoga', 'Spanish Food'],
    moneySpentCents: 24500,
    timeSpentHours: 24,
  },
  {
    id: 'mem-02',
    name: 'Chen Wei',
    username: 'chen_w',
    email: 'chen.wei@example.com',
    birthday: '1992-06-28',
    attendedCount: 12,
    communitiesCount: 3,
    favoriteCategory: 'Art & Movies',
    interests: ['Cinema', 'Tea Culture', 'Calligraphy', 'Meditation'],
    moneySpentCents: 18000,
    timeSpentHours: 36,
  },
  {
    id: 'mem-03',
    name: 'Amara Diop',
    username: 'amara_d',
    email: 'amara.diop@example.com',
    birthday: '1998-04-15',
    attendedCount: 3,
    communitiesCount: 2,
    favoriteCategory: 'Music & Dance',
    interests: ['Drumming', 'African Rhythms', 'Dance', 'Festivals'],
    moneySpentCents: 9500,
    timeSpentHours: 12,
  },
  {
    id: 'mem-04',
    name: 'Liam O\'Connor',
    username: 'liam_oc',
    email: 'liam.oc@example.com',
    birthday: '1990-09-02',
    attendedCount: 15,
    communitiesCount: 6,
    favoriteCategory: 'Classes & Sports',
    interests: ['Yoga', 'Fitness', 'Meditation', 'Irish Folklore'],
    moneySpentCents: 32000,
    timeSpentHours: 45,
  },
  {
    id: 'mem-05',
    name: 'Priya Patel',
    username: 'priya_p',
    email: 'priya.patel@example.com',
    birthday: '1996-06-03',
    attendedCount: 6,
    communitiesCount: 5,
    favoriteCategory: 'Dining & Festivals',
    interests: ['Yoga', 'Fusion Music', 'Indian Food', 'Diwali'],
    moneySpentCents: 15500,
    timeSpentHours: 18,
  },
  {
    id: 'mem-06',
    name: 'Mateo Silva',
    username: 'mateo_s',
    email: 'mateo.silva@example.com',
    birthday: '1994-11-22',
    attendedCount: 2,
    communitiesCount: 1,
    favoriteCategory: 'Movies & Classes',
    interests: ['Workout', 'Film Screenings', 'Tango'],
    moneySpentCents: 4500,
    timeSpentHours: 6,
  }
];

export default function MemberMonitoringScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'birthdays' | 'highly_active' | 'low_active'>('all');

  // Compute aggregated stats
  const stats = useMemo(() => {
    const totalMembers = SEED_MEMBERS.length * 850 + 142; // Scaled mock stats
    const totalSpent = SEED_MEMBERS.reduce((sum, m) => sum + m.moneySpentCents, 0) * 80;
    const currentMonthBirthdays = SEED_MEMBERS.filter(m => m.birthday.split('-')[1] === '06').length * 24;
    const totalAttended = SEED_MEMBERS.reduce((sum, m) => sum + m.attendedCount, 0) * 75;

    return {
      totalMembers,
      totalSpent: Math.round(totalSpent / 100),
      currentMonthBirthdays,
      totalAttended,
    };
  }, []);

  // Filter members
  const filteredMembers = useMemo(() => {
    let list = SEED_MEMBERS;

    // Filter by quick tab
    if (selectedFilter === 'birthdays') {
      // June birthdays
      list = list.filter(m => m.birthday.split('-')[1] === '06');
    } else if (selectedFilter === 'highly_active') {
      list = list.filter(m => m.attendedCount >= 8);
    } else if (selectedFilter === 'low_active') {
      list = list.filter(m => m.attendedCount < 8);
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.username.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.interests.some(i => i.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedFilter, search]);

  const handleSendGift = (name: string) => {
    Alert.alert(
      '🎁 Birthday Gift Sent',
      `Sent a 20% discount code + free drink birthday perk campaign to ${name}!`
    );
  };

  const handleFreePromo = (name: string) => {
    Alert.alert(
      '🎟️ Free Ticket Promotion',
      `Sent a complimentary ticket code for next week's classes/events to ${name} to tackle loneliness and boost community interaction.`
    );
  };

  const handleRecommendPerks = (name: string) => {
    Alert.alert(
      '✨ Personalized Perks Sent',
      `Sent custom dining discounts and event recommendations aligned with ${name}'s interest tags.`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Member Integration & Monitoring</Text>
          <View style={[styles.statusPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>INTEGRATION ENGINE</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 24, gap: 20 }}>
        
        {/* Intro description */}
        <View style={{ gap: 4 }}>
          <Text style={[styles.subtitle, { color: colors.text }]}>Social Integration Dashboard</Text>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            Combat loneliness and support migrants/newcomers in naturalising with local culture. Mirror their favorite categories and tag interests, and stimulate engagement using birthday vouchers, free ticket promos, and time/money spending metrics.
          </Text>
        </View>

        {/* Aggregate Stats Row */}
        <GlassView contentStyle={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>TOTAL USERS</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalMembers}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Social seekers</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>TOTAL REVENUE</Text>
              <Text style={[styles.statValue, { color: CultureTokens.teal }]}>${stats.totalSpent}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Community spending</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>BIRTHDAYS (JUNE)</Text>
              <Text style={[styles.statValue, { color: CultureTokens.coral }]}>{stats.currentMonthBirthdays}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Gift candidates</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>EVENT ATTENDANCES</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalAttended}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Stamps unlocked</Text>
            </View>
          </View>
        </GlassView>

        {/* Filters and Search Bar */}
        <View style={styles.controlsRow}>
          {/* Tab Filters */}
          <View style={[styles.tabs, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
            {([
              { key: 'all', label: 'All Users' },
              { key: 'birthdays', label: '🎂 Birthdays (June)' },
              { key: 'highly_active', label: '🔥 Active' },
              { key: 'low_active', label: '🧊 Low Active' },
            ] as const).map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setSelectedFilter(tab.key)}
                  style={[
                    styles.tabButton,
                    active && { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 1 }
                  ]}
                >
                  <Text style={[
                    styles.tabText,
                    { color: active ? colors.text : colors.textSecondary },
                    active && { fontFamily: FontFamily.semibold }
                  ]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search Input */}
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              placeholder="Search by name, interests..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Users List */}
        <View style={{ gap: 16 }}>
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="filter-outline" size={32} color={colors.textTertiary} />
              <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.medium, marginTop: 8 }}>
                No members found matching filter
              </Text>
            </View>
          ) : (
            filteredMembers.map((member) => {
              const isJuneBirthday = member.birthday.split('-')[1] === '06';
              return (
                <GlassView key={member.id} contentStyle={styles.memberCard}>
                  <View style={styles.cardHeader}>
                    {/* Icon / Avatar well */}
                    <View style={[styles.avatarWell, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name="person" size={20} color={colors.primary} />
                    </View>

                    {/* Member meta */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                        <Text style={[styles.memberUser, { color: colors.textTertiary }]}>@{member.username}</Text>
                        {isJuneBirthday && (
                          <View style={[styles.birthdayBadge, { backgroundColor: CultureTokens.coral + '22' }]}>
                            <Ionicons name="gift-outline" size={11} color={CultureTokens.coral} />
                            <Text style={[styles.birthdayBadgeText, { color: CultureTokens.coral }]}>BIRTHDAY MONTH</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{member.email}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                  {/* Core profile details */}
                  <View style={styles.detailGrid}>
                    <View style={styles.detailBox}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>BIRTHDAY</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{member.birthday}</Text>
                    </View>

                    <View style={styles.detailBox}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>EVENTS ATTENDED</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{member.attendedCount} events</Text>
                    </View>

                    <View style={styles.detailBox}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>MONEY SPENT</Text>
                      <Text style={[styles.detailValue, { color: CultureTokens.teal }]}>${(member.moneySpentCents / 100).toFixed(2)}</Text>
                    </View>

                    <View style={styles.detailBox}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>TIME ENGAGED</Text>
                      <Text style={[styles.detailValue, { color: colors.primary }]}>{member.timeSpentHours} hrs</Text>
                    </View>
                  </View>

                  <View style={{ gap: 8, marginVertical: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>FAVORITE LANES:</Text>
                      <View style={[styles.lanePill, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.laneText, { color: colors.text }]}>{member.favoriteCategory}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>INTEREST TAGS:</Text>
                      {member.interests.map((tag) => (
                        <View key={tag} style={[styles.interestTag, { borderColor: colors.borderLight }]}>
                          <Text style={[styles.interestText, { color: colors.textSecondary }]}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                  {/* Action row to stimulate participation */}
                  <View style={styles.actionRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        { backgroundColor: colors.surface, borderColor: CultureTokens.coral },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => handleSendGift(member.name)}
                    >
                      <Ionicons name="gift-outline" size={14} color={CultureTokens.coral} />
                      <Text style={[styles.actionBtnText, { color: CultureTokens.coral }]}>Send Birthday Vouchers</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        { backgroundColor: colors.surface, borderColor: colors.primary },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => handleFreePromo(member.name)}
                    >
                      <Ionicons name="ticket-outline" size={14} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Promote Free Ticket</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        { backgroundColor: colors.surface, borderColor: CultureTokens.teal },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => handleRecommendPerks(member.name)}
                    >
                      <Ionicons name="pricetag-outline" size={14} color={CultureTokens.teal} />
                      <Text style={[styles.actionBtnText, { color: CultureTokens.teal }]}>Target Vouchers</Text>
                    </Pressable>
                  </View>
                </GlassView>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: HeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.5 },

  subtitle: { fontSize: 18, fontFamily: FontFamily.bold },
  descText: { fontSize: 13, lineHeight: 20 },

  // Stats Card
  statsCard: { padding: 20, gap: 16 },
  statsGrid: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, gap: 4 },
  statLabel: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.8 },
  statValue: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  statSub: { fontSize: 11, fontFamily: FontFamily.medium },
  statDivider: { width: 1, height: 48, marginHorizontal: 12 },

  // Controls Row
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  searchBar: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    padding: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },

  // Member card
  memberCard: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: { fontSize: 15, fontFamily: FontFamily.bold },
  memberUser: { fontSize: 13, fontFamily: FontFamily.regular },
  memberEmail: { fontSize: 12, fontFamily: FontFamily.medium },
  birthdayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  birthdayBadgeText: { fontSize: 8, fontFamily: FontFamily.bold },

  divider: { height: 1, width: '100%' },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  detailBox: { flex: 1, minWidth: 100, gap: 2 },
  detailLabel: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontFamily: FontFamily.semibold },

  lanePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  laneText: { fontSize: 11, fontFamily: FontFamily.semibold },

  interestTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  interestText: { fontSize: 10, fontFamily: FontFamily.medium },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },

  emptyWrap: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * AI Timesheet & Logs
 * ====================
 * Interactive, git-backed changelog and development timesheet.
 * Displays contributions made by AI Agents and Human Developers.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { HeaderTokens, FontFamily, CultureTokens } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import * as Clipboard from 'expo-clipboard';
import timesheetData from '@/constants/timesheetData.json';

interface Commit {
  hash: string;
  fullHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  executor: string;
  systemLabel: string;
  files: string[];
}

export default function TimesheetScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ai' | 'human'>('all');
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Parse git commit list and calculate timesheet stats
  const stats = useMemo(() => {
    const data = timesheetData as Commit[];
    const totalCommits = data.length;
    const aiCommits = data.filter((c) => c.executor === 'AI Agent').length;
    const humanCommits = totalCommits - aiCommits;

    // Unique active calendar days
    const uniqueDays = new Set(data.map((c) => c.date.split('T')[0]));
    const activeDays = uniqueDays.size;

    // Estimate hours: 6h per active developer day + 30 mins per commit push
    const estimatedHours = Math.round(activeDays * 6 + totalCommits * 0.5);

    // Total unique files touched
    const allFiles = new Set<string>();
    data.forEach((c) => c.files.forEach((f) => allFiles.add(f)));
    const totalFiles = allFiles.size;

    return {
      totalCommits,
      aiCommits,
      humanCommits,
      activeDays,
      estimatedHours,
      totalFiles,
    };
  }, []);

  // Filter commits based on search and selected tab
  const filteredCommits = useMemo(() => {
    let list = timesheetData as Commit[];

    if (selectedFilter === 'ai') {
      list = list.filter((c) => c.executor === 'AI Agent');
    } else if (selectedFilter === 'human') {
      list = list.filter((c) => c.executor === 'Human Developer');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.message.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q) ||
          c.hash.toLowerCase().includes(q) ||
          c.files.some((f) => f.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedFilter, searchQuery]);

  const toggleExpand = (hash: string) => {
    const updated = new Set(expandedCommits);
    if (updated.has(hash)) {
      updated.delete(hash);
    } else {
      updated.add(hash);
    }
    setExpandedCommits(updated);
  };

  const copyHash = async (fullHash: string, shortHash: string) => {
    await Clipboard.setStringAsync(fullHash);
    setCopiedHash(shortHash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) return 'logo-typescript';
    if (fileName.endsWith('.json')) return 'document-text-outline';
    if (fileName.endsWith('.css')) return 'css3';
    return 'document-outline';
  };

  const getFileColor = (fileName: string) => {
    if (fileName.endsWith('.tsx')) return '#3178C6';
    if (fileName.endsWith('.ts')) return '#007ACC';
    if (fileName.endsWith('.json')) return '#E5A224';
    return colors.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header bar */}
      <View style={[styles.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>AI Timesheet & Logs</Text>
          <View style={[styles.statusPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>JIRA STYLE SYNC</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 24, gap: 20 }}>
        
        {/* Statistics Summary Card */}
        <GlassView contentStyle={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>ESTIMATED WORK</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.estimatedHours} hrs</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Across {stats.activeDays} days</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>TOTAL COMMITS</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalCommits}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Touches: {stats.totalFiles} files</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>AI CONTRIBUTIONS</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {Math.round((stats.aiCommits / stats.totalCommits) * 100)}%
              </Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>
                {stats.aiCommits} of {stats.totalCommits} changes
              </Text>
            </View>
          </View>

          {/* Progress Bar Chart */}
          <View style={styles.chartContainer}>
            <View style={[styles.chartBackground, { backgroundColor: colors.borderLight }]}>
              <View 
                style={[
                  styles.chartFill, 
                  { 
                    backgroundColor: colors.primary, 
                    width: `${(stats.aiCommits / stats.totalCommits) * 100}%` 
                  }
                ]} 
              />
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>🤖 AI Agent ({stats.aiCommits})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.textTertiary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>👤 Human Dev ({stats.humanCommits})</Text>
              </View>
            </View>
          </View>
        </GlassView>

        {/* Filter and Search Bar */}
        <View style={styles.controlsRow}>
          
          {/* Tab Filters */}
          <View style={[styles.tabs, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
            {([
              { key: 'all', label: 'All Sprints' },
              { key: 'ai', label: '🤖 AI Only' },
              { key: 'human', label: '👤 Human Only' },
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
              placeholder="Search commit messages, files..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Changes logs list */}
        <View style={{ gap: 12 }}>
          {filteredCommits.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="filter-outline" size={32} color={colors.textTertiary} />
              <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.medium, marginTop: 8 }}>
                No matches found in timesheet
              </Text>
            </View>
          ) : (
            filteredCommits.map((item) => {
              const isAi = item.executor === 'AI Agent';
              const expanded = expandedCommits.has(item.hash);
              const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <GlassView key={item.hash} contentStyle={styles.logCard}>
                  <Pressable onPress={() => toggleExpand(item.hash)} style={styles.logHeader}>
                    {/* Badge Icon */}
                    <View 
                      style={[
                        styles.logIcon, 
                        { backgroundColor: isAi ? colors.primarySoft : colors.backgroundSecondary }
                      ]}
                    >
                      <Ionicons 
                        name={isAi ? 'hardware-chip-outline' : 'person-outline'} 
                        size={18} 
                        color={isAi ? colors.primary : colors.textSecondary} 
                      />
                    </View>

                    {/* Commit details */}
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.logTitleRow}>
                        <Text style={[styles.logMsg, { color: colors.text }]} numberOfLines={2}>
                          {item.message}
                        </Text>
                      </View>
                      
                      <View style={styles.metaRow}>
                        {/* Author display */}
                        <Text style={[styles.authorLabel, { color: colors.textSecondary }]}>
                          By: <Text style={{ fontFamily: FontFamily.semibold, color: isAi ? colors.primary : colors.text }}>
                            {item.systemLabel}
                          </Text>
                        </Text>
                        
                        <Text style={[styles.dotDivider, { color: colors.textTertiary }]}>·</Text>
                        <Text style={[styles.logDate, { color: colors.textSecondary }]}>{formattedDate}</Text>
                      </View>
                    </View>

                    {/* Right action block */}
                    <View style={styles.rightAction}>
                      {/* Short hash copy button */}
                      <Pressable 
                        onPress={() => copyHash(item.fullHash, item.hash)}
                        style={[styles.hashBtn, { backgroundColor: colors.backgroundSecondary }]}
                      >
                        <Text style={[styles.hashText, { color: colors.textTertiary }]}>
                          {copiedHash === item.hash ? 'Copied' : item.hash}
                        </Text>
                        {copiedHash !== item.hash && (
                          <Ionicons name="copy-outline" size={10} color={colors.textTertiary} />
                        )}
                      </Pressable>

                      {/* Expand Chevron */}
                      <Ionicons 
                        name={expanded ? 'chevron-up' : 'chevron-down'} 
                        size={16} 
                        color={colors.textTertiary} 
                      />
                    </View>
                  </Pressable>

                  {/* Expanded Changed Files Section */}
                  {expanded && (
                    <View style={[styles.expandedContent, { borderTopColor: colors.borderLight }]}>
                      <Text style={[styles.filesHeading, { color: colors.textSecondary }]}>
                        FILES TOUCHED ({item.files.length})
                      </Text>
                      {item.files.map((file, idx) => (
                        <View key={idx} style={styles.fileRow}>
                          <Ionicons 
                            name={getFileIcon(file) as any} 
                            size={12} 
                            color={getFileColor(file)} 
                          />
                          <Text style={[styles.filePath, { color: colors.textSecondary }]} numberOfLines={1}>
                            {file}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
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

  // Stats Card
  statsCard: { padding: 20, gap: 16 },
  statsGrid: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, gap: 4 },
  statLabel: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.8 },
  statValue: { fontSize: 26, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  statSub: { fontSize: 11, fontFamily: FontFamily.medium },
  statDivider: { width: 1, height: 48, marginHorizontal: 12 },

  // Progress Bar
  chartContainer: { gap: 8 },
  chartBackground: { height: 6, borderRadius: 3, overflow: 'hidden' },
  chartFill: { height: '100%', borderRadius: 3 },
  chartLegend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: FontFamily.medium },

  // Controls Bar
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
    minWidth: 220,
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

  // Log List items
  logCard: { overflow: 'hidden' },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  logIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logMsg: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    lineHeight: 18,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorLabel: { fontSize: 11, fontFamily: FontFamily.medium },
  dotDivider: { fontSize: 11 },
  logDate: { fontSize: 11, fontFamily: FontFamily.medium },
  
  rightAction: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hashText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
  },

  // Expanded content
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    gap: 6,
  },
  filesHeading: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filePath: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
  },
  emptyWrap: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

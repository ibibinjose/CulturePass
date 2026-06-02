import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router, usePathname } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/design-system/tokens/theme';
import { modulesApi,  type WalletTransaction } from '@/modules/api';
import { routeWithRedirect } from '@/lib/routes';
import { goBackOrReplace } from '@/lib/navigation';

function getTypeIcon(type: WalletTransaction['type']): string {
  switch (type) {
    case 'topup':    return 'arrow-down-circle';
    case 'cashback': return 'sparkles';
    case 'refund':   return 'return-up-back';
    case 'payment':  return 'arrow-up-circle';
    default:         return 'swap-horizontal';
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface TxItemProps { item: WalletTransaction }

function TransactionItem({ item, styles: s }: TxItemProps & { styles: ReturnType<typeof getStyles> }) {
  const colors = useColors();
  const isCredit = item.type === 'topup' || item.type === 'refund' || item.type === 'cashback';
  const amountColor = isCredit ? colors.success : colors.error;

  const statusColor =
    item.status === 'completed' ? colors.success :
    item.status === 'pending'   ? colors.warning :
    item.status === 'failed'    ? colors.error : colors.textTertiary;

  return (
    <View style={s.txCard}>
      <View style={[s.txIcon, { backgroundColor: amountColor + '15' }]}>
        <Ionicons name={getTypeIcon(item.type) as keyof typeof Ionicons.glyphMap} size={22} color={amountColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.txDescription} numberOfLines={1}>
          {item.description || (isCredit ? 'Wallet Credit' : 'Payment')}
        </Text>
        <View style={s.txMeta}>
          <Text style={s.txDate}>{formatDate(item.createdAt)}</Text>
          {item.category && (
            <>
              <Text style={s.txDot}>·</Text>
              <Text style={s.txCategory}>{item.category}</Text>
            </>
          )}
        </View>
      </View>
      <View style={s.txRight}>
        <Text style={[s.txAmount, { color: amountColor }]}>
          {item.amount >= 0 ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
        </Text>
        <View style={[s.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <Text style={[s.statusText, { color: statusColor }]}>{item.status || 'unknown'}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TransactionsScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const pathname = usePathname();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset    = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const { userId, isAuthenticated } = useAuth();

  const { data: transactions = [], isLoading } = useQuery<WalletTransaction[]>({
    queryKey: ['/api/transactions', userId],
    queryFn: () => modulesApi.wallet.transactions(userId!),
    enabled: !!userId,
  });

  if (!isAuthenticated || !userId) {
    return (
      <View style={[styles.container, { paddingTop: topInset + 16 }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => goBackOrReplace('/(tabs)')}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={{ width: 44 }} />
        </View>
        
        <View style={styles.scrollContainer}>
          <View style={styles.authEmptyIcon}>
            <Ionicons name="globe" size={52} color={colors.primary} />
          </View>
          <Text style={styles.authEmptyTitle}>Sign In to View Transactions</Text>
          <Text style={styles.authEmptySubtitle}> 
            Your wallet and transaction history are available after signing in. Create an account or sign in to manage your payments and cashback rewards.
          </Text>
          <Pressable
            style={styles.signInBtn}
            onPress={() => router.push(routeWithRedirect('/(onboarding)/login', pathname))}
          >
            <Ionicons name="arrow-forward" size={18} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.signInBtnText}>Sign In Now</Text>
          </Pressable>
          <Pressable
            style={styles.backHomeBtn}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.backHomeBtnText}>Back to Discovery</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent  = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <View style={[styles.container, { paddingTop: topInset + 16 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 44 }} />
      </View>

      {transactions.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="arrow-down-circle" size={20} color={colors.success} />
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>+${income.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="arrow-up-circle" size={20} color={colors.error} />
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryAmount, { color: colors.error }]}>-${spent.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem item={item} styles={styles} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomInset + 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={transactions.length > 0}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptySubtitle}>Your booking and payment history will appear here</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, zIndex: 10 },
  backBtn:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  headerTitle:  { ...TextStyles.title3, color: colors.text },
  scrollContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  summaryRow:   { flexDirection: 'row', paddingHorizontal: 20, gap: 14, marginBottom: 20 },
  summaryCard:  { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.borderLight },
  summaryLabel: { ...TextStyles.chip, color: colors.textSecondary },
  summaryAmount:{ ...TextStyles.title3 },
  txCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.borderLight },
  txIcon:       { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txDescription:{ ...TextStyles.callout, color: colors.text },
  txMeta:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  txDate:       { ...TextStyles.caption, color: colors.textSecondary },
  txDot:        { ...TextStyles.caption, color: 'rgba(255,255,255,0.4)' },
  txCategory:   { ...TextStyles.caption, color: colors.textSecondary },
  txRight:      { alignItems: 'flex-end', gap: 6 },
  txAmount:     { ...TextStyles.headline },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText:   { ...TextStyles.badge, textTransform: 'capitalize' as const },
  emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 40 },
  emptyIcon:    { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: colors.surface },
  emptyTitle:   { ...TextStyles.title2, marginBottom: 8, color: colors.text },
  emptySubtitle:{ ...TextStyles.cardBody, textAlign: 'center', lineHeight: 22, color: colors.textSecondary },

  authEmptyIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: colors.primarySoft },
  authEmptyTitle:{ ...TextStyles.title2, marginBottom: 8, color: colors.text, textAlign: 'center' },
  authEmptySubtitle:{ ...TextStyles.cardBody, textAlign: 'center', lineHeight: 22, color: colors.textSecondary, marginBottom: 32 },
  signInBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14, width: '100%', backgroundColor: colors.primary },
  signInBtnText:{ ...TextStyles.callout, color: colors.text },
  backHomeBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14, width: '100%', marginTop: 12, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  backHomeBtnText: { ...TextStyles.callout, color: colors.text },
});

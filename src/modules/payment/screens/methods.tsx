import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { goBackOrReplace } from '@/lib/navigation';
import { usePaymentMethodsQuery } from '@/modules/payment/hooks/queries/usePaymentMethodsQuery';
import { useCreatePaymentMethodMutation } from '@/modules/payment/hooks/mutations/useCreatePaymentMethodMutation';
import { useDeletePaymentMethodMutation } from '@/modules/payment/hooks/mutations/useDeletePaymentMethodMutation';
import { useSetDefaultPaymentMethodMutation } from '@/modules/payment/hooks/mutations/useSetDefaultPaymentMethodMutation';

function getBrandIcon(brand: string | null): string {
  switch (brand?.toLowerCase()) {
    case 'paypal': return 'logo-paypal';
    default:       return 'card-outline';
  }
}

function getBrandColor(brand: string | null, fallback: string): string {
  switch (brand?.toLowerCase()) {
    case 'visa':       return '#1A1F71';
    case 'mastercard': return '#EB001B';
    case 'amex':       return '#006FCF';
    case 'paypal':     return '#003087';
    default:           return fallback;
  }
}

export default function PaymentMethodsScreen() {
  const { userId }  = useAuth();
  const colors = useColors();
  const s = getStyles(colors);
  const safeInsets = useSafeAreaInsetsWeb();
  const bottomInset = safeInsets.bottom;
  const topInset = safeInsets.top;

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'credit', label: '', last4: '', brand: 'Visa', expiryMonth: '', expiryYear: '',
  });

  const { data: methods = [], isLoading } = usePaymentMethodsQuery(userId);

  const createMutation = useCreatePaymentMethodMutation(userId, () => {
    setShowAddForm(false);
    setFormData({ type: 'credit', label: '', last4: '', brand: 'Visa', expiryMonth: '', expiryYear: '' });
  });

  const deleteMutation = useDeletePaymentMethodMutation(userId);

  const setDefaultMutation = useSetDefaultPaymentMethodMutation(userId);
  const handleAdd = () => {
    if (!formData.label || !formData.last4 || !formData.expiryMonth || !formData.expiryYear) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createMutation.mutate({
      userId,
      type: formData.type,
      label: formData.label,
      last4: formData.last4,
      brand: formData.brand,
      expiryMonth: parseInt(formData.expiryMonth),
      expiryYear: parseInt(formData.expiryYear),
      isDefault: methods.length === 0,
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Card', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteMutation.mutate(id);
        },
      },
    ]);
  };
  const brandOptions = ['Visa', 'Mastercard', 'Amex', 'PayPal'];
  const typeOptions  = ['credit', 'debit', 'paypal'];
  return (
    <View style={[s.container, { paddingTop: topInset + 16 }]}> 
      <View style={s.header}>
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Payment Methods</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 20 }}>
        {isLoading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator color={CultureTokens.indigo} />
          </View>
        ) : methods.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="card-outline" size={48} color={colors.textTertiary} />
            </View>
            <Text style={s.emptyTitle}>No Payment Methods</Text>
            <Text style={s.emptySubtitle}>Add a card or PayPal to make quick payments</Text>
          </View>
        ) : (
          methods.map((method) => {
            const brandColor = getBrandColor(method.brand, CultureTokens.indigo);
            return (
              <View key={method.id} style={s.cardContainer}>
                <View style={[s.cardWrap, { borderLeftColor: brandColor }]}>
                  <View style={s.cardTop}>
                    <View style={[s.brandIcon, { backgroundColor: brandColor + '15' }]}>
                      <Ionicons name={getBrandIcon(method.brand) as keyof typeof Ionicons.glyphMap} size={22} color={brandColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardLabel}>{method.label}</Text>
                      <Text style={s.cardBrand}>{method.brand} · {method.type}</Text>
                    </View>
                    {method.isDefault && (
                      <View style={s.defaultBadge}>
                        <Text style={s.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.cardBottom}>
                    <Text style={s.cardNumber}>•••• •••• •••• {method.last4}</Text>
                    <Text style={s.cardExpiry}> 
                      {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear?.toString().slice(-2)}
                    </Text>
                  </View>
                  <View style={s.cardActions}>
                    {!method.isDefault && (
                      <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDefaultMutation.mutate(method.id); }}
                        style={s.actionBtn}
                      >
                        <Ionicons name="star-outline" size={16} color={CultureTokens.indigo} />
                        <Text style={[s.actionText, { color: CultureTokens.indigo }]}>Set Default</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => handleDelete(method.id)} style={[s.actionBtn, s.deleteBtn]}>
                      <Ionicons name="trash-outline" size={16} color={CultureTokens.coral} />
                      <Text style={[s.actionText, { color: CultureTokens.coral }]}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <Pressable
          style={s.addButton}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddForm(true); }}
        >
          <Ionicons name="add-circle" size={22} color={colors.background} />
          <Text style={s.addButtonText}>Add Payment Method</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showAddForm} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { paddingBottom: bottomInset + 30 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Payment Method</Text>
              <Pressable onPress={() => setShowAddForm(false)} style={s.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.fieldLabel}>Card Label</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., My Visa Card"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={formData.label}
                onChangeText={(v) => setFormData(p => ({ ...p, label: v }))}
              />

              <Text style={s.fieldLabel}>Last 4 Digits</Text>
              <TextInput
                style={s.input}
                placeholder="1234"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={formData.last4}
                onChangeText={(v) => setFormData(p => ({ ...p, last4: v.replace(/\D/g, '').slice(0, 4) }))}
                keyboardType="number-pad"
                maxLength={4}
              />

              <Text style={s.fieldLabel}>Card Brand</Text>
              <View style={s.optionsRow}>
                {brandOptions.map(b => (
                  <Pressable
                    key={b}
                    style={[
                      s.optionChip,
                      formData.brand === b && s.optionChipActive,
                    ]}
                    onPress={() => setFormData(p => ({ ...p, brand: b }))}
                  >
                    <Text style={[s.optionChipText, formData.brand === b && s.optionChipTextActive]}>{b}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.fieldLabel}>Card Type</Text>
              <View style={s.optionsRow}>
                {typeOptions.map(t => (
                  <Pressable
                    key={t}
                    style={[
                      s.optionChip,
                      formData.type === t && s.optionChipActive,
                    ]}
                    onPress={() => setFormData(p => ({ ...p, type: t }))}
                  >
                    <Text style={[s.optionChipText, formData.type === t && s.optionChipTextActive]}> 
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={s.expiryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Expiry Month</Text>
                  <TextInput
                    style={s.input}
                    placeholder="MM"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formData.expiryMonth}
                    onChangeText={(v) => setFormData(p => ({ ...p, expiryMonth: v.replace(/\D/g, '').slice(0, 2) }))}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Expiry Year</Text>
                  <TextInput
                    style={s.input}
                    placeholder="YYYY"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={formData.expiryYear}
                    onChangeText={(v) => setFormData(p => ({ ...p, expiryYear: v.replace(/\D/g, '').slice(0, 4) }))}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              <Pressable
                style={[s.submitBtn, createMutation.isPending && { opacity: 0.7 }]}
                onPress={handleAdd}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending
                  ? <ActivityIndicator color={colors.background} size="small" />
                  : <Text style={s.submitBtnText}>Add Card</Text>
                }
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn:        { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  headerTitle:    { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },
  loadingContainer:{ padding: 60, alignItems: 'center' },
  emptyState:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon:      { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: colors.surface },
  emptyTitle:     { fontSize: 17, fontFamily: 'Poppins_700Bold', marginBottom: 6, color: colors.text },
  emptySubtitle:  { ...TextStyles.cardBody, textAlign: 'center', color: colors.textSecondary },
  cardContainer:  { marginHorizontal: 20, marginBottom: 14 },
  cardWrap:       { borderRadius: 12, padding: 14, borderWidth: 1, borderLeftWidth: 3, backgroundColor: colors.surface, borderColor: colors.borderLight },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  brandIcon:      { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardLabel:      { ...TextStyles.headline, color: colors.text },
  cardBrand:      { ...TextStyles.chip, marginTop: 2, color: colors.textSecondary, textTransform: 'capitalize' },
  defaultBadge:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: CultureTokens.success + '15' },
  defaultText:    { ...TextStyles.badge, color: CultureTokens.success },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardNumber:     { ...TextStyles.callout, letterSpacing: 1, color: colors.text },
  cardExpiry:     { ...TextStyles.chip, color: colors.textSecondary },
  cardActions:    { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 14 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 2 },
  deleteBtn:      { marginLeft: 'auto' as never },
  actionText:     { ...TextStyles.chip },
  addButton:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingVertical: 13, backgroundColor: CultureTokens.indigo },
  addButtonText:  { ...TextStyles.cardTitle, color: colors.background },
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(11,11,20,0.85)' },
  modalContent:   { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:     { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },
  modalCloseBtn:  { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  fieldLabel:     { ...TextStyles.captionSemibold, marginBottom: 6, marginTop: 14, color: colors.textTertiary },
  input:          { borderRadius: 10, padding: 12, ...TextStyles.callout, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text },
  optionsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip:     { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.borderLight },
  optionChipActive: { backgroundColor: CultureTokens.indigo + '20', borderColor: CultureTokens.indigo },
  optionChipText: { ...TextStyles.chip, color: colors.textSecondary },
  optionChipTextActive: { color: CultureTokens.indigo },
  expiryRow:      { flexDirection: 'row', gap: 14 },
  submitBtn:      { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 24, backgroundColor: CultureTokens.indigo },
  submitBtnText:  { ...TextStyles.callout, color: colors.background },
});

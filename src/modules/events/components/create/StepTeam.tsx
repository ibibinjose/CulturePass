import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import { Input } from '@/design-system/ui/Input';
import { Button } from '@/design-system/ui/Button';
import { useColors } from '@/hooks/useColors';
import { FormData, ArtistDraft, SponsorDraft, SPONSOR_TIERS } from './types';
import type { CreateStyles } from './styles';

const looksLikeInvalidUrl = (value?: string): boolean => {
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    return !parsed.hostname.includes('.');
  } catch {
    return true;
  }
};

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  // Artist state
  showArtistForm: boolean;
  setShowArtistForm: (v: boolean) => void;
  newArtist: ArtistDraft;
  setNewArtist: React.Dispatch<React.SetStateAction<ArtistDraft>>;
  artistSearch: string;
  setArtistSearch: (v: string) => void;
  artistResults: unknown;
  addArtist: () => void;
  removeArtist: (index: number) => void;
  // Sponsor state
  showSponsorForm: boolean;
  setShowSponsorForm: (v: boolean) => void;
  newSponsor: SponsorDraft;
  setNewSponsor: React.Dispatch<React.SetStateAction<SponsorDraft>>;
  addSponsor: () => void;
  removeSponsor: (index: number) => void;
  haptic: () => void;
}

export function StepTeam({
  form, setField, colors, s,
  showArtistForm, setShowArtistForm, newArtist, setNewArtist, artistSearch, setArtistSearch, artistResults, addArtist, removeArtist,
  showSponsorForm, setShowSponsorForm, newSponsor, setNewSponsor, addSponsor, removeSponsor,
  haptic,
}: Props) {
  const artistList = Array.isArray(artistResults)
    ? (artistResults as { id: string; name: string; imageUrl?: string }[])
    : ((artistResults as { profiles?: { id: string; name: string; imageUrl?: string }[] })?.profiles ?? []);

  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Optionally add artists, sponsors, and host information. All fields are optional.
      </Text>

      {/* ── Artists ─────────────────────────────────────────────────────── */}
      <View style={s.teamSection}>
        <View style={s.teamSectionHeader}>
          <Ionicons name="musical-notes-outline" size={20} color={CultureTokens.coral} />
          <Text style={[s.teamSectionTitle, { color: colors.text }]}>Artists & Performers</Text>
          <Text style={[s.teamCount, { color: colors.textTertiary }]}>{form.artists.length}</Text>
        </View>

        {form.artists.map((artist, i) => (
          <View key={i} style={[s.teamChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[s.teamChipIcon, { backgroundColor: CultureTokens.coral + '20' }]}>
              <Ionicons name="person" size={16} color={CultureTokens.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.teamChipName, { color: colors.text }]}>{artist.name}</Text>
              {artist.role ? <Text style={[s.teamChipRole, { color: colors.textSecondary }]}>{artist.role}</Text> : null}
            </View>
            <Pressable onPress={() => removeArtist(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${artist.name}`}>
              <Ionicons name="close-circle" size={20} color={CultureTokens.coral} />
            </Pressable>
          </View>
        ))}

        {showArtistForm ? (
          <View style={[s.addTierForm, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.coral + '40' }]}>
            {artistSearch.length > 1 && artistList.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>SEARCH RESULTS</Text>
                {artistList
                  .filter((p) => p.name.toLowerCase().includes(artistSearch.toLowerCase()))
                  .slice(0, 4)
                  .map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => { setNewArtist({ name: p.name, role: '', profileId: p.id, imageUrl: p.imageUrl }); setArtistSearch(''); }}
                      style={[s.searchResult, { borderColor: colors.border }]}
                    >
                      <Text style={{ color: colors.text, fontFamily: 'Poppins_500Medium', fontSize: 14 }}>{p.name}</Text>
                    </Pressable>
                  ))}
              </View>
            )}
            <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>SEARCH OR ENTER NAME</Text>
            <TextInput
              style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={artistSearch || newArtist.name}
              onChangeText={(v: any) => { setArtistSearch(v); setNewArtist((a) => ({ ...a, name: v })); }}
              placeholder="Artist or performer name…"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
            <Text style={[s.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>ROLE (optional)</Text>
            <TextInput
              style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={newArtist.role}
              onChangeText={(v: any) => setNewArtist((a) => ({ ...a, role: v }))}
              placeholder="e.g. Headliner, Support, DJ…"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
            <View style={[s.row, { marginTop: 8 }]}>
              <Button variant="outline" size="sm" onPress={() => { setShowArtistForm(false); setArtistSearch(''); }} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="primary" size="sm" onPress={addArtist} style={{ flex: 1, backgroundColor: CultureTokens.coral }}>Add</Button>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => { setShowArtistForm(true); haptic(); }}
            style={[s.addTierBtn, { borderColor: CultureTokens.coral + '60', backgroundColor: CultureTokens.coral + '10' }]}
            accessibilityRole="button"
            accessibilityLabel="Add artist"
          >
            <Ionicons name="add-circle-outline" size={20} color={CultureTokens.coral} />
            <Text style={[s.addTierText, { color: CultureTokens.coral }]}>Add Artist / Performer</Text>
          </Pressable>
        )}
      </View>

      {/* ── Sponsors ──────────────────────────────────────────────────────── */}
      <View style={s.teamSection}>
        <View style={s.teamSectionHeader}>
          <Ionicons name="ribbon-outline" size={20} color={CultureTokens.gold} />
          <Text style={[s.teamSectionTitle, { color: colors.text }]}>Sponsors</Text>
          <Text style={[s.teamCount, { color: colors.textTertiary }]}>{form.sponsors.length}</Text>
        </View>

        {form.sponsors.map((sp, i) => {
          const tierDef = SPONSOR_TIERS.find((t) => t.id === sp.tier);
          return (
            <View key={i} style={[s.teamChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={[s.teamChipIcon, { backgroundColor: (tierDef?.color ?? CultureTokens.gold) + '20' }]}>
                <Ionicons name="ribbon" size={16} color={tierDef?.color ?? CultureTokens.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.teamChipName, { color: colors.text }]}>{sp.name}</Text>
                <Text style={[s.teamChipRole, { color: tierDef?.color ?? colors.textSecondary }]}>{tierDef?.label ?? sp.tier}</Text>
              </View>
              <Pressable onPress={() => removeSponsor(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${sp.name}`}>
                <Ionicons name="close-circle" size={20} color={CultureTokens.coral} />
              </Pressable>
            </View>
          );
        })}

        {showSponsorForm ? (
          <View style={[s.addTierForm, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.gold + '40' }]}>
            <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>SPONSOR NAME</Text>
            <TextInput
              style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={newSponsor.name}
              onChangeText={(v: any) => setNewSponsor((sp) => ({ ...sp, name: v }))}
              placeholder="Company or brand name…"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
            <Text style={[s.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>SPONSOR TIER</Text>
            <View style={s.tierPresets}>
              {SPONSOR_TIERS.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setNewSponsor((sp) => ({ ...sp, tier: t.id }))}
                  style={[s.tierPreset, { borderColor: newSponsor.tier === t.id ? t.color : colors.border, backgroundColor: newSponsor.tier === t.id ? t.color + '15' : colors.background }]}
                  accessibilityRole="button"
                >
                  <Text style={[s.tierPresetText, { color: newSponsor.tier === t.id ? t.color : colors.textSecondary }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[s.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>WEBSITE (optional)</Text>
            <TextInput
              style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={newSponsor.websiteUrl ?? ''}
              onChangeText={(v: any) => setNewSponsor((sp) => ({ ...sp, websiteUrl: v }))}
              placeholder="https://…"
              placeholderTextColor={colors.textTertiary}
              keyboardType="url"
              autoCapitalize="none"
            />
            {looksLikeInvalidUrl(newSponsor.websiteUrl) && (
              <Text style={[s.fieldLabel, { color: CultureTokens.coral, marginTop: 6 }]}>
                Invalid URL. We will ignore this value unless it is a valid website.
              </Text>
            )}
            <View style={[s.row, { marginTop: 8 }]}>
              <Button variant="outline" size="sm" onPress={() => setShowSponsorForm(false)} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="primary" size="sm" onPress={addSponsor} style={{ flex: 1, backgroundColor: CultureTokens.gold }}>Add</Button>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => { setShowSponsorForm(true); haptic(); }}
            style={[s.addTierBtn, { borderColor: CultureTokens.gold + '60', backgroundColor: CultureTokens.gold + '10' }]}
            accessibilityRole="button"
            accessibilityLabel="Add sponsor"
          >
            <Ionicons name="add-circle-outline" size={20} color={CultureTokens.gold} />
            <Text style={[s.addTierText, { color: CultureTokens.gold }]}>Add Sponsor</Text>
          </Pressable>
        )}
      </View>

      {/* ── Host Info ─────────────────────────────────────────────────────── */}
      <View style={s.teamSection}>
        <View style={s.teamSectionHeader}>
          <Ionicons name="home-outline" size={20} color={CultureTokens.teal} />
          <Text style={[s.teamSectionTitle, { color: colors.text }]}>Host Information</Text>
        </View>
        <Input
          label="Host / Organizer Name"
          value={form.hostInfo.name}
          onChangeText={(v: any) => setField('hostInfo', { ...form.hostInfo, name: v })}
          placeholder="e.g. Sydney Cultural Society"
          autoCapitalize="words"
          accessibilityLabel="Host name"
          containerStyle={{ marginBottom: 12 }}
        />
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Contact Email"
              value={form.hostInfo.contactEmail}
              onChangeText={(v: any) => setField('hostInfo', { ...form.hostInfo, contactEmail: v })}
              placeholder="hello@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Host contact email"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Contact Phone"
              value={form.hostInfo.contactPhone}
              onChangeText={(v: any) => setField('hostInfo', { ...form.hostInfo, contactPhone: v })}
              placeholder="+61 4XX XXX XXX"
              keyboardType="phone-pad"
              accessibilityLabel="Host contact phone"
            />
          </View>
        </View>
        <Input
          label="Website"
          value={form.hostInfo.websiteUrl ?? ''}
          onChangeText={(v: any) => setField('hostInfo', { ...form.hostInfo, websiteUrl: v })}
          placeholder="https://your-site.com"
          keyboardType="url"
          autoCapitalize="none"
          accessibilityLabel="Host website"
          containerStyle={{ marginTop: 12 }}
        />
        {looksLikeInvalidUrl(form.hostInfo.websiteUrl) && (
          <Text style={[s.fieldLabel, { color: CultureTokens.coral, marginTop: 6 }]}>
            Invalid URL. We will ignore this value unless it is a valid website.
          </Text>
        )}
      </View>
    </View>
  );
}

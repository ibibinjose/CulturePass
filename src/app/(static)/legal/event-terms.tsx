import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles } from '@/design-system/tokens/theme';
import { goBackOrReplace } from '@/lib/navigation';
import { M3TopAppBar } from '@/design-system/ui';

const SECTIONS = [
  { title: 'Authority and Accuracy', body: 'You warrant that you:\n\n• are, or are an authorised representative of, the event organiser that is producing the event that you are seeking to list on What’s On;\n• are at least 18 years of age; and\n• are authorised, and agree, to these terms and conditions on behalf of the event organiser.\n\nYou agree that all information provided in your event listing is true and correct, and acknowledge that the provision of any false, misleading or inaccurate information may result in the event listing being rejected or removed by the City.' },
  { title: 'Eligible Events', body: 'You acknowledge that events submitted for listing must:\n\n• occur at a specific venue or location within a 7.5km radius of the city centre;\n• be open to the general public and have broad appeal;\n• be in the interests of public health and safety;\n• not be part of professional development or qualification coursework;\n• not be a political party fundraiser;\n• not be a sales promotion or special offer;\n• not be hosted or sponsored by a company that extracts or sells fossil fuels including coal, oil or gas, or that features activations/promotions by such companies;\n• be an event listing with a specific time and date(s) and not a general advertisement for a business or ongoing service or product;\n• be submitted by the organiser or its authorised agent; and\n• be specific, finalised and confirmed prior to submission (events with dates or locations yet to be announced are not eligible for listing).\n\nWhere an event is online, you must be a business or individual with a registered address in one of the approved suburbs.\n\nWhere an event is providing personal financial advice, you must have an Australian Financial Services (AFS) licence and the licence information must be included in the event listing description.\n\nProtests and demonstrations may be listed provided they do not promote or incite violence, unlawful activity or antisocial behaviour. Listings for a protest or demonstration must be for a single event date and time only.\n\nThe City reserves the right to accept or reject event listings, in whole or in part, and remove listings, at its absolute discretion.' },
  { title: 'Publication', body: 'You acknowledge that all event listing submissions, including any changes following initial publication, are reviewed by the City and the City reserves the right to edit event submissions for style, length, or any other reason.\n\nWhere the City requests you make amendments to the event listing and you either fail to make such amendments or resubmit the event listing for review without making the requested amendments, the City may refuse to publish your event.\n\nYou acknowledge that the City accepts no liability for the publication, rejection, or removal of your event listing.' },
  { title: 'Copyright', body: 'In respect of all the material submitted in your event listing (including all text and images) you warrant that:\n\n• you own the copyright in all the material or have sufficient rights to grant a licence to the City on the terms set out below;\n• the material does not infringe the rights, including copyright, trade marks, or privacy, of any person, and\n• the material, and your creation of it, complies with all laws.\n\nYou grant the City a non-exclusive, worldwide, royalty-free, perpetual, revocable licence to use, copy, modify, adapt, publish, and communicate to the public the material submitted in your event listing (including all text and images):\n\n• on the City’s What’s On website;\n• on the City\'s corporate website;\n• on the City\'s news website;\n• in the City\'s Sydney Culture Walks app;\n• in e-newsletters produced by the City including the What’s On weekly newsletter;\n• on the City’s social media channels (including Facebook, Instagram, TikTok, Twitter/X, YouTube);\n• on digital screens in the City\'s customer service centres, libraries and community centres; and\n• on outdoor digital advertising screens in the City’s local government area.\n\nYou agree that, whilst the City will endeavour to credit you when using the material submitted in your event listing, you will not hold the City liable for any act or omission that may constitute an infringement of your moral rights.' },
  { title: 'General', body: 'Where the City lists your event on What’s On and/or uses any or all of the material submitted in your event listing in accordance with the above licence, you agree that:\n\n• the listing and/or use of the material does not constitute any endorsement of you, your event, or the material by the City;\n• you will not receive any payment or other remuneration from the City; and\n• you will not make or bring any claim against the City in relation to the event listing or the City’s use of the material.\n\nThe City makes no warranty or undertaking, whether expressed or implied, nor does it assume any legal liability, whether direct or indirect, in relation to the What’s On website.\n\nYou agree to indemnify the City for any loss, damage, costs or expenses incurred in connection with your breach of any of these terms and conditions, any claim for copyright infringement in connection with the material you submitted in the event listing, or any other legal obligation by you or your use of the What’s On website.\n\nYou acknowledge and accept the City’s privacy policy that applies to your use of the What’s On website, including your submission of an event listing.\n\nNotwithstanding the above, the City retains the right to monitor, retain and disclose any information relating to your use of What’s On, and your event listing, to satisfy any applicable law, regulation, legal process or governmental request.\n\nIn the event of any inconsistency between these terms and conditions, and the What’s On terms and conditions, these terms and conditions prevail.' }
];

export default function EventListingTermsScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={legalAmbient.mesh}
        pointerEvents="none"
      />
      <M3TopAppBar title="Event Listing Terms" onBack={() => goBackOrReplace('/settings')} denseWeb webChromeless />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : safeInsets.bottom), paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={28} color={CultureTokens.indigo} />
          </View>
          <Text style={styles.introTitle}>Event Listing Terms</Text>
          <Text style={styles.introDate}>Last updated: 3 March 2026</Text>
          <Text style={styles.introPara}>Create a beautiful event listing in minutes and showcase your event on one of Sydney’s most trusted event destinations. By submitting an event listing, you agree to be bound by the following terms and conditions.</Text>
        </View>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const legalAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFill, opacity: 0.07 },
});

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:    { flex: 1 },
  intro:        { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, alignItems: 'center' },
  iconWrap:     { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: CultureTokens.indigo + '15' },
  introTitle:   { ...TextStyles.title2, marginBottom: 4, color: colors.text, textAlign: 'center' },
  introDate:    { ...TextStyles.caption, marginBottom: 14, color: CultureTokens.indigo },
  introPara:    { ...TextStyles.cardBody, textAlign: 'center', lineHeight: 22, color: colors.textSecondary },
  section:      { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { ...TextStyles.headline, marginBottom: 8, color: colors.text, letterSpacing: 0.3 },
  sectionBody:  { ...TextStyles.cardBody, lineHeight: 24, color: colors.textSecondary },
});

import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles } from '@/design-system/tokens/theme';
import { goBackOrReplace } from '@/lib/navigation';
import { M3TopAppBar } from '@/design-system/ui';
import { APP_NAME, EMAIL_PRIVACY, MADE_IN } from '@/lib/app-meta';
import { FOOTER_LINKS } from '@/lib/site-footer-links';

const SECTIONS = [
  {
    title: '1. Who We Are and Scope of This Policy',
    body: 'CulturePass Pty Ltd ("CulturePass", "we", "us", or "our") is the entity responsible for the personal information you provide when using the CulturePass mobile application, web application, and all associated services (collectively, the "Platform").\n\nThis Privacy Policy explains how we collect, use, store, share, and protect your personal information, and describes your rights in relation to that information.\n\nThis Policy applies to all individuals who interact with the Platform, including registered users, event organisers, business owners, venue operators, and visitors to our website.\n\nCulturePass is bound by the Privacy Act 1988 (Cth) and the 13 Australian Privacy Principles (APPs). Where you access the Platform from the European Economic Area or the United Kingdom, we also undertake to meet applicable obligations under the General Data Protection Regulation (EU) 2016/679 ("EU GDPR") and the UK General Data Protection Regulation ("UK GDPR"). Where you access the Platform from Canada, we comply with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial legislation.',
  },
  {
    title: '2. Information We Collect',
    body: 'We collect personal information in the following ways:\n\nInformation you provide directly:\n• Account registration: full name, email address, date of birth (to verify age), password (stored as a cryptographic hash), and profile photograph.\n• Profile and preferences: cultural background, language preferences, city, interests, and community affiliations.\n• Purchases and transactions: billing name, payment card details (tokenised and processed exclusively by Stripe — we do not store raw card numbers), postal address, and transaction history.\n• Event listings (Organisers): business name, ABN/ACN or equivalent, venue details, event descriptions, images, and pricing information.\n• Communications: messages, support tickets, and feedback you send to us.\n• Identity verification: where required by law or for fraud prevention, we may request government-issued identification.\n\nInformation collected automatically:\n• Device information: device type, operating system, unique device identifiers (e.g., IDFA, Android Advertising ID), and app version.\n• Log data: IP address, browser type, referring URLs, pages viewed, actions taken on the Platform, and timestamps.\n• Location data: with your express consent, approximate GPS location to surface nearby events and council-area (LGA) services. You can withdraw location permission at any time through your device settings.\n• Usage analytics: aggregated interaction data, feature usage, and performance metrics collected using privacy-preserving analytics tools.\n• Cookies and similar technologies: see Section 11 for full details.\n\nInformation from third parties:\n• Social login: if you sign in via Google or Apple, we receive your name, email address, and profile picture from that provider, subject to your privacy settings with them.\n• Event attendance data: check-in records and attendance confirmation from Organisers for Events you attend.\n• Public sources: publicly available information where relevant to verifying Organiser credentials or combating fraud.',
  },
  {
    title: '3. How We Use Your Personal Information',
    body: 'We use your personal information for the following purposes:\n\nPlatform operation:\n• Creating and managing your account and verifying your identity.\n• Processing ticket purchases, membership subscriptions, and wallet transactions.\n• Facilitating communication between Users and Organisers.\n• Providing customer support and responding to your enquiries and requests.\n\nPersonalisation and recommendations:\n• Personalising the content, events, and communities displayed to you based on your preferences, location, and interaction history.\n• Surfacing culturally relevant events and community connections in your city.\n\nPlatform improvement and safety:\n• Analysing usage patterns to improve features, performance, and user experience.\n• Detecting, investigating, and preventing fraudulent transactions, abuse, and security incidents.\n• Conducting internal research, testing, and analytics.\n\nMarketing and communications:\n• Sending transactional notifications (booking confirmations, ticket updates, account alerts) — these cannot be opted out of as they are necessary for the service.\n• Sending promotional communications about Events, platform features, and partner offers — you may opt out at any time via account settings or the unsubscribe link in any marketing email.\n\nLegal and compliance:\n• Complying with our legal obligations under Applicable Law.\n• Enforcing our Terms of Service and Community Guidelines.\n• Responding to lawful requests from government or regulatory authorities.',
  },
  {
    title: '4. Legal Bases for Processing (GDPR and UK GDPR)',
    body: 'Where the EU GDPR or UK GDPR applies to our processing of your personal information, we rely on the following legal bases:\n\n• Contractual necessity (Article 6(1)(b)): Processing required to provide you with the services you have requested, including account management, ticketing, and payment processing.\n• Legitimate interests (Article 6(1)(f)): Processing for purposes such as fraud detection, platform security, service improvement, and direct marketing (where we balance our interests against your rights — you may object to this processing at any time).\n• Legal obligation (Article 6(1)(c)): Processing required to comply with applicable laws, such as financial record-keeping and responding to lawful government requests.\n• Consent (Article 6(1)(a)): Processing based on your specific, informed, and freely given consent, such as location tracking and certain analytics. You may withdraw consent at any time without affecting the lawfulness of processing prior to withdrawal.\n\nWhere we process special categories of personal information (Article 9 GDPR), such as information about cultural background or religion that you voluntarily provide, we rely on your explicit consent or the substantial public interest exemption as applicable.',
  },
  {
    title: '5. Information Sharing and Disclosure',
    body: 'We do not sell your personal information to third parties. We may share your information in the following circumstances:\n\nWith Organisers:\n• When you purchase a Ticket or register for an Event, we share your name, email address, and ticket details with the relevant Organiser to the extent necessary for them to manage attendance, communicate pre-event information, and comply with their legal obligations. Organisers are prohibited by their agreement with us from using this information for unrelated marketing without your consent.\n\nWith service providers (data processors):\n• Firebase / Google LLC: Cloud hosting, database, authentication, push notifications, and crash reporting. Data is processed under Google\'s data processing agreement with standard contractual clauses.\n• Stripe, Inc.: Payment processing. Stripe is PCI DSS Level 1 certified. We share only the information necessary for payment authorisation and fraud prevention.\n• Expo / Meta: Push notification delivery infrastructure.\n• Analytics providers: We use privacy-preserving, aggregated analytics. Where individual-level analytics are used, data is processed under a data processing agreement.\n\nWe require all service providers to process your personal information only on our documented instructions and to implement appropriate security measures.\n\nFor legal and safety reasons:\n• We may disclose your personal information where required by law, court order, or government authority; to enforce our Terms of Service; to investigate suspected fraud or illegal activity; or to protect the rights, property, or safety of CulturePass, our users, or the public.\n\nBusiness transfers:\n• In the event of a merger, acquisition, asset sale, or corporate restructuring, your personal information may be transferred as part of that transaction, subject to the incoming entity honouring this Privacy Policy or providing you with notice and, where required, the opportunity to opt out.',
  },
  {
    title: '6. Data Retention',
    body: 'We retain your personal information for as long as necessary to provide the Platform and fulfil the purposes described in this Policy, unless a longer retention period is required or permitted by law.\n\nSpecific retention periods:\n• Account data: retained for the duration of your account, plus up to 7 years after account closure for legal and financial compliance purposes (consistent with the Corporations Act 2001 (Cth) and tax record-keeping obligations).\n• Transaction records: retained for 7 years from the date of the transaction in accordance with Australian financial record-keeping requirements.\n• Support tickets and communications: retained for up to 3 years from resolution.\n• Marketing preferences and opt-out records: retained indefinitely to ensure we honour your preferences.\n• Anonymised and aggregated analytics data: may be retained indefinitely, as it no longer constitutes personal information.\n\nWhen retention periods expire, personal information is securely deleted or anonymised in accordance with our data disposal procedures. Where deletion is not technically immediately possible (e.g., backup archives), we isolate the data and protect it from further use until deletion is feasible.',
  },
  {
    title: '7. Data Storage and Security',
    body: 'Your personal information is stored on Firebase infrastructure operated by Google LLC, with primary data centres located in the United States and Australia (where available). All data is encrypted in transit using TLS 1.2 or higher, and encrypted at rest using AES-256 encryption.\n\nWe implement the following security measures:\n\n• Role-based access controls: access to personal information is restricted to authorised CulturePass personnel who need it to perform their duties, under a principle of least privilege.\n• Multi-factor authentication: required for all CulturePass team members with access to production systems.\n• Penetration testing and vulnerability management: periodic security assessments are conducted by qualified professionals.\n• Incident response: we maintain a documented data breach response plan. In the event of a notifiable data breach, we will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) in accordance with the Notifiable Data Breaches (NDB) scheme under Part IIIC of the Privacy Act.\n• Stripe tokenisation: payment card data is tokenised at source by Stripe and never passes through CulturePass servers.\n\nWhile we take all reasonable steps to protect your personal information, no transmission over the internet or electronic storage system is completely secure. We cannot guarantee absolute security, and you provide information at your own risk.',
  },
  {
    title: '8. International Data Transfers',
    body: 'CulturePass operates globally and your personal information may be transferred to, stored in, or processed in countries other than your country of residence, including the United States, the European Union, and other countries where our service providers operate.\n\nWhere we transfer personal information outside Australia, we take steps to ensure the receiving jurisdiction provides a standard of data protection at least equivalent to the Australian Privacy Principles, or that appropriate contractual safeguards (such as Standard Contractual Clauses under the EU GDPR or equivalent mechanisms) are in place.\n\nWhere we transfer personal information from the European Economic Area or the United Kingdom to third countries, we ensure an adequate level of protection through: adequacy decisions; Standard Contractual Clauses (SCCs) approved by the European Commission; binding corporate rules; or other applicable transfer mechanisms.\n\nFor Canadian residents, transfers outside Canada are made in accordance with PIPEDA and applicable cross-border transfer obligations.',
  },
  {
    title: '9. Your Privacy Rights',
    body: 'Subject to Applicable Law, you have the following rights in relation to your personal information:\n\nFor all users (Australian Privacy Principles):\n• Access: request a copy of the personal information we hold about you.\n• Correction: request correction of inaccurate, incomplete, or outdated personal information.\n• Complaint: lodge a complaint with us, and if not resolved, with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au or 1300 363 992.\n\nAdditional rights for EEA, UK, and Swiss residents (GDPR):\n• Erasure ("right to be forgotten"): request deletion of your personal information where it is no longer necessary for the purposes for which it was collected, or where you withdraw consent.\n• Restriction: request that we restrict processing of your personal information in certain circumstances.\n• Portability: receive your personal information in a structured, commonly used, machine-readable format and transmit it to another controller.\n• Object: object to processing based on legitimate interests or for direct marketing purposes at any time.\n• Withdraw consent: where processing is based on consent, withdraw that consent at any time.\n• Automated decision-making: not be subject to a decision based solely on automated processing that produces legal or similarly significant effects, unless necessary for a contract, authorised by law, or based on your explicit consent.\n\nTo exercise your rights, contact us at privacy@culturepass.app or via the in-app Settings > Privacy menu. We will respond within 30 days (or the period required by Applicable Law). We may need to verify your identity before processing your request. We will not charge you for making a request unless a request is manifestly unfounded or excessive.\n\nFor EEA/UK residents, you also have the right to lodge a complaint with your local supervisory authority (e.g., the Information Commissioner\'s Office in the UK at ico.org.uk).',
  },
  {
    title: '10. Marketing Communications',
    body: 'We may send you promotional emails, push notifications, and in-app messages about Events, new features, and platform offers that we think may interest you, based on your preferences and interaction history.\n\nYou may opt out of marketing communications at any time by:\n• Selecting "Unsubscribe" in any marketing email.\n• Adjusting your notification preferences in Settings > Notifications.\n• Contacting us at privacy@culturepass.app.\n\nOpting out of marketing communications does not affect your receipt of transactional messages (such as booking confirmations, account alerts, and critical security notifications), which are necessary for the operation of your account.\n\nWe comply with the Spam Act 2003 (Cth) (Australia), the CAN-SPAM Act (United States), the CASL (Canada), and the Privacy and Electronic Communications Regulations 2003 (UK) in sending commercial electronic messages.',
  },
  {
    title: '11. Cookies and Tracking Technologies',
    body: 'When you use the Platform via a web browser, we use cookies and similar technologies (including local storage, session storage, and device fingerprinting) for the following purposes:\n\n• Essential cookies: required for the Platform to function correctly (e.g., authentication session tokens, security tokens). These cannot be disabled.\n• Performance cookies: collect anonymised data about how you use the Platform to help us improve performance and user experience (e.g., page load times, error rates).\n• Analytics cookies: used by privacy-preserving analytics tools to understand aggregate usage patterns. IP addresses are anonymised or pseudonymised.\n• Preference cookies: remember your settings and preferences (e.g., dark mode, language, city).\n\nWe do not use third-party advertising or cross-site tracking cookies.\n\nYou can manage cookie preferences through your browser settings or device controls. Disabling essential cookies may impair your ability to use the Platform. Our Cookie Policy is available at culturepass.app/legal/cookies.',
  },
  {
    title: '12. Children\'s Privacy',
    body: 'The Platform is intended for users aged 16 years and over. We do not knowingly collect, use, or disclose personal information from individuals under the age of 16 without verified parental or guardian consent.\n\nIf you are a parent or guardian and believe that we have inadvertently collected personal information from a child under 16 without appropriate consent, please contact us immediately at privacy@culturepass.app. Upon verification, we will delete such information promptly from our systems.\n\nWhere we have reasonable grounds to believe a user is under 16, we may restrict or suspend their account pending age verification or parental consent.',
  },
  {
    title: '13. Third-Party Services and Links',
    body: 'The Platform may contain links to, or integrations with, third-party websites, social media platforms, mapping services, and ticketing systems. This Privacy Policy applies only to information collected by CulturePass. Third-party services have their own privacy policies, and we are not responsible for their data practices.\n\nKey third-party services used by the Platform and their privacy policies:\n• Google LLC (Firebase): policies.google.com/privacy\n• Stripe, Inc.: stripe.com/privacy\n• Expo (Expo Application Services): expo.dev/privacy\n• Apple Inc. (Sign in with Apple): apple.com/legal/privacy\n• Google (Sign in with Google): policies.google.com/privacy\n\nWe encourage you to review the privacy policies of any third-party services you interact with through or in connection with the Platform.',
  },
  {
    title: '14. Changes to This Privacy Policy',
    body: 'We may update this Privacy Policy from time to time to reflect changes in our data practices, legal obligations, or the features of the Platform.\n\nWhere we make material changes, we will notify you by:\n• Posting the updated policy on the Platform with a revised "Last updated" date.\n• Sending a notification to your registered email address at least 14 days before the changes take effect (for significant changes).\n• Displaying an in-app notice.\n\nYour continued use of the Platform after the effective date of any change constitutes acceptance of the updated Privacy Policy. If you do not agree with the changes, you must cease using the Platform and may request deletion of your account and personal data.',
  },
  {
    title: '15. How to Contact Us and Complaints',
    body: `For privacy-related enquiries, access requests, correction requests, or complaints, please contact our Privacy Officer:\n\nPrivacy Officer, CulturePass Pty Ltd\nEmail: ${EMAIL_PRIVACY}\nPostal: Privacy Officer, CulturePass Pty Ltd, Sydney NSW 2000, Australia\n\nWe aim to acknowledge your request within 5 business days and provide a substantive response within 30 days (or the period required by Applicable Law).\n\nIf you are not satisfied with our response, you may lodge a complaint with:\n• Australia: Office of the Australian Information Commissioner (OAIC) — oaic.gov.au · 1300 363 992\n• United Kingdom: Information Commissioner's Office (ICO) — ico.org.uk\n• European Union: your local Data Protection Authority\n• Canada: Office of the Privacy Commissioner of Canada — priv.gc.ca`,
  },
];

export default function PrivacyScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={legalAmbient.mesh}
        pointerEvents="none"
      />
      <M3TopAppBar title="Privacy Policy" onBack={() => goBackOrReplace('/settings')} denseWeb webChromeless />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom), paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={28} color={CultureTokens.success} />
          </View>
          <Text style={styles.introTitle}>Privacy Policy</Text>
          <Text style={styles.introDate}>Last updated: 7 May 2026</Text>
          <Text style={styles.introPara}>
            CulturePass is committed to protecting your personal information. This Policy explains what we collect,
            why we collect it, and how you can control it. We comply with the Australian Privacy Act 1988,
            GDPR (EU &amp; UK), and PIPEDA (Canada).
          </Text>
        </View>

        <View style={styles.badgeRow}>
          {COMPLIANCE_BADGES.map((b) => (
            <View key={b.label} style={[styles.badge, { backgroundColor: b.color + '18', borderColor: b.color + '40' }]}>
              <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={14} color={b.color} />
              <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
            </View>
          ))}
        </View>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
          <View style={styles.footerLinks}>
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} asChild>
                <Pressable>
                  <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>{link.label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            CulturePass Pty Ltd · Sydney NSW 2000, Australia
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {EMAIL_PRIVACY}
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {`${APP_NAME} · ${MADE_IN}`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const COMPLIANCE_BADGES: { label: string; icon: string; color: string }[] = [
  { label: 'Privacy Act 1988', icon: 'shield-checkmark-outline', color: CultureTokens.success },
  { label: 'GDPR & UK GDPR', icon: 'lock-closed-outline', color: CultureTokens.indigo },
  { label: 'PIPEDA', icon: 'flag-outline', color: CultureTokens.teal },
];

const legalAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
});

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:    { flex: 1 },
  intro:        { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, alignItems: 'center' },
  iconWrap:     { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: CultureTokens.success + '15' },
  introTitle:   { ...TextStyles.title2, marginBottom: 4, color: colors.text },
  introDate:    { ...TextStyles.caption, marginBottom: 14, color: CultureTokens.indigo },
  introPara:    { ...TextStyles.cardBody, textAlign: 'center', lineHeight: 22, color: colors.textSecondary },
  badgeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginBottom: 20 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, borderWidth: 1 },
  badgeText:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  section:      { marginHorizontal: 20, marginBottom: 28 },
  sectionTitle: { ...TextStyles.headline, marginBottom: 10, color: colors.text, letterSpacing: 0.3 },
  sectionBody:  { ...TextStyles.cardBody, lineHeight: 26, color: colors.textSecondary },
  footer:       { marginHorizontal: 20, marginTop: 12, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center', gap: 4 },
  footerLinks:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 8, marginBottom: 8 },
  footerLinkText: { ...TextStyles.caption, fontFamily: 'Poppins_500Medium' },
  footerText:   { ...TextStyles.caption, textAlign: 'center' },
});

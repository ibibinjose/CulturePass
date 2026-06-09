import React from 'react';
import { View, Text } from 'react-native';
import { CommunityFormData } from './types';
import { CommunityCreateStyles } from './styles';
import { Field } from './Field';
import { useColors } from '@/hooks/useColors';
import { SocialHandleField } from '@/components/social/SocialHandleField';
import { SOCIAL_HANDLE_PLACEHOLDERS } from '@/shared/utils/socialLinks';

interface Props {
  form: CommunityFormData;
  setField: (key: keyof CommunityFormData, value: any) => void;
  colors: ReturnType<typeof useColors>;
  s: CommunityCreateStyles;
}

export function StepSocial({ form, setField, colors, s }: Props) {
  const iconWrapStyle = [s.natSearchWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }];
  const previewTextStyle = { fontSize: 12, color: colors.textTertiary, marginLeft: 4 };

  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Connect your community&apos;s online presence. Enter a handle (e.g. CulturePassApp) — we&apos;ll build the full URL.
      </Text>

      <Field label="Website" colors={colors}>
        <SocialHandleField
          variant="icon"
          icon="globe-outline"
          iconColor={colors.textSecondary}
          value={form.website}
          onChangeText={(v) => setField('website', v)}
          placeholder={SOCIAL_HANDLE_PLACEHOLDERS.website ?? 'culturepass.app'}
          placeholderTextColor={colors.textTertiary}
          platformKey="website"
          keyboardType="url"
          iconWrapStyle={iconWrapStyle}
          inputTextStyle={[s.natSearchInput, { color: colors.text }]}
          previewTextStyle={previewTextStyle}
        />
      </Field>

      <Field label="Instagram" colors={colors}>
        <SocialHandleField
          variant="icon"
          icon="logo-instagram"
          iconColor={colors.textSecondary}
          value={form.instagram}
          onChangeText={(v) => setField('instagram', v)}
          placeholder={SOCIAL_HANDLE_PLACEHOLDERS.instagram ?? '@handle'}
          placeholderTextColor={colors.textTertiary}
          platformKey="instagram"
          iconWrapStyle={iconWrapStyle}
          inputTextStyle={[s.natSearchInput, { color: colors.text }]}
          previewTextStyle={previewTextStyle}
        />
      </Field>

      <Field label="Facebook / X" colors={colors}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <SocialHandleField
              variant="icon"
              icon="logo-facebook"
              iconColor={colors.textSecondary}
              value={form.facebook}
              onChangeText={(v) => setField('facebook', v)}
              placeholder={SOCIAL_HANDLE_PLACEHOLDERS.facebook ?? 'pagename'}
              placeholderTextColor={colors.textTertiary}
              platformKey="facebook"
              iconWrapStyle={iconWrapStyle}
              inputTextStyle={[s.natSearchInput, { color: colors.text }]}
              previewTextStyle={previewTextStyle}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SocialHandleField
              variant="icon"
              icon="logo-twitter"
              iconColor={colors.textSecondary}
              value={form.twitter}
              onChangeText={(v) => setField('twitter', v)}
              placeholder={SOCIAL_HANDLE_PLACEHOLDERS.twitter ?? 'CulturePassApp'}
              placeholderTextColor={colors.textTertiary}
              platformKey="twitter"
              iconWrapStyle={iconWrapStyle}
              inputTextStyle={[s.natSearchInput, { color: colors.text }]}
              previewTextStyle={previewTextStyle}
            />
          </View>
        </View>
      </Field>
    </View>
  );
}
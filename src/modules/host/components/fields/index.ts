/**
 * Host Form Fields
 * 
 * Reusable form field components for the HostSpace Enterprise-Grade Form System
 */

// Identity Fields
export { default as HandleField } from './HandleField';
export type { HandleFieldProps } from './HandleField';

export { default as NameField } from './NameField';
export type { NameFieldProps } from './NameField';

export { default as DateField } from './DateField';
export type { DateFieldProps } from './DateField';

// Contact Fields
export { default as EmailField } from './EmailField';
export type { EmailFieldProps } from './EmailField';

export { default as PhoneField } from './PhoneField';
export type { PhoneFieldProps, CountryCode } from './PhoneField';
export { SUPPORTED_COUNTRIES } from './PhoneField';

export { default as SocialLinksField } from './SocialLinksField';
export type { SocialLinksFieldProps, SocialLink, SocialPlatform, PrimaryContactMethod } from './SocialLinksField';

export { default as VerificationCodeInput } from './VerificationCodeInput';
export type { VerificationCodeInputProps } from './VerificationCodeInput';

// Legal & Compliance Fields
export { default as ABNField } from './ABNField';
export type { ABNFieldProps } from './ABNField';

export { default as LicenceUploadField } from './LicenceUploadField';
export type { LicenceUploadFieldProps, Licence } from './LicenceUploadField';

export { default as TaxStatusField } from './TaxStatusField';
export type { TaxStatusFieldProps, TaxStatus } from './TaxStatusField';

// Location Fields
export { default as LocationField } from './LocationField';
export type { LocationFieldProps } from './LocationField';

export { default as AccessibilityChecklistField } from './AccessibilityChecklistField';
export type { AccessibilityChecklistFieldProps } from './AccessibilityChecklistField';

export { default as MapPreview } from './MapPreview';
export type { MapPreviewProps } from './MapPreview';

// Privacy Control Fields
export { default as PrivacyControl, PrivacyIndicator } from './PrivacyControl';
export type { PrivacyControlProps, PrivacyIndicatorProps, PrivacyLevel } from './PrivacyControl';

export { default as ConsentCheckbox } from './ConsentCheckbox';
export type { ConsentCheckboxProps } from './ConsentCheckbox';

// Media Fields
export { MediaUploadField } from './MediaUploadField';
export type { MediaUploadFieldProps } from './MediaUploadField';

export { ImageCropModal } from './ImageCropModal';
export type { ImageCropModalProps } from './ImageCropModal';

import { View, type ViewStyle } from 'react-native';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLocationPickerFlow } from '@/hooks/useLocationPickerFlow';
import { locationPickerStyles as styles } from '@/components/location/locationPickerStyles';
import { LocationPickerTriggers } from '@/components/location/LocationPickerTriggers';
import { LocationPickerModal } from '@/components/location/LocationPickerModal';

export interface LocationPickerProps {
  variant?: 'icon' | 'full' | 'text';
  iconColor?: string;
  buttonStyle?: ViewStyle;
  textColor?: string;
  /**
   * Full-width trigger aligned with surrounding copy (e.g. settings).
   * Default `full` variant is a centered pill on web.
   */
  block?: boolean;
}

export function LocationPicker({
  variant = 'full',
  iconColor,
  buttonStyle,
  textColor,
  block = false,
}: LocationPickerProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const flow = useLocationPickerFlow();

  return (
    <View style={[styles.pickerRoot, block && styles.pickerRootBlock]}>
      <LocationPickerTriggers
        variant={variant}
        block={block}
        colors={colors}
        iconColor={iconColor}
        buttonStyle={buttonStyle}
        textColor={textColor}
        stateCity={flow.stateCity}
        stateCountry={flow.stateCountry}
        countryFlag={flow.countryFlag}
        locationLabel={flow.locationLabel}
        onOpen={flow.open}
      />

      <LocationPickerModal
        visible={flow.visible}
        onClose={flow.close}
        colors={colors}
        isDark={isDark}
        state={flow.state}
        step={flow.step}
        pendingCountry={flow.pendingCountry}
        citySearch={flow.citySearch}
        onCitySearch={flow.setCitySearch}
        scrollCommon={flow.scrollCommon}
        countries={flow.countries}
        preferCountryFirst={flow.preferCountryFirst}
        onSelectCountry={flow.selectCountry}
        regions={flow.regions}
        onSelectRegion={flow.selectRegion}
        pendingRegionMeta={flow.pendingRegionMeta}
        citiesFiltered={flow.citiesFiltered}
        onSelectCity={flow.selectCity}
        headerBack={flow.headerBack}
        modalTitle={flow.modalTitle}
        headerFlag={flow.headerFlag}
        handleDetectLocation={flow.handleDetectLocation}
        isDetecting={flow.isDetecting}
        locationsLoading={flow.locationsLoading}
        locationsError={flow.locationsError}
        country={flow.resolvedCountry}
        countryFlag={flow.countryFlag}
        currentStateCode={flow.currentStateCode}
        topInset={flow.topInset}
        bottomInsetNative={flow.bottomInsetNative}
        listPadBottom={flow.listPadBottom}
      />
    </View>
  );
}

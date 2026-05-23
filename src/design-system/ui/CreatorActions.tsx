import React from 'react';
import { Alert, Platform, Pressable, Text, View, type ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/design-system/ui/Button';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';

export interface CreatorFABProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: any;
  [key: string]: any;
}

export function CreatorFAB({ label = 'Create', icon = 'add', style, ...rest }: CreatorFABProps) {
  const colors = useColors();
  return (
    <Pressable
      {...rest}
      style={[
        {
          minHeight: 42,
          borderRadius: 999,
          paddingHorizontal: 14,
          backgroundColor: CultureTokens.indigo,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={16} color={colors.surface} />
      <Text style={{ color: colors.surface, fontFamily: 'Poppins_600SemiBold' }}>{label}</Text>
    </Pressable>
  );
}

export interface EditDeleteBarProps extends ViewProps {
  onEdit?: () => void;
  onDelete?: () => void;
  entityName?: string;
  [key: string]: any;
}

export function EditDeleteBar({ onEdit, onDelete, entityName = 'item', style, ...rest }: EditDeleteBarProps) {
  const runDelete = () => {
    if (!onDelete) return;
    void Promise.resolve(onDelete());
  };

  const confirmDelete = () => {
    if (!onDelete) return;
    const title = `Delete this ${entityName}?`;
    const message = 'This cannot be undone.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) runDelete();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: runDelete },
    ]);
  };

  return (
    <View
      {...rest}
      style={[{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }, style]}
    >
      {onEdit ? (
        <Button
          variant="outline"
          size="sm"
          onPress={onEdit}
          accessibilityLabel={`Edit ${entityName}`}
        >
          Edit
        </Button>
      ) : null}
      {onDelete ? (
        <Button variant="danger" size="sm" onPress={confirmDelete} accessibilityLabel={`Delete ${entityName}`}>
          Delete
        </Button>
      ) : null}
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';

function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function PasswordStrengthIndicator({ password = '' }: { password?: string }) {
  const score = scorePassword(password);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const label = labels[Math.max(0, score - 1)] ?? 'Weak';
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              backgroundColor: i < score ? '#2c2a72' : '#e2e8f0',
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 11, color: '#64748b' }}>Password strength: {label}</Text>
    </View>
  );
}

export default PasswordStrengthIndicator;

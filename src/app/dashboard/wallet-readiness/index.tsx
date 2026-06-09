import { Redirect } from 'expo-router';

export default function WalletReadinessRedirect() {
  return <Redirect href="/payment/wallet" />;
}
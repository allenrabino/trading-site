import React from "react";
import { Wallet } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import WalletConnectButton from "@/components/WalletConnectButton";

export default function Login() {
  const handleConnected = () => {
    window.location.href = "/";
  };

  return (
    <AuthLayout
      icon={Wallet}
      title="Connect your wallet"
      subtitle="Sign in or create an account with your crypto wallet"
    >
      <WalletConnectButton onConnected={handleConnected} />
    </AuthLayout>
  );
}

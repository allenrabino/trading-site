import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const connectors = [injected({ shimDisconnect: true })];

if (projectId) {
  connectors.push(
    walletConnect({
      projectId,
      showQrModal: true,
    })
  );
}

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors,
  transports: {
    [mainnet.id]: http(),
  },
});

export const walletConnectAvailable = Boolean(projectId);

import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { sepolia, celoAlfajores } from 'wagmi/chains';

const { connectors } = getDefaultWallets({
  appName: 'ROSCA-Guard',
  projectId: '43fb5aa058dd53ba01887bc2d99253dd',
  chains: [sepolia, celoAlfajores],
});

export const wagmiConfig = createConfig({
  chains: [sepolia, celoAlfajores],
  connectors,
  transports: {
    [sepolia.id]: http(),
    [celoAlfajores.id]: http(),
  },
});

export const chains = [sepolia, celoAlfajores];
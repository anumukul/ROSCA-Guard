import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { sepolia, celoAlfajores } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'ROSCA-Guard',
  projectId: '43fb5aa058dd53ba01887bc2d99253dd',
  chains: [sepolia, celoAlfajores],
  transports: {
    [sepolia.id]: http(),
    [celoAlfajores.id]: http(),
  },
});

export const chains = [sepolia, celoAlfajores];
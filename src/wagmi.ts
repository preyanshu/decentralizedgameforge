import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  ancient8,
  arbitrum,
  base,
  hardhat,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
   hardhat
  ],
  ssr: false,
});
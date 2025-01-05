import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  ancient8,
  ancient8Sepolia

} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
   ancient8Sepolia
  ],
  ssr: false,
});
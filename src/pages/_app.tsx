import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ConnectButton, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import Link from 'next/link'; 

import { config } from '../wagmi';

const client = new QueryClient();

// Navbar component
const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <Link href="/" passHref>
        <button style={styles.button}>Home</button>
      </Link>
      <div style={styles.right}>
        <ConnectButton />
      </div>
    </nav>
  );
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          <Navbar />
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;

// Navbar styles (inline CSS)
const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',  // Dark theme
    color: 'white',
    padding: '10px 20px',
    position: 'sticky',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  button: {
    background: 'none',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  right: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
};

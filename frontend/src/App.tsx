import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, chains } from './config/wallet';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import VerifyIdentity from './pages/VerifyIdentity'; // NEW
import CreateCircle from './pages/CreateCircle';
import BrowseCircles from './pages/BrowseCircles';
import MyCircles from './pages/MyCircles';
import Dashboard from './pages/Dashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <Router>
            <div className="min-h-screen w-full bg-slate-900 overflow-x-hidden">
              <Navbar />
              <div className="w-full">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/verify" element={<VerifyIdentity />} /> {/* NEW */}
                  <Route path="/create" element={<CreateCircle />} />
                  <Route path="/browse" element={<BrowseCircles />} />
                  <Route path="/my-circles" element={<MyCircles />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </div>
              <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#1e293b',
                    color: '#f1f5f9',
                    border: '1px solid #334155'
                  }
                }}
              />
            </div>
          </Router>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;
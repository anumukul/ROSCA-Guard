import { useState, useEffect } from 'react';
import { contractService } from '../services/contractService';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    setLoading(true);
    try {
      const addr = await contractService.connectWallet();
      setAddress(addr);
      await updateBalance(addr);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (addr: string) => {
    try {
      const bal = await contractService.getPYUSDBalance(addr);
      setBalance(bal);
    } catch (error) {
      console.error('Balance update failed:', error);
    }
  };

  const requestFaucet = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      await contractService.requestPYUSDFromFaucet();
      await updateBalance(address);
    } catch (error) {
      console.error('Faucet request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    address,
    balance,
    loading,
    connect,
    requestFaucet,
    updateBalance: () => address && updateBalance(address)
  };
}
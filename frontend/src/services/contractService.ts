import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

export class ContractService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;

  async connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.provider.send('eth_requestAccounts', []);
      this.signer = this.provider.getSigner();
      return await this.signer.getAddress();
    }
    throw new Error('No wallet found');
  }

  async createCircle(params: {
    monthlyAmount: string;
    maxMembers: number;
    duration: number;
    country: string;
    minAge: number;
    maxAge: number;
  }) {
    if (!this.signer) throw new Error('Wallet not connected');

    const factoryABI = [
      "function createCircle(uint256, uint256, uint256, string, uint256, uint256) returns (uint256)"
    ];

    const factory = new ethers.Contract(CONTRACTS.ROSCA_FACTORY, factoryABI, this.signer);
    const monthlyAmountWei = ethers.utils.parseUnits(params.monthlyAmount, 6);

    const tx = await factory.createCircle(
      monthlyAmountWei,
      params.maxMembers,
      params.duration,
      params.country,
      params.minAge,
      params.maxAge
    );

    return await tx.wait();
  }

  async getPYUSDBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');

    const erc20ABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];

    const pyusd = new ethers.Contract(CONTRACTS.MOCK_PYUSD, erc20ABI, this.provider);
    const balance = await pyusd.balanceOf(address);
    return ethers.utils.formatUnits(balance, 6);
  }

  async requestPYUSDFromFaucet() {
    if (!this.signer) throw new Error('Wallet not connected');

    const erc20ABI = [
      "function faucet(uint256) external"
    ];

    const pyusd = new ethers.Contract(CONTRACTS.MOCK_PYUSD, erc20ABI, this.signer);
    const amount = ethers.utils.parseUnits("1000", 6);

    const tx = await pyusd.faucet(amount);
    return await tx.wait();
  }
}

export const contractService = new ContractService();
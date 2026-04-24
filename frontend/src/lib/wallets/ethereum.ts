import { BrowserProvider, formatEther } from "ethers";
import { WalletAdapter } from "@/types/wallet";
import config from "@/lib/config";

const SUPPORTED_CHAIN_BY_MODE: Record<"mainnet" | "testnet", number> = {
  mainnet: 1,
  testnet: 11155111,
};

export class EthereumAdapter implements WalletAdapter {
  private getProvider() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not found");
    }
    return new BrowserProvider(window.ethereum);
  }

  async connect() {
    const provider = this.getProvider();
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const expectedChainId = SUPPORTED_CHAIN_BY_MODE[config.ethereum.network];
    const isUnsupportedNetwork = chainId !== expectedChainId;

    return {
      address,
      publicKey: address,
      network: `chain:${chainId}`,
      walletName: "MetaMask",
      isUnsupportedNetwork,
    };
  }

  async disconnect() {
    // EIP-1193 doesn't support programmatic logout
  }

  async signTransaction(tx: any) {
    const provider = this.getProvider();
    const signer = await provider.getSigner();
    return await signer.sendTransaction(tx);
  }

  async getBalance(address: string) {
    const provider = this.getProvider();
    const balance = await provider.getBalance(address);
    return formatEther(balance);
  }
}

// Add ethereum to window for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

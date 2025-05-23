'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import "@fontsource/press-start-2p";
import { contractABI } from './contractABI';

const contractAddress = '0xBa4164f58194489175CF6967AB60f412145C03BC';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setStatus('🔁 Wallet changed');
      } else {
        setAccount(null);
        setStatus('🛑 Wallet disconnected');
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const sepoliaChainId = '0xaa36a7'; // 十六進位 chainId for Sepolia = 11155111

  async function ensureSepoliaNetwork() {
    if (!window.ethereum) return false;

    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

    if (currentChainId !== sepoliaChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: sepoliaChainId }],
        });
        setStatus('🔄 Switched to Sepolia');
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // 如果沒裝 Sepolia
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: sepoliaChainId,
                chainName: 'Sepolia Test Network',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
            setStatus('✅ Sepolia added & selected');
          } catch (addError) {
            setStatus('❌ Failed to add Sepolia network');
            return false;
          }
        } else {
          setStatus('⚠️ Please switch to Sepolia manually');
          return false;
        }
      }
    }

    return true;
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert('🦊 Please install MetaMask');
      return;
    }

    const ok = await ensureSepoliaNetwork();
    if (!ok) return;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setStatus('✅ Wallet connected');
      }
    } catch (error) {
      setStatus('❌ Failed to connect wallet');
    }
  }


  async function mintNFT() {
    if (!window.ethereum || !account) return;
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== sepoliaChainId) {
      setStatus('⚠️ Please switch to Sepolia before minting');
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
      const tx = await contract.mint();
      setStatus('⌛ Minting NFT...');
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log: { topics: ReadonlyArray<string>; data: string }) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: any) => parsed?.name === 'Transfer');

      setStatus('🎉 NFT Claimed Successfully!');
    } catch (err: any) {
      if (err?.message?.includes('already minted')) {
        setStatus("⚠️ You already minted one!");
      } else {
        console.error(err);
        setStatus("❌ Minting failed, please try again");
      }
    }
  }

  async function requestAccountPermissions() {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount(null);
        setStatus('🛑 No account selected');
      }
    } catch (error) {
      console.error(error);
      setStatus('❌ Failed to change accounts');
    }
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center text-gray-800 font-['Press Start 2P'] px-4 py-12 flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/cathay-bg.png')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="border-4 border-green-900 p-6 rounded-none shadow-[6px_6px_0px_black] bg-white/80 backdrop-blur-sm max-w-md w-full text-center text-[10px]">
        <h1 className="text-xl text-green-900 mb-4 border-b-4 border-green-900 pb-2">
          🎓 Redeem Your NFT
        </h1>

        <p className="text-gray-700 mb-6">Cathay-NCU Certificate 2025</p>

        {!account ? (
          <button
            onClick={connectWallet}
            className="bg-green-900 text-white py-2 px-6 border-4 border-black rounded-none shadow-[4px_4px_0px_black] hover:bg-green-800"
          >
            🦊 Connect Wallet
          </button>
        ) : (
          <>
            <p className="text-[9px] mb-4 text-gray-800">
              ✅ Connected: <span className="break-all text-green-700">{account}</span>
            </p>

            <button
              onClick={mintNFT}
              className="bg-yellow-400 text-black py-2 px-6 border-4 border-black rounded-none shadow-[4px_4px_0px_black] hover:bg-black hover:text-yellow-300 mr-2"
            >
              🎁 Claim NFT Certificate
            </button>

            <br /><br />
            <button
              onClick={requestAccountPermissions}
              className="bg-green-500 text-white py-2 px-4 border-4 border-black rounded-none shadow-[4px_4px_0px_black] hover:bg-black hover:text-green-400"
            >
              🔄 Switch Accounts
            </button>
          </>
        )}

        {status && <p className="mt-4 text-gray-800">{status}</p>}
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import "@fontsource/press-start-2p";

const contractAddress = 'YOUR_CONTRACT_ADDRESS'; // 替換為你的合約地址
const contractABI = [
  // 替換為你部署的合約 ABI
];

// 🔧 解決 TypeScript 不認得 window.ethereum 的問題
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        setStatus('❌ Failed to connect wallet');
      }
    } else {
      alert('🦊 Please install MetaMask');
    }
  }

  async function mintNFT() {
    // if (!window.ethereum || !account) return;
    // const provider = new ethers.BrowserProvider(window.ethereum);
    // const signer = await provider.getSigner();
    // const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // try {
    //   const tx = await contract.mint();
    //   setStatus('⌛ Minting NFT...');
    //   await tx.wait();
    //   setStatus('🎉 NFT Certificate Redeemed!');
    // } catch (err) {
    //   console.error(err);
    //   setStatus('❌ Minting failed, please try again');
    // }
  }

  return (
    <main className="min-h-screen bg-yellow-50 text-gray-800 font-['Press Start 2P'] px-4 py-12 flex flex-col items-center justify-center">
      <div className="border-4 border-blue-900 p-6 rounded-none shadow-[6px_6px_0px_black] bg-white max-w-md w-full text-center text-[10px]">
        <br/><br/>
        <h1 className="text-xl text-blue-900 mb-4 border-b-4 border-blue-900 pb-2">
          🎓 Redeem Your NFT
        </h1>
        <br/>
        <p className="text-gray-700 mb-6">Cathay-NCU Certificate 2025</p>
        <br/><br/>

        {!account ? (
          <button
            onClick={connectWallet}
            className="bg-blue-900 text-white py-2 px-6 border-4 border-black rounded-none shadow-[4px_4px_0px_black] hover:bg-blue-800"
          >
            🦊 Connect Wallet
          </button>
        ) : (
          <>
            <p className="text-[9px] mb-4 text-gray-800">
              ✅ Connected: <span className="break-all text-blue-700">{account}</span>
            </p>
            <button
              onClick={mintNFT}
              className="bg-yellow-400 text-black py-2 px-6 border-4 border-black rounded-none shadow-[4px_4px_0px_black] hover:bg-black hover:text-yellow-300"
            >
              🎁 Claim NFT Certificate
            </button>
          </>
        )}

        {status && <p className="mt-4 text-gray-800">{status}</p>}
      </div>
    </main>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import "@fontsource/press-start-2p";

import { contractABI } from './contractABI';
const contractAddress = '0xe6B5358D47667DEa22fcA9F9515DD4398b1f3344';

// 🔧 擴充 window.ethereum 型別
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  // 監聽帳號變化
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

    // 註冊事件
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      // 移除事件監聽
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  // 🦊 初次連線
  async function connectWallet() {
    if (!window.ethereum) {
      alert('🦊 Please install MetaMask');
      return;
    }
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

  // 🎁 Mint NFT
  async function mintNFT() {
    if (!window.ethereum || !account) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
      const tx = await contract.mint();
      setStatus('⌛ Minting NFT...');
      await tx.wait();
      setStatus('🎉 NFT Certificate Redeemed!');
    } catch (err) {
      console.error(err);
      setStatus('❌ Minting failed, please try again');
    }
  }

  // 🔄 手動請求切換帳號
  async function requestAccountPermissions() {
    if (!window.ethereum) {
      alert('🦊 Please install MetaMask');
      return;
    }
    try {
      // 新 API：讓使用者選擇要連接的帳號
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // 再次讀取最新帳號清單
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        // setStatus(`✅ Switched to ${accounts[0]}`);
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
    <main className="min-h-screen bg-yellow-50 text-gray-800 font-['Press Start 2P'] px-4 py-12 flex flex-col items-center justify-center">
      <div className="border-4 border-blue-900 p-6 rounded-none shadow-[6px_6px_0px_black] bg-white max-w-md w-full text-center text-[10px]">
        <br /><br />
        <h1 className="text-xl text-blue-900 mb-4 border-b-4 border-blue-900 pb-2">
          🎓 Redeem Your NFT
        </h1>
        <br />
        <p className="text-gray-700 mb-6">Cathay-NCU Certificate 2025</p>
        <br /><br />

        {/* 
          如果尚未連接 -> 顯示連接錢包按鈕 
          已連接 -> 顯示錢包帳號 & Mint 按鈕 
        */}
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
              className="bg-yellow-400 text-black py-2 px-6 border-4 border-black rounded-none shadow-[4px_4px_0px_black] hover:bg-black hover:text-yellow-300 mr-2"
            >
              🎁 Claim NFT Certificate
            </button>

            <br/><br/>

            {/* 🔄 切換帳號按鈕 */}
            <button
              onClick={requestAccountPermissions}
              className="bg-blue-500 text-white py-2 px-4 border-4 border-black rounded-none shadow-[4px_4px_0px_black] hover:bg-blue-400"
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

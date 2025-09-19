'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { contractABI } from '../contractABI';

const contractAddress = '0x28ac72ab26b39e5E77CB86478F2B82e64dCcF35d';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function AdminDashboard() {
  const [mintedUsers, setMintedUsers] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [intervalRef, setIntervalRef] = useState<NodeJS.Timeout | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    fetchMintedUsers();
    fetchWinner();
  }, []);

  async function fetchMintedUsers() {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const allUsers = await contract.getAllMintedUsers();
    setMintedUsers(allUsers);
  }

  async function fetchWinner() {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const result = await contract.getWinner();
    if (result !== ethers.ZeroAddress) setWinner(result);
  }

  function startSlotAnimation(duration: number, speed: number) {
    if (intervalRef) clearInterval(intervalRef);
    let current = 0;
    const totalSpins = Math.floor(duration / speed);
    const interval = setInterval(() => {
      setSlotIndex((prev) => (prev === null ? 0 : (prev + 1) % mintedUsers.length));
      current++;
      if (current >= totalSpins) clearInterval(interval);
    }, speed);
    setIntervalRef(interval);
  }

  async function pickWinner() {
    if (!window.ethereum || mintedUsers.length === 0) return;

    setIsWaiting(true);
    setSlotIndex(null);
    setWinner(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.pickWinner();
      await tx.wait();

      setIsWaiting(false);
      setIsSpinning(true);
      startSlotAnimation(5000, 100);

      setTimeout(async () => {
        if (intervalRef) clearInterval(intervalRef);
        const finalWinner = await contract.getWinner();
        setWinner(finalWinner);
        setIsSpinning(false);
        setSlotIndex(null);
      }, 5000);
    } catch (err) {
      console.error(err);
      alert('❌ Failed to pick winner');
      if (intervalRef) clearInterval(intervalRef);
      setSlotIndex(null);
      setIsWaiting(false);
      setIsSpinning(false);
    }
  }

  async function resetWinner() {
    if (!window.ethereum) return;
    setIsWaiting(true);
    if (intervalRef) clearInterval(intervalRef);
    setSlotIndex(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.resetWinner();
      await tx.wait();

      setWinner(null);
      alert('✅ Winner has been reset!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to reset winner');
    } finally {
      setIsWaiting(false);
      setIsSpinning(false);
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
      <div className="bg-white border-4 border-black rounded-lg shadow-lg p-6 w-full max-w-xl">
        <h2 className="text-lg font-bold mb-2">Minted Users ({mintedUsers.length})</h2>
        <ul className="text-xs max-h-60 overflow-y-auto border p-2 rounded">
          {mintedUsers.map((addr, i) => (
            <li key={i} className={`mb-1 break-all ${slotIndex === i ? 'bg-yellow-200 font-bold' : ''}`}>
              🧑 {addr}
            </li>
          ))}
        </ul>

        <div className="mt-6 text-center flex flex-col items-center gap-2">
          <div className="flex flex-row justify-center gap-4">
            <button
              onClick={pickWinner}
              disabled={isWaiting || isSpinning || winner !== null}
              className="bg-yellow-400 border-4 border-black px-4 py-2 rounded shadow-md hover:bg-black hover:text-yellow-300"
            >
              {isWaiting
                ? '📝 Waiting for MetaMask...'
                : isSpinning
                ? '🎰 Spinning...'
                : '🎰 Pick Winner'}
            </button>

            {winner && (
              <button
                onClick={resetWinner}
                disabled={isWaiting}
                className="bg-red-500 text-white border-4 border-black px-4 py-2 rounded shadow-md hover:bg-black hover:text-red-300"
              >
                🔁 Reset Winner
              </button>
            )}
          </div>

          {winner && (
            <div className="mt-4 text-green-800 text-sm">
              🎉 Winner: <span className="font-bold">{winner}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

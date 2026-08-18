'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import ForzaContract from '@/abi/Forza.json';

export default function VerificationPortal() {
  const [tokenId, setTokenId] = useState('');
  // Consolidating all status and error tracking into one clean object
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [certificateData, setCertificateData] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId) return;

    // Reset states before starting the new query
    setStatus({ loading: true, error: '' });
    setCertificateData(null);

    try {
      // Connect directly to the blockchain (read-only, no wallet needed!)
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, 
        ForzaContract.abi, 
        provider
      );

      // Call the verify function from Forza.sol
      const cert = await contract.verifyCertificate(tokenId);

      // Populate the data regardless of whether it is valid or revoked. 
      // The JSX at the bottom will automatically change colors based on cert.isValid!
      setCertificateData({
        studentName: cert.studentName,
        programme: cert.programme,
        graduationYear: cert.graduationYear.toString(),
        institution: cert.institution,
        ipfsCID: cert.ipfsCID,
        isValid: cert.isValid,
        issuedAt: new Date(Number(cert.issuedAt) * 1000).toLocaleDateString()
      });
      
      setStatus({ loading: false, error: '' });

    } catch (err: any) {
      console.error(err);
      
      // Catch the specific revert error from the smart contract if it never existed
      if (err.message && err.message.includes("does not exist")) {
        setStatus({ 
          loading: false, 
          error: "Certificate Not Found. This Token ID has never been registered on this ledger." 
        });
      } else {
        setStatus({ 
          loading: false, 
          error: "A network error occurred while querying the blockchain ledger." 
        });
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="max-w-3xl mx-auto mt-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Forza Public Verification
          </h1>
          <p className="text-slate-500 mt-2">Instantly verify academic credentials via the blockchain.</p>
        </header>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <form onSubmit={handleVerify} className="flex gap-4">
            <input 
              type="number" 
              required 
              value={tokenId} 
              onChange={(e) => setTokenId(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="Enter Certificate Token ID (e.g., 0)"
            />
            <button 
              type="submit" 
              disabled={status.loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {status.loading ? 'Querying Ledger...' : 'Verify'}
            </button>
          </form>

          {/* Error State: Completely Not Found */}
          {status.error && (
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
              <span className="text-4xl block mb-2">❌</span>
              <h3 className="text-lg font-bold text-red-800">Verification Failed</h3>
              <p className="text-red-600 mt-1">{status.error}</p>
            </div>
          )}

          {/* Record Found State: Display Authentic (Green) OR Revoked (Orange) */}
          {certificateData && (
            <div className={`mt-8 p-6 border rounded-xl ${certificateData.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="text-center mb-6">
                <span className="text-4xl block mb-2">
                  {certificateData.isValid ? '✅' : '⚠️'}
                </span>
                <h3 className={`text-2xl font-bold ${certificateData.isValid ? 'text-emerald-800' : 'text-orange-800'}`}>
                  {certificateData.isValid ? 'Authentic Credential' : 'Revoked Credential'}
                </h3>
                {!certificateData.isValid && (
                  <p className="text-orange-600 font-medium mt-1">This certificate was officially revoked by the issuing institution.</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm space-y-4 opacity-90">
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <p className="text-sm text-slate-500">Graduate Name</p>
                    <p className={`font-semibold text-lg ${!certificateData.isValid && 'line-through text-slate-400'}`}>{certificateData.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Programme</p>
                    <p className={`font-semibold text-lg ${!certificateData.isValid && 'line-through text-slate-400'}`}>{certificateData.programme}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <p className="text-sm text-slate-500">Class Of</p>
                    <p className="font-medium">{certificateData.graduationYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date Issued</p>
                    <p className="font-medium">{certificateData.issuedAt}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Issuing Institution (Wallet Address)</p>
                  <p className="font-mono text-sm bg-slate-50 p-2 rounded mt-1 break-all">
                    {certificateData.institution}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Document Cryptographic Hash (IPFS CID)</p>
                  <p className="font-mono text-sm bg-slate-50 p-2 rounded mt-1 break-all text-blue-600">
                    {certificateData.ipfsCID}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
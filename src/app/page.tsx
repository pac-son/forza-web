'use client';

import { useState } from 'react';

export default function InstitutionDashboard() {
  const [formData, setFormData] = useState({
    studentMatricNum: '',
    studentName: '',
    programme: '',
    graduationYear: '',
  });

  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [revokeStatus, setRevokeStatus] = useState({ loading: false, message: '', type: '' });
  
  // New state to hold the selected file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setStatus({ loading: false, message: 'Please attach a certificate file.', type: 'error' });
      return;
    }

    try {
      // Step 1: Upload the file to IPFS
      setStatus({ loading: true, message: 'Uploading document to IPFS...', type: 'info' });
      
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const uploadResult = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadResult.error || "IPFS Upload failed");

      // We now have the real, immutable cryptographic hash of the document!
      const realIpfsCID = `ipfs://${uploadResult.ipfsHash}`;

      // Step 2: Issue the Certificate on the Blockchain
      setStatus({ loading: true, message: 'Securing wallet & minting to blockchain...', type: 'info' });

      const issueRes = await fetch('/api/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          graduationYear: parseInt(formData.graduationYear),
          ipfsCID: realIpfsCID // Pass the real CID instead of the placeholder
        }),
      });

      const issueData = await issueRes.json();
      
      if (issueRes.ok) {
        setStatus({ 
          loading: false, 
          message: `Success! Certificate minted. Token ID: ${issueData.tokenId} | EOA: ${issueData.studentAddress}`,
          type: 'success' 
        });
        setFormData({ studentMatricNum: '', studentName: '', programme: '', graduationYear: '' });
        setSelectedFile(null);
      } else {
        setStatus({ loading: false, message: `Error: ${issueData.error}`, type: 'error' });
      }
    } catch (error: any) {
      setStatus({ loading: false, message: error.message || 'A network error occurred.', type: 'error' });
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!revokeTokenId) return;

    // Confirm with the user before doing something permanent
    if (!window.confirm(`WARNING: Are you absolutely sure you want to permanently revoke Token ID ${revokeTokenId}? This action cannot be undone on the blockchain.`)) {
      return;
    }

    try {
      setRevokeStatus({ loading: true, message: 'Broadcasting revocation to Sepolia network...', type: 'info' });

      const res = await fetch('/api/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: revokeTokenId }),
      });

      const data = await res.json();

      if (res.ok) {
        setRevokeStatus({ loading: false, message: `Success! ${data.message} (Tx: ${data.txHash})`, type: 'success' });
        setRevokeTokenId(''); // Clear the input
      } else {
        setRevokeStatus({ loading: false, message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error: any) {
      setRevokeStatus({ loading: false, message: 'A network error occurred while trying to revoke.', type: 'error' });
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-emerald-400">
            Forza Registry
          </h1>
          <p className="text-slate-400 mt-2">Institutional Issuance Dashboard</p>
        </header>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6">Issue New Certificate</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Matriculation Number</label>
                <input 
                  type="text" required name="studentMatricNum" value={formData.studentMatricNum} onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Graduation Year</label>
                <input 
                  type="number" required name="graduationYear" value={formData.graduationYear} onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Student Full Name</label>
              <input 
                type="text" required name="studentName" value={formData.studentName} onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Academic Programme</label>
              <input 
                type="text" required name="programme" value={formData.programme} onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* New File Upload Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Digital Certificate Document (PDF/JPG)</label>
              <input 
                type="file" required onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg"
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <button 
              type="submit" disabled={status.loading}
              className="w-full mt-4 bg-linear-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50"
            >
              {status.loading ? 'Processing...' : 'Issue Digital Certificate'}
            </button>
          </form>

          {status.message && (
            <div className={`mt-6 p-4 rounded-lg border ${status.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : status.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-blue-500/20 border-blue-500/50 text-blue-200'}`}>
              <p className="text-sm font-medium break-all">{status.message}</p>
            </div>
          )}
        </div>
        {/* --- REVOCATION DANGER ZONE --- */}
        <div className="mt-8 bg-red-500/10 border border-red-500/30 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-2 text-red-400">Danger Zone: Revoke Credential</h2>
          <p className="text-slate-400 text-sm mb-6">
            Permanently void a certificate. This will mark the Token ID as invalid on the blockchain and it will fail all future verification checks.
          </p>
          
          <form onSubmit={handleRevoke} className="flex gap-4">
            <input 
              type="number" required placeholder="Enter Token ID to Revoke"
              value={revokeTokenId} onChange={(e) => setRevokeTokenId(e.target.value)}
              className="flex-1 bg-slate-800/50 border border-red-900/50 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
            />
            <button 
              type="submit" disabled={revokeStatus.loading}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 transition-colors"
            >
              {revokeStatus.loading ? 'Revoking...' : 'Void Certificate'}
            </button>
          </form>

          {revokeStatus.message && (
            <div className={`mt-4 p-4 rounded-lg border ${revokeStatus.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : revokeStatus.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-blue-500/20 border-blue-500/50 text-blue-200'}`}>
              <p className="text-sm font-medium break-all">{revokeStatus.message}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
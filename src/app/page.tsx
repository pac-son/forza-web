'use client';

import { useState } from 'react';

export default function InstitutionDashboard() {
  const [formData, setFormData] = useState({
    studentMatricNum: '',
    studentName: '',
    programme: '',
    graduationYear: '',
    ipfsCID: 'ipfs://QmPlaceholderCID123456789', // We will wire up actual IPFS uploads next
  });
  
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, message: 'Generating secure EOA & encrypting keys...', type: 'info' });

    try {
      const res = await fetch('/api/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          graduationYear: parseInt(formData.graduationYear)
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setStatus({ 
          loading: false, 
          message: `Success! Certificate queued. Student EOA: ${data.studentAddress}`, 
          type: 'success' 
        });
        // Clear form
        setFormData({ ...formData, studentMatricNum: '', studentName: '', programme: '', graduationYear: '' });
      } else {
        setStatus({ loading: false, message: `Error: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      setStatus({ loading: false, message: 'A network error occurred.', type: 'error' });
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

        {/* Glassmorphism Form Container */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6">Issue New Certificate</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Matriculation Number</label>
                <input 
                  type="text" required name="studentMatricNum" value={formData.studentMatricNum} onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. FUO/22/CSI/18953"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Graduation Year</label>
                <input 
                  type="number" required name="graduationYear" value={formData.graduationYear} onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="2026"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Student Full Name</label>
              <input 
                type="text" required name="studentName" value={formData.studentName} onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Academic Programme</label>
              <input 
                type="text" required name="programme" value={formData.programme} onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="B.Sc. Computer Science"
              />
            </div>

            <button 
              type="submit" 
              disabled={status.loading}
              className="w-full mt-4 bg-linear-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status.loading ? 'Processing...' : 'Issue Digital Certificate'}
            </button>
          </form>

          {/* Status Messages */}
          {status.message && (
            <div className={`mt-6 p-4 rounded-lg border ${status.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : status.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-blue-500/20 border-blue-500/50 text-blue-200'}`}>
              <p className="text-sm font-medium break-all">{status.message}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
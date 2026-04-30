import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, ShieldCheck, Loader2, Home } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Application } from '../types';
import { format } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface VerificationPageProps {
  onNavigate?: (page: string) => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ onNavigate }) => {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Application | null | 'not_found'>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setSearchId(id);
      handleVerify(id);
    }
  }, []);

  const handleVerify = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const q = query(
        collection(db, 'applications'), 
        where('status', '==', 'approved'),
        where('id', '==', id)
      );
      const qCert = query(
        collection(db, 'applications'),
        where('status', '==', 'approved'),
        where('certificateId', '==', id)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(qCert)]);
      
      let app: Application | null = null;
      if (!snap1.empty) app = snap1.docs[0].data() as Application;
      else if (!snap2.empty) app = snap2.docs[0].data() as Application;

      setResult(app || 'not_found');
    } catch (error) {
      console.error(error);
      setResult('not_found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4 relative">
          {onNavigate && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute left-0 top-0 text-gray-500 hover:text-green-700"
              onClick={() => onNavigate('landing')}
            >
              <Home size={18} className="mr-2" />
              Home
            </Button>
          )}
          <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full text-green-800 mb-2">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Public Verification Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Verify the authenticity of an Indigene Certificate or Registration ID.
          </p>
        </div>

        <Card className="shadow-xl border-t-4 border-t-green-600">
          <CardHeader>
            <CardTitle>Search Records</CardTitle>
            <CardDescription>Enter Registration ID (e.g., IND-2026-0001) or Certificate ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input 
                  placeholder="Enter ID here..." 
                  className="pl-10 h-12 text-lg"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify(searchId)}
                />
              </div>
              <Button 
                size="lg" 
                className="bg-green-700 hover:bg-green-800 h-12 px-8"
                onClick={() => handleVerify(searchId)}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result === 'not_found' && (
          <Card className="border-red-200 bg-red-50 animate-in fade-in slide-in-from-top-4">
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <XCircle size={64} className="text-red-500" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-red-900">Invalid Record</h3>
                <p className="text-red-700">No valid record found for ID: <span className="font-mono font-bold">{searchId}</span></p>
                <p className="text-sm text-red-600 italic">Warning: This may be a fake or unregistered certificate.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && result !== 'not_found' && (
          <Card className="border-green-200 bg-green-50 animate-in fade-in slide-in-from-top-4">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-center gap-4 text-green-800">
                <CheckCircle2 size={48} />
                <h3 className="text-3xl font-bold">Valid Certificate</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-green-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs uppercase font-bold text-gray-500">Full Name</p>
                  <p className="text-xl font-bold text-gray-900">{result.fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase font-bold text-gray-500">Status</p>
                  <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase font-bold text-gray-500">State of Origin</p>
                  <p className="text-lg font-semibold text-gray-800">{result.state} State</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase font-bold text-gray-500">Local Govt Area</p>
                  <p className="text-lg font-semibold text-gray-800">{result.lga}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase font-bold text-gray-500">Issue Date</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {result.issueDate ? format(result.issueDate.toDate(), 'PPP') : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase font-bold text-gray-500">Certificate ID</p>
                  <p className="text-lg font-mono font-bold text-green-700">{result.certificateId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

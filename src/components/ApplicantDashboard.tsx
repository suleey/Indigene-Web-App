import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, FileText, User, LogOut, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Application } from '../types';
import { Certificate } from './Certificate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface ApplicantDashboardProps {
  user: any;
  onLogout: () => void;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ user, onLogout }) => {
  const [downloading, setDownloading] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.registrationId) return;

    const q = query(collection(db, "applications"), where("id", "==", user.registrationId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setApplication(snapshot.docs[0].data() as Application);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching application:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const downloadPDF = async () => {
    const element = document.getElementById('certificate-content');
    if (!element) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Indigene_Certificate_${application?.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="text-green-600" size={48} />;
      case 'rejected': return <XCircle className="text-red-600" size={48} />;
      default: return <Clock className="text-amber-500" size={48} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-700" size={48} />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-2xl font-bold">Application Not Found</h2>
        <Button onClick={onLogout}>Logout</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800 font-bold text-xl">
            <ShieldCheck size={32} />
            <span>Applicant Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900">{application.fullName}</p>
              <p className="text-xs text-gray-500 font-mono">{application.id}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-500 hover:text-red-600">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Status Overview */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-2 shadow-sm border-none">
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>Track the progress of your indigenship registration.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-8 p-8">
              <div className="flex-shrink-0">
                {getStatusIcon(application.status)}
              </div>
              <div className="space-y-4 flex-1 text-center sm:text-left">
                <div>
                  <Badge className={`text-sm px-4 py-1 uppercase tracking-wider font-bold ${getStatusColor(application.status)}`}>
                    {application.status}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {application.status === 'approved' ? 'Congratulations! Your application was approved.' : 
                   application.status === 'rejected' ? 'Application Rejected' : 
                   'Your application is currently under review.'}
                </h3>
                {application.remarks && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex gap-3">
                    <AlertCircle className="text-slate-400 flex-shrink-0" size={20} />
                    <p className="text-gray-600 text-sm italic">"{application.remarks}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-green-700 text-white">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.status === 'approved' ? (
                <Button 
                  className="w-full bg-white text-green-800 hover:bg-green-50 h-12 font-bold"
                  onClick={downloadPDF}
                  disabled={downloading}
                >
                  {downloading ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" size={20} />}
                  Download Certificate
                </Button>
              ) : (
                <Button className="w-full bg-green-600/50 cursor-not-allowed h-12" disabled>
                  Certificate Unavailable
                </Button>
              )}
              <Button variant="outline" className="w-full border-green-500 text-white hover:bg-green-800 h-12">
                <FileText className="mr-2" size={20} /> View Submission
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Certificate Preview (Only if approved) */}
        {application.status === 'approved' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Digital Certificate Preview</h2>
              <p className="text-sm text-gray-500">This is a secure digital copy of your official certificate.</p>
            </div>
            <div className="flex justify-center bg-slate-200 p-8 rounded-2xl overflow-x-auto">
              <div className="shadow-2xl scale-[0.6] sm:scale-[0.8] md:scale-100 origin-top">
                <Certificate application={application} />
              </div>
            </div>
          </div>
        )}

        {/* Details Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User size={20} /> Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Full Name</p>
                  <p className="font-semibold">{application.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Gender</p>
                  <p className="font-semibold capitalize">{application.gender}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Date of Birth</p>
                  <p className="font-semibold">{application.dob}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">NIN</p>
                  <p className="font-semibold">{application.nin || 'Not Provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck size={20} /> Indigenship Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">State of Origin</p>
                  <p className="font-semibold">{application.state}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">LGA</p>
                  <p className="font-semibold">{application.lga}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Ward</p>
                  <p className="font-semibold">{application.ward}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Certificate ID</p>
                  <p className="font-semibold font-mono text-green-700">{application.certificateId || 'Pending Approval'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

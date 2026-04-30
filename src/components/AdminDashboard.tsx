import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, CheckCircle, XCircle, Clock, Eye, LogOut, Search, Filter, Award, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Application } from '../types';
import { format } from 'date-fns';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

// Inline Textarea to avoid missing module error
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "applications"), (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Application));
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      console.error("Admin fetch error:", error);
      setLoading(false);
      if (error.code === 'permission-denied') {
        toast.error("Access Denied: You do not have permission to view applications. Please ensure your email is verified and recognized as an admin.");
      } else {
        toast.error("Error fetching applications: " + error.message);
      }
    });

    return () => unsubscribe();
  }, []);

  const stats = {
    total: applications.length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    pending: applications.filter(a => a.status === 'pending').length,
  };

  const handleApprove = async (appId: string) => {
    try {
      const certId = `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      await updateDoc(doc(db, "applications", appId), {
        status: 'approved',
        certificateId: certId,
        issueDate: serverTimestamp(),
      });
      setIsReviewOpen(false);
      setSelectedApp(null);
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Failed to approve application.");
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await updateDoc(doc(db, "applications", appId), {
        status: 'rejected',
        remarks,
      });
      setIsRejectOpen(false);
      setIsReviewOpen(false);
      setSelectedApp(null);
      setRemarks('');
    } catch (error) {
      console.error("Rejection failed:", error);
      alert("Failed to reject application.");
    }
  };

  const filteredApps = applications.filter(a => 
    a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 text-green-400 font-bold text-xl">
          <ShieldCheck size={32} />
          <span>Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start bg-slate-800 text-white">
            <Users size={20} className="mr-3" /> Applications
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
            <Award size={20} className="mr-3" /> Certificates
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={onLogout}>
            <LogOut size={20} className="mr-3" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold">System Admin</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onLogout}>
              <LogOut size={20} />
            </Button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Applications", value: stats.total, icon: <Users />, color: "bg-blue-500" },
              { label: "Approved", value: stats.approved, icon: <CheckCircle />, color: "bg-green-500" },
              { label: "Rejected", value: stats.rejected, icon: <XCircle />, color: "bg-red-500" },
              { label: "Pending", value: stats.pending, icon: <Clock />, color: "bg-amber-500" },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm overflow-hidden">
                <div className={`h-1 ${stat.color}`} />
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} text-white opacity-20`}>
                    {stat.icon}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Applications Table */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Review and manage indigenship registrations.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    placeholder="Search by name or ID..." 
                    className="pl-9 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon"><Filter size={16} /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Reg ID</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                            <img src={app.passportUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{app.fullName}</p>
                            <p className="text-xs text-gray-500">{app.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold">{app.id}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{app.state}</p>
                        <p className="text-xs text-gray-500">{app.lga}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {app.createdAt?.toDate ? format(app.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`
                          ${app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-amber-100 text-amber-800'} 
                          border-none font-bold uppercase text-[10px]
                        `}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setSelectedApp(app); setIsReviewOpen(true); }}
                        >
                          <Eye size={16} className="mr-2" /> Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Review</DialogTitle>
            <DialogDescription>Review details for {selectedApp?.fullName}</DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl border-2 border-slate-200 overflow-hidden">
                    <img src={selectedApp.passportUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedApp.fullName}</h3>
                    <p className="text-slate-500">{selectedApp.id}</p>
                    <Badge className="mt-2">{selectedApp.status.toUpperCase()}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase text-[10px] font-bold">Gender</p>
                    <p className="font-medium capitalize">{selectedApp.gender}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase text-[10px] font-bold">DOB</p>
                    <p className="font-medium">{selectedApp.dob}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase text-[10px] font-bold">Phone</p>
                    <p className="font-medium">{selectedApp.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase text-[10px] font-bold">NIN</p>
                    <p className="font-medium">{selectedApp.nin || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Residential Address</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg border">{selectedApp.address}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 space-y-4">
                  <h4 className="font-bold text-green-800 flex items-center gap-2">
                    <Award size={18} /> Origin Claim
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-green-600/60 uppercase text-[10px] font-bold">State</p>
                      <p className="font-bold text-green-900">{selectedApp.state}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-green-600/60 uppercase text-[10px] font-bold">LGA</p>
                      <p className="font-bold text-green-900">{selectedApp.lga}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-green-600/60 uppercase text-[10px] font-bold">Ward</p>
                      <p className="font-bold text-green-900">{selectedApp.ward}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Supporting Documents</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <FileText size={14} className="mr-2" /> Birth Certificate
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <FileText size={14} className="mr-2" /> LGA Letter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedApp?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => setIsRejectOpen(true)}>
                  <XCircle size={18} className="mr-2" /> Reject Application
                </Button>
                <Button className="bg-green-700 hover:bg-green-800" onClick={() => handleApprove(selectedApp.id)}>
                  <CheckCircle size={18} className="mr-2" /> Approve & Issue Certificate
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setIsReviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>Please provide a reason for rejection. This will be visible to the applicant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Remarks</Label>
              <Textarea 
                placeholder="e.g., Supporting documents are unclear or invalid." 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedApp && handleReject(selectedApp.id)}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLogin: (user: any) => void;
}

export const ApplicantLogin: React.FC<LoginPageProps> = ({ onNavigate, onLogin }) => {
  const [regId, setRegId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Find user by registrationId using the lookup collection (which is public)
      const lookupDoc = await getDoc(doc(db, "registration_lookup", regId));
      
      if (!lookupDoc.exists()) {
        throw new Error("Invalid Registration ID");
      }

      const lookupData = lookupDoc.data();
      
      // 2. Sign in with email
      await signInWithEmailAndPassword(auth, lookupData.email, password);
      
      // 3. Fetch full user data after login
      const userDoc = await getDoc(doc(db, "users", lookupData.uid));
      const userData = userDoc.data();
      
      onLogin(userData);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast.error("Deployment Error: This domain is not authorized in Firebase. Please add this URL to your Firebase Console authorized domains.");
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error("Invalid credentials. Please check your Registration ID and Password.");
      } else {
        toast.error("Login failed: " + (error.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <Card className="shadow-2xl border-t-4 border-t-green-600">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                <User size={32} />
              </div>
            </div>
            <CardTitle className="text-2xl">Applicant Login</CardTitle>
            <CardDescription>Enter your Registration ID and Password to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Registration ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    placeholder="IND-2026-XXXX" 
                    className="pl-10" 
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 h-12" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-sm text-center text-gray-500">
              Don't have an account? <button onClick={() => onNavigate('register')} className="text-green-700 font-bold hover:underline">Register here</button>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => onNavigate('landing')}>
              <ArrowLeft size={16} className="mr-2" /> Back to Home
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export const AdminLogin: React.FC<LoginPageProps> = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if this user is an admin in Firestore or by email
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const isAdmin = (userDoc.exists() && userDoc.data().role === 'admin') || 
                      (user.email === 'slymankn@gmail.com');

      if (isAdmin) {
        onLogin({ role: 'admin', uid: user.uid, email: user.email });
        toast.success("Admin access granted");
      } else {
        await auth.signOut();
        toast.error("Access Denied: Your email (" + user.email + ") is not recognized as an administrator.");
      }
    } catch (error: any) {
      console.error("Admin Login Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast.error("Deployment Error: This domain is not authorized in Firebase. Please add this URL to your Firebase Console authorized domains.");
      } else if (error.code === 'auth/popup-blocked') {
        toast.error("Popup Blocked: Please allow popups for this site to sign in with Google.");
      } else {
        toast.error("Login failed: " + (error.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        onLogin({ role: 'admin', uid: user.uid, email: user.email });
        toast.success("Admin access granted");
      } else {
        await auth.signOut();
        toast.error("Access Denied: You do not have administrator privileges.");
      }
    } catch (error: any) {
      toast.error("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
        <Card className="shadow-2xl border-none bg-slate-800 text-white">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-slate-700 text-green-400 rounded-full flex items-center justify-center border-2 border-green-500/30">
                <ShieldCheck size={32} />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-400">Admin Portal</CardTitle>
            <CardDescription className="text-slate-400">Restricted access for authorized personnel only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full bg-white text-slate-900 hover:bg-slate-100 h-12 font-bold"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-2" alt="" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-2 text-slate-400">Or email login</span></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Admin Email</Label>
                <Input 
                  type="email"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" 
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <Input 
                  type="password" 
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Authorize Access"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-700" onClick={() => onNavigate('landing')}>
              <ArrowLeft size={16} className="mr-2" /> Exit to Public Site
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

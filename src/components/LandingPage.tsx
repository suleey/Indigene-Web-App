import React from 'react';
import { ShieldCheck, UserPlus, LogIn, Search, Award, FileText, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { motion } from 'motion/react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800 font-bold text-xl">
            <ShieldCheck size={32} />
            <span className="hidden sm:inline">Indigene System</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('verify')}>Verify</Button>
            <Button variant="ghost" onClick={() => onNavigate('login')}>Login</Button>
            <Button className="bg-green-700 hover:bg-green-800" onClick={() => onNavigate('register')}>Register Now</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-green-50/50 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold uppercase tracking-wider">
              <Award size={16} />
              Official Registration Portal
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 leading-tight">
              Digital <span className="text-green-700">Indigene</span> Certification System
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              A secure, transparent, and efficient way for citizens to register for indigenship and receive verified digital certificates.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-green-700 hover:bg-green-800 text-lg h-14 px-8" onClick={() => onNavigate('register')}>
                Start Registration
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8" onClick={() => onNavigate('verify')}>
                Verify Certificate
              </Button>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square bg-green-800 rounded-3xl rotate-3 absolute inset-0 -z-10 opacity-10" />
            <div className="bg-white p-4 rounded-3xl shadow-2xl border border-gray-100">
              <img 
                src="https://picsum.photos/seed/nigeria/800/800" 
                alt="Nigeria" 
                className="rounded-2xl w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How it Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Three simple steps to get your verified digital indigene certificate.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <UserPlus />, title: "Register", desc: "Fill out the application form with your details and supporting documents." },
              { icon: <FileText />, title: "Review", desc: "Admin reviews your application for authenticity and compliance." },
              { icon: <CheckCircle />, title: "Download", desc: "Once approved, download your secure digital certificate with QR code." }
            ].map((step, i) => (
              <Card key={i} className="border-none shadow-lg bg-slate-50">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Section CTA */}
      <section className="py-20 bg-green-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-800 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold">Administrative Access</h2>
          <p className="text-green-100 max-w-xl mx-auto text-lg">
            Authorized personnel can log in to the admin portal to review applications and issue certificates.
          </p>
          <Button 
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-green-900 text-lg h-12 px-8"
            onClick={() => onNavigate('admin-login')}
          >
            Admin Portal
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-green-800 font-bold text-xl">
            <ShieldCheck size={24} />
            <span>Indigene System</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Federal Republic of Nigeria. All rights reserved.</p>
          <div className="flex gap-6 text-gray-400">
            <a href="#" className="hover:text-green-700">Privacy Policy</a>
            <a href="#" className="hover:text-green-700">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Application } from '../types';
import { format } from 'date-fns';
import { ShieldCheck, Award } from 'lucide-react';

interface CertificateProps {
  application: Application;
  id?: string;
}

export const Certificate: React.FC<CertificateProps> = ({ application, id = 'certificate-content' }) => {
  const issueDate = application.issueDate?.toDate ? application.issueDate.toDate() : new Date();
  
  return (
    <div 
      id={id}
      className="w-[800px] h-[1131px] bg-white p-12 relative overflow-hidden border-[16px] border-green-800"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap justify-center items-center gap-20 rotate-12 scale-150">
        {Array.from({ length: 20 }).map((_, i) => (
          <ShieldCheck key={i} size={120} className="text-green-900" />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 bg-green-800 rounded-full flex items-center justify-center text-white">
            <Award size={48} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-green-900 uppercase tracking-widest">
          Federal Republic of Nigeria
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 uppercase">
          Certificate of Indigenship
        </h2>
        <div className="h-1 w-32 bg-green-800 mx-auto rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 mt-16 space-y-12 text-center">
        <div className="space-y-2">
          <p className="text-lg text-gray-600 italic">This is to certify that</p>
          <h3 className="text-5xl font-bold text-gray-900 font-serif">
            {application.fullName}
          </h3>
        </div>

        <div className="flex justify-center gap-12 items-center">
          <div className="w-40 h-48 border-4 border-green-800 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={application.passportUrl} 
              alt="Passport" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">State of Origin</p>
              <p className="text-xl font-semibold text-gray-800">{application.state} State</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Local Government Area</p>
              <p className="text-xl font-semibold text-gray-800">{application.lga}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Ward</p>
              <p className="text-xl font-semibold text-gray-800">{application.ward}</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-gray-700 leading-relaxed text-lg">
          Has been duly registered and verified as an indigene of the aforementioned State and Local Government Area in accordance with the statutory requirements of the Federal Republic of Nigeria.
        </div>

        <div className="grid grid-cols-3 gap-8 pt-12">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Registration ID</p>
            <p className="font-mono text-lg font-bold">{application.id}</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Certificate ID</p>
            <p className="font-mono text-lg font-bold text-green-800">{application.certificateId}</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Issue Date</p>
            <p className="font-mono text-lg font-bold">{format(issueDate, 'PPP')}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-16 left-12 right-12 flex justify-between items-end">
        <div className="space-y-4">
          <div className="w-48 h-20 border-b-2 border-gray-400 flex items-end justify-center pb-2">
            <span className="font-serif italic text-gray-400">Official Stamp & Signature</span>
          </div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Authorized Registrar</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="p-2 bg-white border-2 border-green-800 rounded-lg">
            <QRCodeSVG 
              value={`${window.location.origin}/verify?id=${application.certificateId || application.id}`} 
              size={100}
            />
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-bold">Scan to Verify</p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-green-800 m-8" />
      <div className="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 border-green-800 m-8" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 border-green-800 m-8" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-green-800 m-8" />
    </div>
  );
};

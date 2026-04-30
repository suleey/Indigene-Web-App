import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload, User, MapPin, Phone, Mail, Fingerprint, Camera, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { STATES_AND_LGAS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  state: z.string().min(1, "State is required"),
  lga: z.string().min(1, "LGA is required"),
  ward: z.string().min(1, "Ward is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  phone: z.string().regex(/^[0-9+]{11,14}$/, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  nin: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess: (regId: string) => void;
  onNavigate: (page: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onNavigate }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [passport, setPassport] = useState<File | null>(null);
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: "male",
    }
  });

  const nextStep = async () => {
    console.log(`Validating step ${step}...`);
    let fields: (keyof RegisterFormValues)[] = [];
    if (step === 1) fields = ["fullName", "dob", "gender"];
    if (step === 2) fields = ["state", "lga", "ward", "phone", "email", "address"];
    
    const isValid = await trigger(fields);
    console.log(`Step ${step} validation result:`, isValid);
    if (!isValid) {
      console.log("Validation errors:", errors);
    }
    if (isValid) setStep(step + 1);
  };

  const selectedState = watch("state");

  useEffect(() => {
    register("gender");
    register("state");
    register("lga");
  }, [register]);

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("Passport file selected:", file?.name);
    if (file) {
      setPassport(file);
      const reader = new FileReader();
      reader.onloadend = () => setPassportPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    console.log("onSubmit called with data:", data);
    toast.info("Processing your application...");
    
    if (!passport) {
      console.log("Passport missing");
      toast.error("Please upload a passport photograph");
      return;
    }
    if (!documents || documents.length === 0) {
      console.log("Documents missing");
      toast.error("Please upload supporting documents");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Submitting your application...");
    
    try {
      console.log("Creating auth user...");
      // 1. Generate Registration ID
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const regId = `IND-${year}-${random}`;

      // 2. Create Auth User
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        user = userCredential.user;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          throw new Error("This email is already registered. Please try logging in instead.");
        }
        throw authError;
      }

      console.log("User created:", user.uid);

      // 3. Store Application & Profile
      const passportUrl = passportPreview || ''; 
      const documentsUrl = ['']; 

      // Destructure to remove password and other sensitive/unneeded fields from Firestore data
      const { password: _, ...firestoreData } = data;

      const applicationData = {
        ...firestoreData,
        id: regId,
        userId: user.uid,
        status: 'pending',
        passportUrl,
        documentsUrl,
        createdAt: serverTimestamp(),
      };

      console.log("Saving application data:", applicationData);

      try {
        await Promise.all([
          setDoc(doc(db, "applications", regId), applicationData),
          setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            registrationId: regId,
            email: data.email,
            role: 'applicant',
          }),
          setDoc(doc(db, "registration_lookup", regId), {
            uid: user.uid,
            email: data.email
          })
        ]);
      } catch (fsError) {
        handleFirestoreError(fsError, OperationType.WRITE, `applications/${regId}`);
      }

      console.log("Submission successful!");
      toast.success("Application submitted successfully!", { id: toastId });
      onSuccess(regId);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Registration failed. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Applicant Registration</h1>
          <p className="text-gray-600">Please provide accurate information for indigenship verification.</p>
        </div>

        <Card className="shadow-2xl border-none">
          <CardHeader className="bg-green-700 text-white rounded-t-xl">
            <div className="flex justify-between items-center">
              <CardTitle>Step {step} of 3</CardTitle>
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-2 w-8 rounded-full transition-all ${s <= step ? 'bg-white' : 'bg-green-900/30'}`} 
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form 
              onSubmit={handleSubmit(onSubmit, (err) => {
                console.log("Validation Errors:", err);
                toast.error("Please check all fields. Some information is missing or invalid.");
              })} 
              className="space-y-8"
            >
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><User size={16} /> Full Name</Label>
                        <Input {...register("fullName")} placeholder="Surname First, Other Names" />
                        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">Date of Birth</Label>
                        <Input type="date" {...register("dob")} />
                        {errors.dob && <p className="text-red-500 text-xs">{errors.dob.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select onValueChange={(v) => setValue("gender", v as any)} defaultValue="male">
                          <SelectTrigger>
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Fingerprint size={16} /> NIN (Optional)</Label>
                        <Input {...register("nin")} placeholder="11-digit NIN" maxLength={11} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" onClick={nextStep} className="bg-green-700 hover:bg-green-800">
                        Next: Location Details
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><MapPin size={16} /> State of Origin</Label>
                        <Select onValueChange={(v: string) => { 
                          setValue("state", v, { shouldValidate: true }); 
                          setValue("lga", "", { shouldValidate: true }); 
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATES_AND_LGAS).map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Local Government Area</Label>
                        <Select onValueChange={(v: string) => setValue("lga", v, { shouldValidate: true })} disabled={!selectedState}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select LGA" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedState && STATES_AND_LGAS[selectedState].map(lga => (
                              <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.lga && <p className="text-red-500 text-xs">{errors.lga.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Ward</Label>
                        <Input {...register("ward")} placeholder="Enter Ward" />
                        {errors.ward && <p className="text-red-500 text-xs">{errors.ward.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Phone size={16} /> Phone Number</Label>
                        <Input {...register("phone")} placeholder="08012345678" />
                        {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="flex items-center gap-2"><Mail size={16} /> Email Address</Label>
                        <Input {...register("email")} type="email" placeholder="example@mail.com" />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Residential Address</Label>
                        <Input {...register("address")} placeholder="Full Street Address" />
                        {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                      <Button type="button" onClick={nextStep} className="bg-green-700 hover:bg-green-800">
                        Next: Uploads & Security
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2"><Camera size={16} /> Passport Photograph</Label>
                        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                          {passportPreview ? (
                            <img src={passportPreview} className="w-32 h-32 object-cover rounded-lg shadow-md" alt="Preview" />
                          ) : (
                            <Upload size={48} className="text-gray-400" />
                          )}
                          <p className="text-sm text-gray-500 text-center">Click to upload passport (JPG/PNG)</p>
                          <input type="file" accept="image/*" onChange={handlePassportChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="flex items-center gap-2"><FileText size={16} /> Supporting Documents</Label>
                        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                          <Upload size={48} className="text-gray-400" />
                          <p className="text-sm text-gray-500 text-center">
                            {documents ? `${documents.length} files selected` : "Upload Birth Cert, LGA Letter, etc. (PDF/Images)"}
                          </p>
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*,application/pdf" 
                            onChange={(e) => {
                              console.log("Documents selected:", e.target.files?.length);
                              setDocuments(e.target.files);
                            }} 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Create Password</Label>
                        <Input type="password" {...register("password")} placeholder="At least 6 characters" />
                        {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                      <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800 px-12">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Submit Application"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const SuccessScreen: React.FC<{ regId: string, onNavigate: (page: string) => void }> = ({ regId, onNavigate }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full"
      >
        <Card className="text-center p-8 shadow-2xl border-t-8 border-t-green-600">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-8">Your application has been submitted for review.</p>
          
          <div className="bg-slate-100 p-6 rounded-xl mb-8 space-y-2">
            <p className="text-xs uppercase font-bold text-gray-500 tracking-widest">Your Registration ID</p>
            <p className="text-3xl font-mono font-bold text-green-800 tracking-tighter">{regId}</p>
            <p className="text-xs text-gray-400">Save this ID. You will use it to log in.</p>
          </div>

          <div className="space-y-4">
            <Button className="w-full bg-green-700 hover:bg-green-800 h-12 text-lg" onClick={() => onNavigate('login')}>
              Go to Login
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => onNavigate('landing')}>
              Back to Home
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

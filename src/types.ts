export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Application {
  id: string; // Registration ID: IND-YYYY-XXXX
  userId: string;
  fullName: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  state: string;
  lga: string;
  ward: string;
  address: string;
  phone: string;
  email: string;
  nin?: string;
  passportUrl: string;
  documentsUrl: string[];
  status: ApplicationStatus;
  remarks?: string;
  certificateId?: string; // CERT-YYYY-XXXX
  issueDate?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
}

export interface UserProfile {
  uid: string;
  registrationId: string;
  email: string;
  role: 'applicant' | 'admin';
}

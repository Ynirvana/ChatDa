import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      approvalStatus?: 'pending' | 'approved' | 'rejected';
      onboardingComplete?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    onboardingComplete?: boolean;
  }
}

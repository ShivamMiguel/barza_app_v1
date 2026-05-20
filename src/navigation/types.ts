export type AuthStackParamList = {
  Login: undefined
  Signup: undefined
  Otp: { email: string; redirectTo?: string }
  ForgotPassword: undefined
}

export type OnboardingStackParamList = {
  OnboardingProfile: undefined
  OnboardingIntent: undefined
  OnboardingLocation: undefined
  OnboardingStart: undefined
  OnboardingWelcome: undefined
}

export type MainStackParamList = {
  Community: undefined
  SpaceDetail: { spaceId: string }
}

export type CommunityTab = 'feed' | 'insights' | 'notifications' | 'profile'

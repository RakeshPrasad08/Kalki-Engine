
export interface ToneVariant {
  tone: 'Humorous' | 'Sarcastic' | 'Professional' | 'Soft' | 'Bold' | 'Political' | 'Direct';
  contentEnglish: string;
  contentIndic: string;
  indicLanguage: string;
}

export interface PostSuggestion {
  id: string;
  platform: 'Facebook' | 'X' | 'LinkedIn' | 'Instagram';
  content: string;
  rationale: string;
  suggestedHashtags: string[];
  tone: string;
  toneVariants?: ToneVariant[];
  visualPrompt?: string; 
  videoPrompt?: string;
  videoUri?: string;
  dataGraphic?: {
    type: 'bar' | 'pie' | 'line';
    labels: string[];
    values: number[];
    title: string;
    description?: string;
  };
  festivalInfo?: {
    name: string;
    isGreeting: boolean;
    overlayText: string;
  };
  scheduledAt?: string; 
  engagementLevel?: 'High' | 'Medium' | 'Low';
  platformTips?: string[]; 
}

export interface TrendingTopic {
  title: string;
  context: string;
  hashtags: string[];
  volume: string;
}

export interface GenreTrends {
  entertainment: TrendingTopic[];
  sports: TrendingTopic[];
  politics: TrendingTopic[];
  economics: TrendingTopic[];
  tech: TrendingTopic[];
  lifestyle: TrendingTopic[];
}

export interface RegionalTrends {
  city: TrendingTopic[];
  state: TrendingTopic[];
  national: TrendingTopic[];
  global: TrendingTopic[];
  genres: GenreTrends;
}

export interface AnalyticsData {
  predictedReach: number;
  engagementScore: number;
  toneDistribution: { label: string; value: number }[];
  platformEfficiency: { platform: string; score: number }[];
}

export interface ActivitySummary {
  recentInterests: string[];
  topAccountsInfluencing: string[];
  overallVibe: string;
  summaryText: string;
}

export interface UserBrand {
  name: string;
  description: string;
  location?: {
    city: string;
    state: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  pastPosts: string[];
  recentActivityFeed?: string;
  activitySummary?: ActivitySummary;
  visualStyles: string[]; 
  profileImages: string[]; 
  primaryPlatform: 'Facebook' | 'X' | 'LinkedIn' | 'Instagram';
  socialLinks?: {
    Facebook?: string;
    X?: string;
    LinkedIn?: string;
    Instagram?: string;
  };
}

export interface AnalysisResult {
  voiceDescription: string;
  commonThemes: string[];
  styleKeywords: string[];
}

export interface StrategicBriefing {
  overview: string;
  keyGoals: string[];
  trendingContext: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

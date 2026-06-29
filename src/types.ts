export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  xp: number;
  citizenLevel: number;
  badges: string[]; // List of badge IDs
  contributionsCount: number;
  impactScore: number;
  createdAt: string;
}

export type IssueCategory =
  | "Roads/Potholes"
  | "Streetlights"
  | "Water/Sanitation"
  | "Trash/Litter"
  | "Graffiti"
  | "Other";

export type IssueSeverity = "Low" | "Medium" | "High" | "Critical";

export type IssueStatus = "Reported" | "Verifying" | "Verified" | "In Progress" | "Resolved";

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  address: string;
  reporterId: string;
  reporterName: string;
  reportedAt: string;
  verificationsCount: number;
  upvotes: number;
  aiConfidence?: number;
  aiSummary?: string;
  responsibleDept?: string;
  contactDetails?: {
    phone: string;
    email: string;
    office: string;
    website: string;
  };
  communityImpactScore?: number;
  aqi?: number;
  // Agentic AI fields
  publicImpact?: string;
  complaintText?: string;
  precautions?: string[];
  futureConsequences?: string[];
  nextCitizenAction?: string;
  authorityReason?: string;
  estimatedUrgency?: string;
  estimatedImpactRadius?: string;
  estimatedAffectedCitizens?: number;
  priorityScore?: number;
  priorityReason?: string;
  // Community verification fields
  verificationsYesCount?: number;
  verificationsNoCount?: number;
  verifiedUserIds?: string[];
  lastConfirmationTime?: string;
}

export interface Verification {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  verifiedAt: string;
  status: "Confirming" | "Resolved-Confirming";
  comment?: string;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  text: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
}

export interface CommunityMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  targetCount: number;
  currentCount: number;
  status: "Active" | "Completed";
}

export interface DisasterForecast {
  id: string;
  title: string;
  category: "Flood Risk" | "Road Collapse Risk" | "Waterlogging Risk" | "Drainage Failure Risk" | "Infrastructure Failure Risk" | "Electrical Hazard Risk";
  riskLevel: "High" | "Medium" | "Low";
  confidence: "High" | "Medium" | "Low";
  area: string;
  latitude: number;
  longitude: number;
  contributingReports: number;
  reasoning: string;
  recommendedAction: string;
  estimatedImpact: number;
  recommendedIntervention: string;
}

export interface PreventionMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  pointsReward: number;
  targetCount: number;
  currentCount: number;
  status: "Active" | "Completed";
  badgeReward?: string;
  area: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  locality: string;
  district?: string;
  pincode?: string;
  country?: string;
  source: "gps" | "manual";
}

export type ViewType =
  | "landing"
  | "onboarding"
  | "auth"
  | "dashboard"
  | "report"
  | "map"
  | "profile"
  | "forecaster"
  | "civic_connect"
  | "ask_civiceye";

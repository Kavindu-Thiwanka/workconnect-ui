// User & Authentication Models
export interface User {
  id: number;
  email: string;
  role: 'WORKER' | 'EMPLOYER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

// Profile Models
export interface WorkerProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  availability?: string;
  profilePictureUrl?: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerProfile {
  id: number;
  userId: number;
  companyName: string;
  companyDescription?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  location?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Job Models - Updated to match backend DTOs
export interface JobDetail {
  id: number;
  jobTitle: string;
  description: string;
  requiredSkills: string;
  location: string;
  salary?: number;
  jobType: 'ONE_DAY' | 'CONTRACT';
  employerCompanyName: string;
  postedAt: string;
  applicationCount?: number;

  // Fields specific to job types
  jobDate?: string; // For ONE_DAY jobs
  startDate?: string; // For CONTRACT jobs
  endDate?: string; // For CONTRACT jobs

  imageUrls?: string[];
}

export interface JobListing {
  id: number;
  jobTitle: string;
  description: string;
  location: string;
  salary?: number;
  jobType: 'ONE_DAY' | 'CONTRACT';
  requiredSkills: string;
  status: 'OPEN' | 'CLOSED' | 'FILLED' | 'EXPIRED';
  employerCompanyName: string;
  postedAt: string;
  applicationCount?: number;
  viewCount?: number;
  startDate?: string;
  endDate?: string;
  jobDate?: string;
}

// Legacy Job interface for backward compatibility
export interface Job {
  id: number;
  jobTitle: string;
  description: string;
  location: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  salary?: number;
  currency?: string;
  skills?: string[];
  benefits?: string[];
  isRemote: boolean;
  applicationDeadline?: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  employerId: number;
  employerProfile?: EmployerProfile;
  applicationCount?: number;
  createdAt: string;
  updatedAt: string;
  employerCompanyName: string;
}

export interface JobApplication {
  id: number;
  jobId: number;
  workerId: number;
  status: 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'INTERVIEWED' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'COMPLETED';
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: string;
  updatedAt: string;
  job?: Job;
  worker?: WorkerProfile;
}

export interface ApplicationStatusResponse {
  hasApplied: boolean;
  status?: 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'INTERVIEWED' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'COMPLETED';
  appliedAt?: string;
}

// Dashboard Models
export interface WorkerDashboardStats {
  totalApplications: number;
  pendingApplications: number;
  interviewsScheduled: number;
  profileViews: number;
  profileCompletionPercentage: number;
  recentApplications: JobApplication[];
  recommendedJobs: Job[];
  profileCompletionTips: string[];
}

export interface EmployerDashboardStats {
  activeJobs: number;
  totalApplications: number;
  newApplicationsThisWeek: number;
  totalViews: number;
  recentApplications: JobApplication[];
  activeJobPostings: Job[];
}

// Search & Pagination Models
export interface JobSearchFilters {
  keyword?: string;
  location?: string;
  jobType?: string[];
  experienceLevel?: string[];
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  skills?: string[];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface JobSearchResponse {
  content: Job[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Request Models
export interface JobCreateRequest {
  title: string;
  description: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary?: number;
  currency?: string;
  skills?: string[];
  benefits?: string[];
  isRemote: boolean;
  applicationDeadline?: string;
}

export interface JobApplicationRequest {
  jobId: number;
  coverLetter?: string;
  resumeUrl?: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
}

export interface EmployerProfileUpdateRequest {
  companyName?: string;
  companyDescription?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  location?: string;
}

// Payment Models
export interface PaymentMethod {
  id: number;
  type: string;
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentTransaction {
  id: number;
  amount: number;
  currency: string;
  status: string;
  description: string;
  paymentMethodId?: number;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
}

export interface UserSubscription {
  id: number;
  planId: number;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan?: SubscriptionPlan;
}

// Admin Portal Models
export interface AdminUser {
  userId: number;
  email: string;
  role: 'WORKER' | 'EMPLOYER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  profileType: string;
  displayName: string;
  location?: string;
  phoneNumber?: string;
  companyName?: string;
  createdAt?: string;
  lastLoginAt?: string;
  totalApplications: number;
  totalJobPostings: number;
  averageRating?: number;
}

export interface AdminJob {
  id: number;
  jobTitle: string;
  description: string;
  requiredSkills: string;
  location: string;
  salary?: number;
  jobType: 'ONE_DAY' | 'CONTRACT';
  status: 'OPEN' | 'CLOSED' | 'FILLED' | 'EXPIRED';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  employerEmail: string;
  employerCompanyName: string;
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
}

export interface AdminApplication {
  id: number;
  jobId: number;
  jobTitle: string;
  employerEmail: string;
  employerCompanyName: string;
  workerId: number;
  workerEmail: string;
  workerName: string;
  status: 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  appliedAt: string;
  statusUpdatedAt?: string;
  coverLetter?: string;
  resumeUrl?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalWorkers: number;
  totalEmployers: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
  bannedUsers: number;
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  filledJobs: number;
  expiredJobs: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  newUsersThisWeek: number;
  newJobsThisWeek: number;
  newApplicationsThisWeek: number;
  averageJobsPerEmployer: number;
  averageApplicationsPerJob: number;
  averageApplicationsPerWorker: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

// Recommendation Models
export interface JobRecommendation {
  recommendations: Job[];
  totalCount: number;
  recommendationReason: string;
  isAiPowered?: boolean;
  aiServiceUsed?: boolean;
}

export interface RecommendationResponse {
  recommendations: Job[];
  totalCount: number;
  recommendationReason: string;
  isAiPowered?: boolean;
  fallbackUsed?: boolean;
}

// Notification Models
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

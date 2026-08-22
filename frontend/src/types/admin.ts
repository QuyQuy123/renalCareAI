export type AdminActivityItem = {
  id: string
  type: string
  title: string
  description: string
  userEmail: string
  riskLevel: string
  timestamp: string
}

export type AdminDashboardStats = {
  uniqueVisitors: number
  totalPageviews: number
  totalChatResponses: number
  totalMedicalRecords: number
  totalUsers: number
  riskDistribution: {
    HIGH?: number
    MODERATE?: number
    LOW?: number
    NONE?: number
    [key: string]: number | undefined
  }
  recentActivities: AdminActivityItem[]
}

export type AdminUserListItem = {
  id: number
  fullName: string
  email: string
  phoneNumber?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  address?: string | null
  healthNote?: string | null
  role: 'CUSTOMER' | 'ADMIN'
  status: 'ACTIVE' | 'LOCKED'
  medicalRecordCount: number
  primaryRiskLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE' | string
  highestRiskScore?: number | null
  createdAt: string
  lastActiveAt?: string | null
}

export type AdminMedicalRecordItem = {
  id: number
  originalFileName: string
  contentType?: string | null
  fileSize: number
  status: 'UPLOADED' | 'PENDING_ANALYSIS' | 'ANALYZED' | 'FAILED'
  riskSummary?: string | null
  extractedDataJson?: string | null
  predictionResultJson?: string | null
  uploadedAt: string
}

export type AdminChatLogItem = {
  id: number
  userId?: number | null
  userEmail: string
  userName: string
  userMessage: string
  assistantAnswer: string
  sourcesJson?: string | null
  riskAssessment?: string | null
  createdAt: string
}

export type AdminChatLogPage = {
  items: AdminChatLogItem[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export type AdminUserDetail = {
  id: number
  fullName: string
  email: string
  phoneNumber?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  address?: string | null
  healthNote?: string | null
  role: 'CUSTOMER' | 'ADMIN'
  status: 'ACTIVE' | 'LOCKED'
  createdAt: string
  updatedAt: string
  aggregateRiskLevel: string
  aggregateRiskScore: number
  aggregateSummary: string
  latestClinicalIndicators: Record<string, number>
  clinicalFindings: string[]
  recommendations: string[]
  medicalRecords: AdminMedicalRecordItem[]
  chatLogs?: AdminChatLogItem[]
}

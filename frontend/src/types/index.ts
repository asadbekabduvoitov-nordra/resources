// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Resource types
export type MediaType = 'image' | 'video' | 'audio' | 'file' | 'none';

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  media_type: MediaType;
  media_url: string | null;
  telegram_file_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceInput {
  title: string;
  description?: string;
  media_type?: MediaType;
  media_url?: string;
  telegram_file_id?: string;
}

export interface UpdateResourceInput {
  title?: string;
  description?: string;
  media_type?: MediaType;
  media_url?: string;
  telegram_file_id?: string;
  is_active?: boolean;
}

// User types
export interface User {
  id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
  is_blocked: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
}

// Broadcast types
export type BroadcastStatus = 'pending' | 'sending' | 'completed' | 'failed';

export interface Broadcast {
  id: string;
  message_text: string | null;
  media_type: MediaType;
  media_url: string | null;
  total_users: number;
  sent_count: number;
  failed_count: number;
  status: BroadcastStatus;
  created_at: string;
  completed_at: string | null;
}

export interface CreateBroadcastInput {
  message_text?: string;
  media_type: MediaType;
  media_url?: string;
}

// Upload types
export interface UploadResult {
  url: string;
  path: string;
  media_type: MediaType;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// User pagination types
export type UserStatus = 'all' | 'active' | 'blocked' | 'inactive';
export type UserSortBy = 'created_at' | 'last_active_at' | 'first_name';
export type SortOrder = 'asc' | 'desc';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  sortBy?: UserSortBy;
  sortOrder?: SortOrder;
}

export interface UserPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  blocked: number;
  inactive: number;
}

export interface PaginatedUsersResponse {
  users: User[];
  pagination: UserPagination;
  stats: UserStats;
}

// Stats types
export * from './stats';

export type ApiResponse<T> = {
  log_id?: string;
  code?: number;
  status: boolean;
  message: string;
  data?: T;
  error?: unknown;
};

export type PaginatedApiResponse<T> = {
  log_id?: string;
  code?: number;
  status: boolean;
  message: string;
  total_data: number;
  total_pages: number;
  current_page: number;
  next_page: boolean;
  prev_page: boolean;
  limit: number;
  data?: T;
  error?: unknown;
};

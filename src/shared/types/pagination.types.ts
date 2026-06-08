export interface IPaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

export interface IPaginatedResult<T> {
  items: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

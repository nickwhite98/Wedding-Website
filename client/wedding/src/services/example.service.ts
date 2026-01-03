import { apiService } from './api.service';

interface ExampleItem {
  id: number;
  name: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class ExampleService {
  async getAll(): Promise<ApiResponse<ExampleItem[]>> {
    return apiService.get<ApiResponse<ExampleItem[]>>('/example');
  }

  async getById(id: number): Promise<ApiResponse<ExampleItem>> {
    return apiService.get<ApiResponse<ExampleItem>>(`/example/${id}`);
  }

  async create(name: string): Promise<ApiResponse<ExampleItem>> {
    return apiService.post<ApiResponse<ExampleItem>>('/example', { name });
  }

  async delete(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<ApiResponse<{ message: string }>>(`/example/${id}`);
  }
}

export const exampleService = new ExampleService();

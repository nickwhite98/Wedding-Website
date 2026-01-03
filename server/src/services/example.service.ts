import { ExampleData, CreateExampleDTO } from '../types';

class ExampleService {
  private data: ExampleData[] = [{ id: 1, name: 'name1' }];

  async getAll(): Promise<ExampleData[]> {
    return this.data;
  }

  async getById(id: number): Promise<ExampleData | undefined> {
    return this.data.find((item) => item.id === id);
  }

  async create(dto: CreateExampleDTO): Promise<ExampleData> {
    const newItem: ExampleData = {
      id: Date.now(),
      name: dto.name,
    };

    this.data.push(newItem);
    return newItem;
  }

  async delete(id: number): Promise<boolean> {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.data.splice(index, 1);
    return true;
  }
}

export const exampleService = new ExampleService();

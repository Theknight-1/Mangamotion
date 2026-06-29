export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  createdAt: string; 
  updatedAt: string; 
}
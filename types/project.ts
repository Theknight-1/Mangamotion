export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  language: string;
  isOriginalContent: boolean;
  contentPurpose?: string | null;
  copyrightAgreedAt?: string | null;
  createdAt: string; 
  updatedAt: string; 
}

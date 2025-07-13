import { User } from './user.model';
import { JobApplication } from './job-application.model';

export interface Job {
  id: string; // UUID
  title: string;
  description: string;
  location: string;
  salary: string;
  requiredSkills: string;
  postedBy: User;
  createdAt: Date;
  updatedAt: Date;
  jobApplications?: JobApplication[];
}

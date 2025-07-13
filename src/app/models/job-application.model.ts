import { Job } from './job.model';
import { User } from './user.model';

export interface JobApplication {
  id: string;
  job: Job;
  applicant: User;
  appliedAt: Date;
  status: string;
}

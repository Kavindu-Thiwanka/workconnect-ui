import { User } from './user.model';
import { Job } from './job.model';

export interface Review {
  id: string;
  job: Job;
  reviewer: User;
  reviewee: User;
  rating: number;
  comment: string;
  createdAt: Date;
}

import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import {ProfileComponent} from './pages/profile/profile.component';
import {JobListComponent} from './pages/job-list/job-list.component';
import {JobDetailComponent} from './pages/job-detail/job-detail.component';
import {PostJobComponent} from './pages/post-job/post-job.component';
import {JobApplicationsComponent} from './pages/employer/job-applications/job-applications.component';
import {MyJobsComponent} from './pages/employer/my-jobs/my-jobs.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'jobs', component: JobListComponent },
      { path: 'jobs/:jobId', component: JobDetailComponent },
      { path: 'jobs/new', component: PostJobComponent },
      { path: 'employer/jobs', component: MyJobsComponent },
      { path: 'employer/jobs/:jobId/applications', component: JobApplicationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';
import { rootRedirectGuard } from './guards/root-redirect.guard';
import {ProfileComponent} from './pages/profile/profile.component';
import {JobListComponent} from './pages/job-list/job-list.component';
import {JobDetailComponent} from './pages/job-detail/job-detail.component';
import {PostJobComponent} from './pages/post-job/post-job.component';
import {JobApplicationsComponent} from './pages/employer/job-applications/job-applications.component';
import {MyJobsComponent} from './pages/employer/my-jobs/my-jobs.component';
import {MyApplicationsComponent} from './pages/worker/my-applications/my-applications.component';
import {PublicProfileComponent} from './pages/public-profile/public-profile.component';

export const routes: Routes = [
  // Root route with authentication-based redirection
  {
    path: '',
    component: HomeComponent,
    canActivate: [rootRedirectGuard]
  },

  // Public routes (only accessible to unauthenticated users)
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicGuard]
  },

  // Public profile (accessible to all users)
  {
    path: 'users/:userId/profile',
    component: PublicProfileComponent
  },

  // Protected application routes
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'jobs', component: JobListComponent },
      { path: 'jobs/new', component: PostJobComponent },
      { path: 'jobs/:jobId', component: JobDetailComponent },
      { path: 'employer/jobs', component: MyJobsComponent },
      { path: 'employer/jobs/:jobId/applications', component: JobApplicationsComponent },
      { path: 'my-applications', component: MyApplicationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Fallback route
  { path: '**', redirectTo: '' }
];

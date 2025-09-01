import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { publicGuard } from './guards/public.guard';
import { rootRedirectGuard } from './guards/root-redirect.guard';
import {ProfileComponent} from './pages/profile/profile.component';
import {JobListComponent} from './pages/job-list/job-list.component';
import {JobDetailComponent} from './pages/job-detail/job-detail.component';
import {PostJobComponent} from './pages/post-job/post-job.component';
import {EditJobComponent} from './pages/edit-job/edit-job.component';
import {JobApplicationsComponent} from './pages/employer/job-applications/job-applications.component';
import {MyJobsComponent} from './pages/employer/my-jobs/my-jobs.component';
import {MyApplicationsComponent} from './pages/worker/my-applications/my-applications.component';
import {PublicProfileComponent} from './pages/public-profile/public-profile.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './pages/admin/user-management/user-management.component';
import { JobManagementComponent } from './pages/admin/job-management/job-management.component';
import { ApplicationManagementComponent } from './pages/admin/application-management/application-management.component';

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
      // Admin routes (requires both authGuard from parent AND adminGuard)
      // Guard execution order: authGuard (parent) → adminGuard (child)
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: 'dashboard', component: AdminDashboardComponent },
          { path: 'users', component: UserManagementComponent },
          { path: 'jobs', component: JobManagementComponent },
          { path: 'applications', component: ApplicationManagementComponent },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      },
      // Regular user routes (accessible to all authenticated users)
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'jobs', component: JobListComponent },
      { path: 'jobs/new', component: PostJobComponent },
      { path: 'jobs/:jobId', component: JobDetailComponent },
      { path: 'jobs/:jobId/edit', component: EditJobComponent },
      { path: 'employer/jobs', component: MyJobsComponent },
      { path: 'employer/jobs/:jobId/applications', component: JobApplicationsComponent },
      { path: 'my-applications', component: MyApplicationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Fallback route
  { path: '**', redirectTo: '' }
];

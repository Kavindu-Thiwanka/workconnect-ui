import { Routes } from '@angular/router';

// Import all components
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { JobListComponent } from './pages/job-list/job-list.component';
import { JobPostComponent } from './pages/job-post/job-post.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { JobDetailComponent } from './pages/job-detail/job-detail.component'; // <-- Import the new component
import { authGuard } from './guards/auth.guard';
import {EmployerDashboardComponent} from './pages/employer-dashboard/employer-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'jobs', component: JobListComponent },
  { path: 'job/:id', component: JobDetailComponent },
  {
    path: 'post-job',
    component: JobPostComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: EmployerDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  { path: '**', component: NotFoundComponent }
];

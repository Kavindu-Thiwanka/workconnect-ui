import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { JobDetailComponent } from './job-detail.component';
import { JobService } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { JobDetail, ApplicationStatusResponse } from '../../models/api-models';

describe('JobDetailComponent', () => {
  let component: JobDetailComponent;
  let fixture: ComponentFixture<JobDetailComponent>;
  let mockJobService: jasmine.SpyObj<JobService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockActivatedRoute: any;

  const mockJobDetail: JobDetail = {
    id: 1,
    jobTitle: 'Test Job',
    description: 'Test job description',
    requiredSkills: 'JavaScript, Angular, TypeScript',
    location: 'New York, NY',
    salary: 75000,
    jobType: 'CONTRACT',
    employerCompanyName: 'Test Company',
    postedAt: '2024-01-15T10:00:00Z',
    applicationCount: 5,
    startDate: '2024-02-01',
    endDate: '2024-06-01',
    imageUrls: ['https://example.com/image1.jpg']
  };

  const mockApplicationStatus: ApplicationStatusResponse = {
    hasApplied: false
  };

  beforeEach(async () => {
    const jobServiceSpy = jasmine.createSpyObj('JobService', [
      'getJobById',
      'checkApplicationStatus',
      'applyForJob'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [JobDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: JobService, useValue: jobServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JobDetailComponent);
    component = fixture.componentInstance;

    mockJobService = TestBed.inject(JobService) as jasmine.SpyObj<JobService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    // Setup default mock returns
    mockJobService.getJobById.and.returnValue(of(mockJobDetail));
    mockJobService.checkApplicationStatus.and.returnValue(of(mockApplicationStatus));
    mockAuthService.getRole.and.returnValue('WORKER');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load job details on init', () => {
    fixture.detectChanges();

    expect(mockJobService.getJobById).toHaveBeenCalledWith('1');
    expect(component.job()).toEqual(mockJobDetail);
    expect(component.isLoading()).toBeFalse();
  });

  it('should check application status for workers', () => {
    mockAuthService.getRole.and.returnValue('WORKER');
    fixture.detectChanges();

    expect(mockJobService.checkApplicationStatus).toHaveBeenCalledWith('1');
    expect(component.applicationStatus()).toEqual(mockApplicationStatus);
  });

  it('should not check application status for employers', () => {
    mockAuthService.getRole.and.returnValue('EMPLOYER');
    fixture.detectChanges();

    expect(mockJobService.checkApplicationStatus).not.toHaveBeenCalled();
  });

  it('should handle job loading error', () => {
    mockJobService.getJobById.and.returnValue(throwError(() => new Error('Job not found')));
    fixture.detectChanges();

    expect(component.error()).toBeTruthy();
    expect(component.isLoading()).toBeFalse();
  });

  it('should apply for job successfully', () => {
    mockJobService.applyForJob.and.returnValue(of('Application submitted'));
    fixture.detectChanges();

    component.applyForJob();

    expect(mockJobService.applyForJob).toHaveBeenCalledWith('1');
    expect(component.hasApplied()).toBeTrue();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Application submitted successfully!',
      'Close',
      jasmine.any(Object)
    );
  });

  it('should handle job application error', () => {
    mockJobService.applyForJob.and.returnValue(throwError(() => new Error('Application failed')));
    fixture.detectChanges();

    component.applyForJob();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Application failed',
      'Close',
      jasmine.any(Object)
    );
  });

  it('should navigate back to jobs list', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/jobs']);
  });

  it('should format salary correctly', () => {
    fixture.detectChanges();
    expect(component.formattedSalary()).toBe('$75,000');
  });

  it('should parse skills correctly', () => {
    fixture.detectChanges();
    expect(component.skillsArray()).toEqual(['JavaScript', 'Angular', 'TypeScript']);
  });

  it('should determine if user can apply', () => {
    mockAuthService.getRole.and.returnValue('WORKER');
    fixture.detectChanges();

    expect(component.canApply()).toBeTrue();
  });

  it('should prevent application if already applied', () => {
    const appliedStatus: ApplicationStatusResponse = {
      hasApplied: true,
      status: 'PENDING',
      appliedAt: '2024-01-16T10:00:00Z'
    };
    mockJobService.checkApplicationStatus.and.returnValue(of(appliedStatus));
    fixture.detectChanges();

    expect(component.canApply()).toBeFalse();
    expect(component.hasApplied()).toBeTrue();
  });

  it('should display job type correctly', () => {
    expect(component.getJobTypeDisplayName('ONE_DAY')).toBe('One Day Job');
    expect(component.getJobTypeDisplayName('CONTRACT')).toBe('Contract Work');
  });

  it('should display application status correctly', () => {
    expect(component.getApplicationStatusDisplayName('PENDING')).toBe('Application Pending');
    expect(component.getApplicationStatusDisplayName('HIRED')).toBe('Hired');
  });
});

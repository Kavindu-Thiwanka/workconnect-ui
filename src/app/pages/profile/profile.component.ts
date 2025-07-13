import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userProfile: any = null;
  error: string | null = null;
  profileForm!: FormGroup; // Use the definite assignment assertion '!'

  constructor(private profileService: ProfileService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.profileService.getCurrentUserProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.initializeForm();
      },
      error: (err) => {
        console.error('Failed to fetch profile', err);
        this.error = 'Failed to load profile data. Please try again later.';
      }
    });
  }

  initializeForm(): void {
    if (this.userProfile?.userRole === 'WORKER') {
      this.profileForm = this.fb.group({
        headline: ['', Validators.required],
        skills: ['', Validators.required],
        experience: [''],
        availability: ['']
      });
    } else if (this.userProfile?.userRole === 'EMPLOYER') {
      this.profileForm = this.fb.group({
        companyName: ['', Validators.required],
        industry: [''],
        description: ['']
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.profileService.createProfile(this.profileForm.value).subscribe({
      next: (response) => {
        alert('Profile created successfully!');
        console.log(response);
      },
      error: (err) => {
        console.error('Profile creation failed', err);
        alert('Failed to create profile.');
      }
    });
  }
}

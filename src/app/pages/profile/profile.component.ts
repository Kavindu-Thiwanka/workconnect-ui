import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  userRole: string | null = null;
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      skills: [''],
      companyName: [''],
      companyDescription: [''],
      location: [''],
      availability: ['']
    });
  }

  ngOnInit(): void {
    this.userRole = this.authService.getRole();
    this.profileService.getProfile().subscribe(data => {
      this.profileForm.patchValue(data);
      this.currentImageUrl = data.profileImageUrl || data.companyLogoUrl;
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedFile = fileList[0];
    }
  }

  onPictureUpload(): void {
    if (!this.selectedFile) {
      return;
    }
    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (response) => {
        alert('Image uploaded successfully!');
        this.ngOnInit();
      },
      error: (err) => {
        console.error('Image upload failed', err);
        alert('Image upload failed.');
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    if (this.userRole === 'WORKER') {
      this.profileService.updateWorkerProfile(this.profileForm.value).subscribe(() => {
        alert('Profile updated successfully!');
      });
    } else if (this.userRole === 'EMPLOYER') {
      this.profileService.updateEmployerProfile(this.profileForm.value).subscribe(() => {
        alert('Profile updated successfully!');
      });
    }
  }
}

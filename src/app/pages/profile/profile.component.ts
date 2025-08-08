import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TitleCasePipe
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  userRole: string | null = null;
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;
  previewImageUrl: string | null = null;
  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      phoneNumber: [''],
      location: [''],
      bio: [''],
      experience: [''],
      education: [''],
      availability: [''],
      skills: [''],
      companyName: [''],
      companyDescription: ['']
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

    if (fileList && fileList.length > 0) {
      const file = fileList[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPG, PNG, GIF)');
        this.clearFileSelection();
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        this.clearFileSelection();
        return;
      }

      // Set the selected file
      this.selectedFile = file;

      // Generate preview URL
      this.generatePreviewUrl(file);
    } else {
      this.clearFileSelection();
    }
  }

  generatePreviewUrl(file: File): void {
    // Clean up previous preview URL to prevent memory leaks
    if (this.previewImageUrl) {
      URL.revokeObjectURL(this.previewImageUrl);
    }

    // Generate new preview URL
    this.previewImageUrl = URL.createObjectURL(file);
  }

  clearFileSelection(): void {
    this.selectedFile = null;

    // Clean up preview URL
    if (this.previewImageUrl) {
      URL.revokeObjectURL(this.previewImageUrl);
      this.previewImageUrl = null;
    }

    // Reset file input
    const fileInput = document.getElementById('picture') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onPictureUpload(): void {
    if (!this.selectedFile) {
      alert('Please select a file first');
      return;
    }

    this.isUploading = true;
    console.log('Starting upload for file:', this.selectedFile.name);

    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (response) => {
        console.log('Upload successful:', response);
        this.isUploading = false;
        this.currentImageUrl = response.imageUrl;

        // Clear file selection and preview
        this.clearFileSelection();

        alert('Profile picture uploaded successfully!');
      },
      error: (err) => {
        console.error('Image upload failed:', err);
        this.isUploading = false;

        let errorMessage = 'Image upload failed. ';
        if (err.status === 413) {
          errorMessage += 'File size too large.';
        } else if (err.status === 415) {
          errorMessage += 'Unsupported file type.';
        } else if (err.status === 401) {
          errorMessage += 'Please log in again.';
        } else if (err.error && err.error.message) {
          errorMessage += err.error.message;
        } else {
          errorMessage += 'Please try again.';
        }

        alert(errorMessage);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    if (this.userRole === 'WORKER') {
      const formData = { ...this.profileForm.value };

      // Convert skills string to array for backend
      if (formData.skills && typeof formData.skills === 'string') {
        formData.skills = formData.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill);
      }

      // Remove employer-specific fields
      delete formData.companyName;
      delete formData.companyDescription;

      this.profileService.updateWorkerProfile(formData).subscribe({
        next: () => {
          alert('Profile updated successfully!');
        },
        error: (error) => {
          console.error('Profile update failed:', error);
          alert('Profile update failed. Please try again.');
        }
      });
    } else if (this.userRole === 'EMPLOYER') {
      const formData = { ...this.profileForm.value };

      // Remove worker-specific fields
      delete formData.phoneNumber;
      delete formData.bio;
      delete formData.experience;
      delete formData.education;
      delete formData.availability;
      delete formData.skills;
      delete formData.firstName;
      delete formData.lastName;

      this.profileService.updateEmployerProfile(formData).subscribe({
        next: () => {
          alert('Profile updated successfully!');
        },
        error: (error) => {
          console.error('Profile update failed:', error);
          alert('Profile update failed. Please try again.');
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  getSkillsArray(): string[] {
    const skills = this.profileForm.get('skills')?.value;
    return skills ? skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill) : [];
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }



  ngOnDestroy(): void {
    // Clean up preview URL to prevent memory leaks
    if (this.previewImageUrl) {
      URL.revokeObjectURL(this.previewImageUrl);
    }
  }
}

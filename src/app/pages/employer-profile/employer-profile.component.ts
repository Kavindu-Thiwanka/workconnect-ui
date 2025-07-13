import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ReviewListComponent} from '../../components/review-list/review-list.component';

@Component({
  selector: 'app-employer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReviewListComponent],
  templateUrl: './employer-profile.component.html',
  styleUrl: './employer-profile.component.scss'
})
export class EmployerProfileComponent {
  company: any = {
    name: 'BuildRight Inc.',
    industry: 'Construction',
    logo: 'assets/company-logo.png',
    size: '51-200 employees',
    location: 'Colombo, Sri Lanka',
    website: 'https://buildright.com',
  };
  about: string = '';
  details: any = {
    industry: 'Construction',
    size: '51-200 employees',
    location: 'Colombo, Sri Lanka',
    website: 'https://buildright.com',
  };
  photos: string[] = [
    'assets/sample1.jpg',
    'assets/sample2.jpg'
  ];

  onPhotoSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photos.push(e.target.result);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  removePhoto(index: number) {
    this.photos.splice(index, 1);
  }

  saveProfile() {
    // Implement save logic or call API
    alert('Profile saved!');
  }
}

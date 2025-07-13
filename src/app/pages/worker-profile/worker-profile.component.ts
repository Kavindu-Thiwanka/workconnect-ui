import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ReviewListComponent} from '../../components/review-list/review-list.component';

@Component({
  selector: 'app-worker-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReviewListComponent],
  templateUrl: './worker-profile.component.html',
  styleUrl: './worker-profile.component.scss'
})
export class WorkerProfileComponent {
  userProfile: any = {
    firstName: 'Sophia',
    lastName: 'Carter',
    userRoleLabel: 'Construction Worker',
    avatar: 'assets/avatar-worker.png'
  };
  aboutMe: string = '';
  skills: string[] = ['Plumbing', 'Welding', 'Driving', 'Carpentry', 'Electrical'];
  newSkill: string = '';
  workExperience: any[] = [
    {
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    }
  ];
  photos: string[] = [
    'assets/sample1.jpg',
    'assets/sample2.jpg'
  ];

  addSkill() {
    const skill = this.newSkill.trim();
    if (skill && !this.skills.includes(skill)) {
      this.skills.push(skill);
    }
    this.newSkill = '';
  }

  removeSkill(index: number) {
    this.skills.splice(index, 1);
  }

  addExperience() {
    this.workExperience.push({
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    });
  }

  removeExperience(index: number) {
    this.workExperience.splice(index, 1);
  }

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

  saveProfile() {
    // Implement save logic or call API
    alert('Profile saved!');
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent {
  testimonials = [
    {
      quote: "WorkConnect helped me find my dream job as a construction worker. The platform is user-friendly and the job listings are comprehensive.",
      name: "John Silva",
      role: "Construction Worker",
      image: 'assets/testimonials/john.jpg'
    },
    {
      quote: "I've been using WorkConnect for over a year now and it has been a game changer for my business. The quality of workers I've found is exceptional.",
      name: "Saman Perera",
      role: "Business Owner",
      image: 'assets/testimonials/saman.jpg'
    },
    {
      quote: "The job application process on WorkConnect is seamless. I was able to find multiple job opportunities that matched my skills.",
      name: "Kamal Fernando",
      role: "Electrician",
      image: 'assets/testimonials/kamal.jpg'
    }
  ];
}

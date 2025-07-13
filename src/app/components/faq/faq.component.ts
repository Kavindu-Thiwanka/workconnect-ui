import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent {
  faqs = [
    {
      question: 'Is WorkConnect free to use?',
      answer: 'Yes! Both job seekers and employers can use WorkConnect for free. We believe in making job matching accessible to everyone.'
    },
    {
      question: 'How does the AI matching work?',
      answer: 'Our intelligent system analyzes your profile, skills, and preferences to recommend the best job or candidate matches for you. It considers factors like experience, location, and job requirements.'
    },
    {
      question: 'Can I apply for multiple jobs?',
      answer: 'Absolutely! You can apply to as many jobs as you like and track all your applications in your dashboard. We make it easy to manage multiple applications.'
    },
    {
      question: 'How do I update my profile?',
      answer: 'You can update your profile anytime from your dashboard. Just click on the edit button and make the necessary changes. Your updated information will be reflected in your job matches.'
    },
    {
      question: 'What if I don\'t find any matches?',
      answer: 'If you\'re not seeing any matches, try updating your profile with more detailed information about your skills and preferences. You can also adjust your search filters to broaden your options.'
    }
  ];

  activeIndex = -1;

  toggleAccordion(index: number) {
    this.activeIndex = this.activeIndex === index ? -1 : index;
  }

  trackByFn(index: number, item: any): number {
    return index;
  }
}

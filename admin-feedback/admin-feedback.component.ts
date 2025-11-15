import { Component, OnInit } from '@angular/core';
import { DataStorageService } from '../service/data-storage.service';

@Component({
  selector: 'app-admin-feedback',
  templateUrl: './admin-feedback.component.html',
  styleUrls: ['./admin-feedback.component.css'],
})
export class AdminFeedbackComponent implements OnInit {
  feedbacks: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private dataStorage: DataStorageService) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    try {
      this.feedbacks = this.dataStorage.getFeedbacks();
      console.log('Admin feedbacks received:', JSON.stringify(this.feedbacks, null, 2));
      this.loading = false;
      if (this.feedbacks.length === 0) {
        this.error = 'No feedbacks found.';
      }
    } catch (err: any) {
      console.error('Error fetching feedbacks:', err);
      this.error = 'Failed to load feedbacks. Please try again later.';
      this.loading = false;
    }
  }
}
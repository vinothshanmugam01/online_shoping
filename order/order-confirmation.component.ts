import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from '../service/backend.service';
import { DataStorageService } from '../service/data-storage.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css'],
})
export class OrderConfirmationComponent implements OnInit {
  orderId: string | null = null;
  order: any = null;
  userDetails: any = null;
  feedback: any = { rating: '', comment: '' };
  feedbackLoading = false;
  feedbackSuccess = false;
  feedbackError: string | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private backend: BackendService,
    private dataStorage: DataStorageService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
    console.log('Order ID from query:', this.orderId);
    if (this.orderId) {
      this.loadOrder();
      // Check if feedback already submitted
      const existingFeedback = this.dataStorage.getFeedbacks().find((f: any) => f.orderId === this.orderId);
      if (existingFeedback) {
        this.feedbackSuccess = true;
      }
    } else {
      this.error = 'No order ID provided';
      this.loading = false;
    }
  }

  loadOrder(): void {
    this.backend.getOrders().subscribe({
      next: (orders) => {
        console.log('Fetched orders:', JSON.stringify(orders, null, 2));
        this.order = orders.find((o: any) => o._id === this.orderId);
        if (this.order) {
          console.log('Found order:', JSON.stringify(this.order, null, 2));
          this.userDetails = this.dataStorage.getUserDetails();
          console.log('User details:', JSON.stringify(this.userDetails, null, 2));
          this.loading = false;
        } else {
          this.error = 'Order not found';
          this.loading = false;
          console.error('Order not found for ID:', this.orderId);
        }
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.error = 'Failed to load order';
        this.loading = false;
      },
    });
  }

  submitFeedback(): void {
    if (!this.feedback.rating || !this.feedback.comment) {
      this.feedbackError = 'Please provide both a rating and a comment.';
      return;
    }
    this.feedbackLoading = true;
    this.feedbackError = null;
    try {
      const feedbackData = {
        orderId: this.orderId,
        rating: parseInt(this.feedback.rating, 10),
        comment: this.feedback.comment,
        createdAt: new Date().toISOString(),
      };
      this.dataStorage.addFeedback(feedbackData);
      this.feedbackSuccess = true;
      this.feedbackLoading = false;
      this.feedback = { rating: '', comment: '' };
      console.log('Feedback submitted:', feedbackData);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      this.feedbackError = 'Failed to submit feedback.';
      this.feedbackLoading = false;
    }
  }

  downloadPDF(): void {
    try {
      const doc = new jsPDF();
      const margin = 15;
      let y = margin;

      console.log('Order data for PDF:', JSON.stringify(this.order, null, 2));
      console.log('User details for PDF:', JSON.stringify(this.userDetails, null, 2));

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(0, 102, 204);
      doc.text('Infinite Mart', margin, y);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('Order Invoice', margin + 60, y);
      y += 10;

      doc.setDrawColor(0, 102, 204);
      doc.line(margin, y, 195, y);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text(`Order ID: ${this.order?._id || 'N/A'}`, margin, y);
      y += 7;
      doc.text(`Date: ${this.order?.createdAt ? new Date(this.order.createdAt).toLocaleString() : 'N/A'}`, margin, y);
      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Customer Details', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const userDetails = this.userDetails || {};
      autoTable(doc, {
        startY: y,
        body: [
          ['Name', userDetails.name || 'N/A'],
          ['Address', userDetails.address || 'N/A'],
          ['Phone', userDetails.phone || 'N/A'],
          ['Payment Method', userDetails.paymentMethod || 'N/A'],
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2, textColor: 0 },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [0, 102, 204] },
          1: { cellWidth: 100 },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Order Summary', margin, y);
      y += 7;
      const items = this.order?.items || [];
      autoTable(doc, {
        startY: y,
        head: [['Product', 'Quantity', 'Price', 'Total']],
        body: items.map((item: any) => [
          item?.name || 'Unknown Product',
          item?.quantity || 0,
          `₹${(item?.price || 0).toFixed(2)}`,
          `₹${((item?.price || 0) * (item?.quantity || 0)).toFixed(2)}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [0, 102, 204], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3, textColor: 0 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Total Amount: ₹${(this.order?.totalPrice || 0).toFixed(2)}`, margin, y);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Thank you for shopping with Infinite Mart!', margin, 280);
      doc.text('Visit us at www.infinitemart.com', margin, 285);

      doc.save(`invoice_${this.order?._id || 'unknown'}.pdf`);
    } catch (err: any) {
      console.error('PDF generation failed:', err.message);
      this.error = `Error generating PDF: ${err.message}`;
    }
  }
}
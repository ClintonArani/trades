import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  safeUrl: SafeResourceUrl;
  
  constructor(private sanitizer: DomSanitizer) {
    // Sanitize the URL to bypass Angular's security for iframes
    // The #dashboard hash fragment tells Deriv Bot to show its dashboard view
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://bot.deriv.com/#dashboard'
    );
  }
}
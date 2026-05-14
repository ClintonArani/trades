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
    // Correct URL - no invalid query parameters
    // Deriv Bot only accepts the base URL with hash routing
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://bot.deriv.com'
    );
    
    // If you need the dashboard view specifically:
    // this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    //   'https://bot.deriv.com/#dashboard'
    // );
  }
}
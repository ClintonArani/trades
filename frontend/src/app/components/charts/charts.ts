import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-charts',
  imports: [],
  templateUrl: './charts.html',
  styleUrl: './charts.css',
})
export class Charts {
  safeUrl: SafeResourceUrl;
  
  constructor(private sanitizer: DomSanitizer) {
    // The #chart hash fragment tells Deriv Bot to show its chart view
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://bot.deriv.com/#chart'
    );
  }
}

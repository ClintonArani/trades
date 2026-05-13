import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-trader',
  imports: [],
  templateUrl: './trader.html',
  styleUrl: './trader.css',
})
export class Trader {
  safeUrl: SafeResourceUrl;
  
  constructor(private sanitizer: DomSanitizer) {
    // DTrader main trading platform URL
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://dsmarttrader.deriv.com '
    );
  }
}
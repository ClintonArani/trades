import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-batch-trader',
  imports: [],
  templateUrl: './batch-trader.html',
  styleUrl: './batch-trader.css',
})
export class BatchTrader  {
  safeUrl: SafeResourceUrl;
  
  constructor(private sanitizer: DomSanitizer) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://dtrader.deriv.com'
    );
  }
}

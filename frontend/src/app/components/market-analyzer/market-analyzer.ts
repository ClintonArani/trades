import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-market-analyzer',
  imports: [NgIf ],
  templateUrl: './market-analyzer.html',
  styleUrl: './market-analyzer.css',
})
export class MarketAnalyzer {
  safeUrl: SafeResourceUrl;
  iframeError: boolean = false;

  constructor(private sanitizer: DomSanitizer) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://charts.deriv.com/deriv'
    );
  }

  onIframeError() {
    this.iframeError = true;
  }

  openInNewTab() {
    window.open('https://charts.deriv.com/deriv', '_blank');
  }
}
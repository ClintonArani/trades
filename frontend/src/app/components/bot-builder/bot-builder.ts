import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-bot-builder',
  imports: [CommonModule],
  templateUrl: './bot-builder.html',
  styleUrl: './bot-builder.css',
})
export class BotBuilder  {
  safeUrl: SafeResourceUrl;
  
  constructor(private sanitizer: DomSanitizer) {
    // Sanitize the URL to bypass Angular's security for iframes
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://bot.deriv.com/#bot_builder'
    );
  }

  
}
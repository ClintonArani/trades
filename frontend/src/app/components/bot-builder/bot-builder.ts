import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-bot-builder',
  imports: [CommonModule],
  templateUrl: './bot-builder.html',
  styleUrl: './bot-builder.css',
})
export class BotBuilder implements OnInit {
  safeUrl: SafeResourceUrl;
  
  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {
    // Initialize with base URL
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://bot.deriv.com/#bot_builder');
  }

  ngOnInit() {
    // Subscribe to auth state and update iframe URL when token is available
    this.authService.getAccessToken().subscribe(token => {
      if (token) {
        this.updateIframeWithToken(token);
      }
    });
    
    // Also check immediately
    this.authService.getUserInfo().subscribe({
      next: (data) => {
        if (data.authenticated) {
          // You'll need to get the actual token
          this.authService.getAccessToken().subscribe(token => {
            if (token) {
              this.updateIframeWithToken(token);
            }
          });
        }
      }
    });
  }

  private updateIframeWithToken(token: string) {
    // Deriv accepts token via URL hash parameter
    const url = `https://bot.deriv.com/#bot_builder?token=${token}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
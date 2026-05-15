import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  safeUrl: SafeResourceUrl;
  
  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://bot.deriv.com');
  }

  ngOnInit() {
    this.authService.getAccessToken().subscribe(token => {
      if (token) {
        this.updateIframeWithToken(token);
      }
    });
  }

  private updateIframeWithToken(token: string) {
    const url = `https://bot.deriv.com/#dashboard?token=${token}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
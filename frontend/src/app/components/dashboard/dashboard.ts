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
    private authService: AuthService,
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://bot.deriv.com');
  }
  ngOnInit() {
    // Check for auth_success parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success')) {
      console.log('Just completed OAuth flow, checking auth status...');
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      // Force an auth check
      setTimeout(() => {
        this.authService.checkAuthStatus();
      }, 500);
    } else {
      // Normal auth check
      this.authService.checkAuthStatus();
    }
  }

  private updateIframeWithToken(token: string) {
    const url = `https://bot.deriv.com/#dashboard?token=${token}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

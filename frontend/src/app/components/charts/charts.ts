import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-charts',
  imports: [],
  templateUrl: './charts.html',
  styleUrl: './charts.css',
})
export class Charts implements OnInit {
  safeUrl: SafeResourceUrl;
  
  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://bot.deriv.com/#chart');
  }

  ngOnInit() {
    this.authService.getAccessToken().subscribe(token => {
      if (token) {
        this.updateIframeWithToken(token);
      }
    });
  }

  private updateIframeWithToken(token: string) {
    const url = `https://bot.deriv.com/#chart?token=${token}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
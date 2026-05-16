import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {
  isMobileMenuOpen: boolean = false;

  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/bot-builder', label: 'Bot Builder', icon: '🤖' },
    { path: '/charts', label: 'Charts', icon: '📈' },
    { path: '/free-bots', label: 'Free Bots', icon: '🎁' },
    { path: '/analysis-tool', label: 'Analysis Tool', icon: '⏱️' },
    { path: '/market-analyzer', label: 'Market Analyzer', icon: '🔍' },
    { path: '/frequency-analysis', label: 'Frequency Analysis', icon: '📊' },
    { path: '/digital-tool', label: 'Digital Tool', icon: '🛠️' },
    { path: '/fx-charts', label: 'FX Charts', icon: '�' },
  ];

  isAuthenticated: boolean = false;
  userEmail: string = '';

  // AI Scanner properties
  isAiScannerVisible: boolean = false;
  ticks: number = 100;
  scanProgress: number = 0;
  scanStatus: string = 'Not scanned yet';
  isScanning: boolean = false;
  scannedBots: any[] = [];
  scannedMarkets: number = 0;
  totalMarkets: number = 12; // Example total markets to scan

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    console.log('Home component initialized');

    this.authService.isAuthenticated$.subscribe((isAuth) => {
      console.log('Auth state changed:', isAuth);
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.authService.getUserInfo().subscribe({
          next: (data) => {
            console.log('User info received:', data);
            console.log('Full data object:', JSON.stringify(data, null, 2));

            // Try multiple possible locations for the email
            const email = data.user?.email || data.email || data.user?.loginid || 'User';
            console.log('Extracted email:', email);

            this.userEmail = email;
            console.log('User email set to:', this.userEmail);
          },
          error: (err) => {
            console.error('Error fetching user info:', err);
            this.userEmail = 'User';
          },
        });
      }
    });

    // Force an initial auth check
    this.authService.checkAuthStatus();
  }

  signInWithDeriv(): void {
    this.authService.login();
  }

  signUpWithDeriv(): void {
    window.location.href = 'https://home.deriv.com/dashboard/signup';
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      window.location.href = '/';
    });
  }

  // AI Scanner Methods
  openAiScanner(): void {
    this.isAiScannerVisible = true;
  }

  closeAiScanner(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.isAiScannerVisible = false;
    } else if (!event) {
      this.isAiScannerVisible = false;
    }
  }

  async deepScanMarket(): Promise<void> {
    if (this.isScanning) return;

    this.isScanning = true;
    this.scanStatus = 'Initializing scanner...';
    this.scanProgress = 0;
    this.scannedMarkets = 0;

    // Simulate scanning through markets
    for (let i = 1; i <= this.totalMarkets; i++) {
      await this.delay(250);
      this.scannedMarkets = i;
      this.scanProgress = (i / this.totalMarkets) * 100;
      this.scanStatus = `Scanning market ${i}/${this.totalMarkets}...`;
    }

    // Simulate analyzing tick data
    await this.delay(500);
    this.scanStatus = 'Analyzing tick data patterns...';
    await this.delay(500);

    // Generate mock scan results
    const markets = ['R_10', 'R_50', 'R_75', 'R_100', 'BOOM 300', 'CRASH 500'];
    const bestMarket = markets[Math.floor(Math.random() * markets.length)];
    const bestEntryPoint = (Math.random() * 100).toFixed(2);
    const confidence = (Math.random() * 30 + 70).toFixed(1);

    this.scanStatus = `✅ Best market found: ${bestMarket} | Entry: ${bestEntryPoint} | Confidence: ${confidence}%`;

    // Create a scanned bot profile
    const scannedBot = {
      id: Date.now(),
      market: bestMarket,
      entryPoint: parseFloat(bestEntryPoint),
      confidence: parseFloat(confidence),
      ticksScanned: this.ticks,
      timestamp: new Date(),
      strategy: this.generateStrategy(),
      performance: (Math.random() * 40 + 60).toFixed(1),
    };

    this.scannedBots.push(scannedBot);
    this.isScanning = false;
    this.scanProgress = 100;

    // Optional: Auto-close modal after successful scan
    // setTimeout(() => {
    //   if (this.isAiScannerVisible) {
    //     this.isAiScannerVisible = false;
    //   }
    // }, 3000);
  }

  generateStrategy(): string {
    const strategies = [
      'Mean Reversion with Bollinger Bands',
      'Trend Following with EMA Cross',
      'Momentum with RSI',
      'Breakout with Support/Resistance',
      'Scalping with Tick Analysis',
    ];
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  loadDeepScannerBot(): void {
    if (this.scannedBots.length === 0) {
      this.scanStatus = '⚠️ Please run a deep scan first!';
      return;
    }

    const latestBot = this.scannedBots[this.scannedBots.length - 1];
    this.scanStatus = `🤖 Bot loaded: ${latestBot.strategy} on ${latestBot.market} | Performance: ${latestBot.performance}%`;

    console.log('Loading bot with config:', latestBot);

    // Here you can navigate to bot builder with the config
    // this.router.navigate(['/bot-builder'], { state: { botConfig: latestBot } });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Mobile menu methods
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }
}

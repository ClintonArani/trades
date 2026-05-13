import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/bot-builder', label: 'Bot Builder', icon: '🤖' },
    { path: '/charts', label: 'Charts', icon: '📈' },
    { path: '/trader', label: 'Trader', icon: '💹' },
    { path: '/free-bots', label: 'Free Bots', icon: '🎁' },
    { path: '/batch-trader', label: 'Batch Trader', icon: '⏱️' },
    { path: '/market-analyzer', label: 'Market Analyzer', icon: '🔍' },
    { path: '/frequency-analysis', label: 'Frequency Analysis', icon: '📊' },
    { path: '/digital-tool', label: 'Digital Tool', icon: '🛠️' },
  ];

  signInWithDeriv() {
    // Redirect to Deriv login
    window.location.href = 'https://home.deriv.com/dashboard/login';
  }

  signUpWithDeriv() {
    // Redirect to Deriv signup
    window.location.href = 'https://home.deriv.com/dashboard/signup';
  }
}

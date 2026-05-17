import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-error',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full p-6 bg-white rounded-lg shadow-lg text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h1>
        <p class="text-gray-600 mb-6">{{ errorMessage }}</p>
        <div class="space-y-3">
          <button 
            (click)="tryAgain()" 
            class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
          >
            Try Again
          </button>
          <a 
            routerLink="/" 
            class="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition text-center"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './auth-error.css',
})
export class AuthError implements OnInit {
  errorMessage: string = 'Something went wrong during authentication.';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Get error message from URL query parameter
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.errorMessage = decodeURIComponent(params['message'].replace(/\+/g, ' '));
      }
    });
  }

  tryAgain() {
    window.location.href = '/';
  }
}
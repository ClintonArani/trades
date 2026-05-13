import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-frequency-analysis',
  imports: [CommonModule, FormsModule],
  templateUrl: './frequency-analysis.html',
  styleUrls: ['./frequency-analysis.css'],
})
export class FrequencyAnalysis implements OnInit, OnDestroy {
  markets: string[] = ['Volatility 100 Index', 'Volatility 75 Index', 'Boom 1000 Index', 'Crash 1000 Index'];
  selectedMarket: string = 'Volatility 100 Index';

  circleCircumference: number = 263.89;
  
  // Real-time tick data
  currentPrice: number = 5000.00;
  lastDigit: number = 0;
  totalTicks: number = 0;
  
  // Real-time frequency tracking
  digitCounts: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  digitPercentages: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  // For display
  digits: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  lastUpdateTime: Date = new Date();
  isRunning: boolean = true;
  
  // Animation triggers
  updatingDigit: number = -1;
  priceChangeClass: string = '';
  lastPrice: number = 5000.00;
  
  // Speed control
  tickSpeed: number = 800;
  speedOptions = [
    { value: 300, label: 'Fast (0.3s)' },
    { value: 800, label: 'Normal (0.8s)' },
    { value: 1500, label: 'Slow (1.5s)' },
    { value: 2500, label: 'Very Slow (2.5s)' }
  ];
  
  private intervalId: any;
  private readonly CIRCLE_CIRCUMFERENCE = 263.89;
  private readonly MAX_DISPLAY_PERCENTAGE = 14; // Maximum 14% for display

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startRealTimeTicks();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startRealTimeTicks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.generateTick();
        this.cdr.detectChanges();
      }
    }, this.tickSpeed);
  }

  generateTick(): void {
    // Generate realistic price movement based on market
    let volatility = 15;
    if (this.selectedMarket.includes('Volatility 100')) volatility = 100;
    else if (this.selectedMarket.includes('Volatility 75')) volatility = 75;
    else if (this.selectedMarket.includes('Boom')) volatility = 120;
    else if (this.selectedMarket.includes('Crash')) volatility = 60;
    
    // Random price movement
    const change = (Math.random() - 0.5) * volatility;
    let newPrice = this.currentPrice + change;
    
    // Keep price positive and reasonable
    if (newPrice < 100) newPrice = 100 + Math.random() * 900;
    if (newPrice > 50000) newPrice = 50000 - Math.random() * 10000;
    
    this.lastPrice = this.currentPrice;
    this.currentPrice = Math.floor(newPrice * 100) / 100;
    
    // Add price change animation class
    this.priceChangeClass = this.currentPrice > this.lastPrice ? 'price-up' : 'price-down';
    setTimeout(() => {
      this.priceChangeClass = '';
      this.cdr.detectChanges();
    }, 300);
    
    // Get last digit
    const integerPart = Math.floor(Math.abs(this.currentPrice));
    const newLastDigit = integerPart % 10;
    this.lastDigit = newLastDigit;
    this.totalTicks++;
    
    // Trigger animation for this digit
    this.updatingDigit = newLastDigit;
    setTimeout(() => {
      this.updatingDigit = -1;
      this.cdr.detectChanges();
    }, 200);
    
    // Update real-time counts
    this.digitCounts[newLastDigit]++;
    
    // Recalculate percentages with capping
    this.updatePercentages();
    
    // Update timestamp
    this.lastUpdateTime = new Date();
  }

  updatePercentages(): void {
    if (this.totalTicks === 0) {
      this.digitPercentages = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      return;
    }
    
    // Calculate raw percentages
    for (let i = 0; i < 10; i++) {
      const rawPercentage = (this.digitCounts[i] / this.totalTicks) * 100;
      // Cap each percentage at MAX_DISPLAY_PERCENTAGE (14%)
      this.digitPercentages[i] = Math.min(rawPercentage, this.MAX_DISPLAY_PERCENTAGE);
    }
  }

  getPercentage(digit: number): number {
    // Return capped percentage (max 14%)
    return Math.min(this.digitPercentages[digit], this.MAX_DISPLAY_PERCENTAGE);
  }

  getPercentageString(digit: number): string {
    // Display capped percentage
    return this.getPercentage(digit).toFixed(2);
  }

  getCount(digit: number): number {
    return this.digitCounts[digit];
  }

  getStrokeDashoffset(digit: number): number {
    // Use capped percentage for the circle progress
    const percentage = this.getPercentage(digit);
    return this.CIRCLE_CIRCUMFERENCE - (percentage / 100) * this.CIRCLE_CIRCUMFERENCE;
  }

  isUpdating(digit: number): boolean {
    return this.updatingDigit === digit;
  }

  getGradientColor(index: number, stop: number): string {
    const colors = [
      ['#EF4444', '#F97316'],
      ['#F59E0B', '#FBBF24'],
      ['#10B981', '#34D399'],
      ['#3B82F6', '#60A5FA'],
      ['#8B5CF6', '#A78BFA'],
      ['#EC4899', '#F472B6'],
      ['#06B6D4', '#22D3EE'],
      ['#F97316', '#FB923C'],
      ['#6366F1', '#818CF8'],
      ['#D946EF', '#E879F9']
    ];
    return stop === 0 ? colors[index % colors.length][0] : colors[index % colors.length][1];
  }

  resetAnalysis(): void {
    this.digitCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.totalTicks = 0;
    this.currentPrice = 5000.00;
    this.lastPrice = 5000.00;
    this.lastDigit = 0;
    this.updatePercentages();
    this.lastUpdateTime = new Date();
    this.cdr.detectChanges();
  }

  changeSpeed(speed: string): void {
    this.tickSpeed = parseInt(speed);
    this.startRealTimeTicks();
  }

  toggleRunning(): void {
    this.isRunning = !this.isRunning;
    this.cdr.detectChanges();
  }

  get mostFrequentDigit(): string {
    let maxIdx = 0;
    let maxVal = this.digitCounts[0];
    for (let i = 1; i < 10; i++) {
      if (this.digitCounts[i] > maxVal) {
        maxVal = this.digitCounts[i];
        maxIdx = i;
      }
    }
    return maxIdx.toString();
  }

  get maxFrequency(): string {
    const maxVal = Math.max(...this.digitCounts);
    if (this.totalTicks === 0) return '0.00';
    return ((maxVal / this.totalTicks) * 100).toFixed(2);
  }

  get leastFrequentDigit(): string {
    let minIdx = 0;
    let minVal = this.digitCounts[0];
    for (let i = 1; i < 10; i++) {
      if (this.digitCounts[i] < minVal) {
        minVal = this.digitCounts[i];
        minIdx = i;
      }
    }
    return minIdx.toString();
  }

  get minFrequency(): string {
    const minVal = Math.min(...this.digitCounts);
    if (this.totalTicks === 0) return '0.00';
    return ((minVal / this.totalTicks) * 100).toFixed(2);
  }

  get variance(): string {
    if (this.totalTicks === 0) return '0.00';
    const mean = 10;
    // Use raw percentages for statistical calculations
    const rawPercentages = this.digitCounts.map(count => (count / this.totalTicks) * 100);
    const varianceVal = rawPercentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / 10;
    return varianceVal.toFixed(2);
  }

  get expectedValue(): string {
    if (this.totalTicks === 0) return '0.00';
    let chiSquare = 0;
    const expectedCount = this.totalTicks / 10;
    for (let i = 0; i < 10; i++) {
      chiSquare += Math.pow(this.digitCounts[i] - expectedCount, 2) / expectedCount;
    }
    return chiSquare.toFixed(2);
  }

  formatTime(): string {
    return this.lastUpdateTime.toLocaleTimeString();
  }
}
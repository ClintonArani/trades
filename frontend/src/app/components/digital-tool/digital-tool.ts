import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-digital-tool',
  imports: [CommonModule, FormsModule],
  templateUrl: './digital-tool.html',
  styleUrls: ['./digital-tool.css'],
})
export class DigitalTool implements OnInit, OnDestroy {
  // Market data
  markets: string[] = ['Volatility 100 Index', 'Volatility 75 Index', 'Boom 1000 Index', 'Crash 1000 Index'];
  selectedMarket: string = 'Volatility 100 Index';
  
  // Price data
  currentPrice: number = 686.45;
  lastDigit: number = 0;
  totalTicks: number = 1000;
  lastChange: number = 0;
  priceDirection: 'up' | 'down' | 'neutral' = 'neutral';
  
  // Live update control
  isLiveUpdating: boolean = true;
  updateSpeed: number = 800; // Faster updates for better real-time feel
  countdown: number = 800;
  private intervalId: any;
  private countdownId: any;
  
  // Digit frequencies (0-9)
  digits: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  digitFrequencies: number[] = [10.70, 9.30, 9.10, 10.10, 11.00, 10.40, 11.00, 10.30, 8.40, 9.70];
  digitCounts: number[] = [218, 190, 186, 206, 224, 212, 224, 210, 171, 198];
  
  // History tracking
  priceHistory: number[] = [];
  digitHistory: number[] = [];
  maxHistorySize: number = 100;
  
  // Over/Under
  threshold: number = 500;
  overPercentage: number = 40.2;
  underPercentage: number = 59.8;
  overCount: number = 402;
  underCount: number = 598;
  
  // Matches/Differs
  selectedCompareDigit: number = 0;
  matchesPercentage: number = 10.9;
  differsPercentage: number = 89.1;
  matchesCount: number = 109;
  differsCount: number = 891;
  
  // Even/Odd
  evenPercentage: number = 51.3;
  oddPercentage: number = 48.7;
  evenCount: number = 513;
  oddCount: number = 487;
  evenOddStreak: number = 0;
  evenOddStreakType: string = '';
  maxEvenPercentage: number = 55.0;
  maxOddPercentage: number = 52.0;
  
  // Rise/Fall
  risePercentage: number = 48.5;
  fallPercentage: number = 51.5;
  riseCount: number = 485;
  fallCount: number = 515;
  maxRise: number = 12.45;
  maxFall: number = -11.32;
  
  // UI state
  showMoreEvenOdd: boolean = false;
  showMoreRiseFall: boolean = false;
  activeTab: string = 'digits';
  animatedDigit: number = -1;
  private lastUpdatedDigit: number = -1;
  
  private readonly CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 45;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    this.initHistory();
    this.startLiveUpdates();
    this.startCountdown();
  }
  
  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.countdownId) clearInterval(this.countdownId);
  }
  
  initHistory(): void {
    for (let i = 0; i < 50; i++) {
      const price = 500 + Math.random() * 500;
      this.priceHistory.push(price);
      const digit = Math.floor(price) % 10;
      this.digitHistory.push(digit);
    }
  }
  
  startLiveUpdates(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (this.isLiveUpdating) {
        this.generateNewTick();
        this.countdown = this.updateSpeed;
        this.cdr.detectChanges(); // Force UI update
      }
    }, this.updateSpeed);
  }
  
  startCountdown(): void {
    this.countdownId = setInterval(() => {
      if (this.isLiveUpdating && this.countdown > 0) {
        this.countdown -= 100;
        if (this.countdown < 0) this.countdown = 0;
        this.cdr.detectChanges();
      }
    }, 100);
  }
  
  toggleLiveUpdates(): void {
    this.isLiveUpdating = !this.isLiveUpdating;
    if (this.isLiveUpdating) {
      this.countdown = this.updateSpeed;
    }
    this.cdr.detectChanges();
  }
  
  generateManualTick(): void {
    this.generateNewTick();
    this.countdown = this.updateSpeed;
    this.cdr.detectChanges();
  }
  
  onMarketChange(): void {
    this.resetStats();
    this.cdr.detectChanges();
  }
  
  generateNewTick(): void {
    // Simulate realistic price movement
    let volatility = 1.5;
    if (this.selectedMarket.includes('Volatility 100')) volatility = 2.0;
    if (this.selectedMarket.includes('Volatility 75')) volatility = 1.8;
    if (this.selectedMarket.includes('Boom')) volatility = 2.5;
    if (this.selectedMarket.includes('Crash')) volatility = 2.2;
    
    const change = (Math.random() - 0.48) * volatility * 8;
    const newPrice = Math.max(50, Math.min(1500, this.currentPrice + change));
    
    this.lastChange = change;
    this.priceDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    this.currentPrice = newPrice;
    
    const newLastDigit = Math.floor(this.currentPrice) % 10;
    this.lastDigit = newLastDigit;
    
    // Trigger animation for this digit
    this.animatedDigit = newLastDigit;
    setTimeout(() => { 
      this.animatedDigit = -1;
      this.cdr.detectChanges();
    }, 300);
    
    this.totalTicks++;
    
    // Update history
    this.priceHistory.push(this.currentPrice);
    this.digitHistory.push(newLastDigit);
    if (this.priceHistory.length > this.maxHistorySize) {
      this.priceHistory.shift();
      this.digitHistory.shift();
    }
    
    // Update all statistics
    this.updateDigitFrequencies(newLastDigit);
    this.updateOverUnder();
    this.updateMatchesDiffers();
    this.updateEvenOdd();
    this.updateRiseFall(change);
    
    this.cdr.detectChanges();
  }
  
  updateDigitFrequencies(digit: number): void {
    this.digitCounts[digit]++;
    const total = this.digitCounts.reduce((a, b) => a + b, 0);
    for (let i = 0; i < 10; i++) {
      this.digitFrequencies[i] = parseFloat(((this.digitCounts[i] / total) * 100).toFixed(2));
    }
  }
  
  updateOverUnder(): void {
    const isOver = this.currentPrice > this.threshold;
    if (isOver) this.overCount++;
    else this.underCount++;
    
    const total = this.overCount + this.underCount;
    this.overPercentage = parseFloat(((this.overCount / total) * 100).toFixed(1));
    this.underPercentage = parseFloat((100 - this.overPercentage).toFixed(1));
  }
  
  incrementOver(): void {
    this.overCount++;
    const total = this.overCount + this.underCount;
    this.overPercentage = parseFloat(((this.overCount / total) * 100).toFixed(1));
    this.underPercentage = parseFloat((100 - this.overPercentage).toFixed(1));
    this.cdr.detectChanges();
  }
  
  incrementUnder(): void {
    this.underCount++;
    const total = this.overCount + this.underCount;
    this.overPercentage = parseFloat(((this.overCount / total) * 100).toFixed(1));
    this.underPercentage = parseFloat((100 - this.overPercentage).toFixed(1));
    this.cdr.detectChanges();
  }
  
  updateMatchesDiffers(): void {
    const isMatch = this.lastDigit === this.selectedCompareDigit;
    if (isMatch) this.matchesCount++;
    else this.differsCount++;
    
    const total = this.matchesCount + this.differsCount;
    this.matchesPercentage = parseFloat(((this.matchesCount / total) * 100).toFixed(1));
    this.differsPercentage = parseFloat((100 - this.matchesPercentage).toFixed(1));
  }
  
  updateEvenOdd(): void {
    const isEven = this.lastDigit % 2 === 0;
    if (isEven) {
      this.evenCount++;
      this.evenOddStreak = this.evenOddStreakType === 'Even' ? this.evenOddStreak + 1 : 1;
      this.evenOddStreakType = 'Even';
    } else {
      this.oddCount++;
      this.evenOddStreak = this.evenOddStreakType === 'Odd' ? this.evenOddStreak + 1 : 1;
      this.evenOddStreakType = 'Odd';
    }
    
    const total = this.evenCount + this.oddCount;
    this.evenPercentage = parseFloat(((this.evenCount / total) * 100).toFixed(1));
    this.oddPercentage = parseFloat((100 - this.evenPercentage).toFixed(1));
    
    if (this.evenPercentage > this.maxEvenPercentage) this.maxEvenPercentage = this.evenPercentage;
    if (this.oddPercentage > this.maxOddPercentage) this.maxOddPercentage = this.oddPercentage;
  }
  
  updateRiseFall(change: number): void {
    const isRise = change > 0;
    if (isRise) {
      this.riseCount++;
      if (change > this.maxRise) this.maxRise = change;
    } else if (change < 0) {
      this.fallCount++;
      if (change < this.maxFall) this.maxFall = change;
    }
    
    const total = this.riseCount + this.fallCount;
    this.risePercentage = parseFloat(((this.riseCount / total) * 100).toFixed(1));
    this.fallPercentage = parseFloat((100 - this.risePercentage).toFixed(1));
  }
  
  adjustThreshold(delta: number): void {
    this.threshold += delta;
    this.threshold = Math.max(50, Math.min(1500, this.threshold));
    this.recalculateOverUnderFromHistory();
    this.cdr.detectChanges();
  }
  
  recalculateOverUnderFromHistory(): void {
    let overTotal = 0, underTotal = 0;
    for (const price of this.priceHistory) {
      if (price > this.threshold) overTotal++;
      else underTotal++;
    }
    this.overCount = overTotal;
    this.underCount = underTotal;
    const total = this.overCount + this.underCount;
    if (total > 0) {
      this.overPercentage = parseFloat(((this.overCount / total) * 100).toFixed(1));
      this.underPercentage = parseFloat((100 - this.overPercentage).toFixed(1));
    }
  }
  
  selectDigit(digit: number): void {
    this.selectedCompareDigit = digit;
    this.recalculateMatchesDiffersFromHistory();
    this.cdr.detectChanges();
  }
  
  recalculateMatchesDiffersFromHistory(): void {
    let matchesTotal = 0, differsTotal = 0;
    for (const digit of this.digitHistory) {
      if (digit === this.selectedCompareDigit) matchesTotal++;
      else differsTotal++;
    }
    this.matchesCount = matchesTotal;
    this.differsCount = differsTotal;
    const total = this.matchesCount + this.differsCount;
    if (total > 0) {
      this.matchesPercentage = parseFloat(((this.matchesCount / total) * 100).toFixed(1));
      this.differsPercentage = parseFloat((100 - this.matchesPercentage).toFixed(1));
    }
  }
  
  getRecentMatchPattern(): string[] {
    return this.digitHistory.slice(-20).map(d => d === this.selectedCompareDigit ? '✓' : '✗');
  }
  
  getRecentEvenOddPattern(): string[] {
    return this.digitHistory.slice(-12).map(d => d % 2 === 0 ? 'E' : 'O');
  }
  
  resetStats(): void {
    this.totalTicks = 1000;
    this.digitCounts = [218, 190, 186, 206, 224, 212, 224, 210, 171, 198];
    this.overCount = 402;
    this.underCount = 598;
    this.matchesCount = 109;
    this.differsCount = 891;
    this.evenCount = 513;
    this.oddCount = 487;
    this.riseCount = 485;
    this.fallCount = 515;
    this.currentPrice = 500 + Math.random() * 500;
    this.lastDigit = Math.floor(this.currentPrice) % 10;
    this.evenOddStreak = 0;
    
    this.updateDigitFrequencies(0);
    this.updateOverUnder();
    this.updateMatchesDiffers();
    this.updateEvenOdd();
    this.cdr.detectChanges();
  }
  
  refreshAll(): void {
    this.resetStats();
  }
  
  getCircumference(): string {
    return `${this.CIRCLE_CIRCUMFERENCE}`;
  }
  
  getOffset(percentage: number): number {
    return this.CIRCLE_CIRCUMFERENCE - (percentage / 100) * this.CIRCLE_CIRCUMFERENCE;
  }
  
  getCircleColor(index: number, stop: number): string {
    const colors = [
      ['#EF4444', '#F97316'], ['#F59E0B', '#FBBF24'], ['#10B981', '#34D399'],
      ['#3B82F6', '#60A5FA'], ['#8B5CF6', '#A78BFA'], ['#EC4899', '#F472B6'],
      ['#06B6D4', '#22D3EE'], ['#F97316', '#FB923C'], ['#6366F1', '#818CF8'],
      ['#D946EF', '#E879F9']
    ];
    return stop === 0 ? colors[index][0] : colors[index][1];
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }
  
  isDigitAnimating(digit: number): boolean {
    return this.animatedDigit === digit;
  }
  
  getPriceAnimationClass(): string {
    if (this.priceDirection === 'up') return 'price-up';
    if (this.priceDirection === 'down') return 'price-down';
    return '';
  }
}
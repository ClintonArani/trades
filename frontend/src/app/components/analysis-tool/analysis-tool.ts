// analysis-tool.ts
import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-tool',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysis-tool.html',
  styleUrls: ['./analysis-tool.css']
})
export class AnalysisTool implements OnInit, OnDestroy {
  activeTab: 'evenodd' | 'overunder' | 'matchdiffer' | 'risefall' = 'evenodd';
  
  selectedVolatility: string = 'VOLATILITY INDEX 10';
  volatilityList: string[] = [
    'VOLATILITY INDEX 10', 'VOLATILITY INDEX 25', 'VOLATILITY INDEX 50',
    'VOLATILITY INDEX 75', 'VOLATILITY INDEX 100', 'VOLATILITY INDEX 10s',
    'VOLATILITY INDEX 25s', 'VOLATILITY INDEX 50s', 'VOLATILITY INDEX 75s',
    'VOLATILITY INDEX 100s', 'JUMP INDEX 10', 'JUMP INDEX 25', 'JUMP INDEX 50',
    'JUMP INDEX 75', 'JUMP INDEX 100', 'BULL MARKET', 'BEAR MARKET'
  ];
  isDropdownOpen: boolean = false;
  
  numberOfDigits: number = 60;
  private priceHistory: number[] = [];
  private ticksHistory: { price: number, direction: 'rise' | 'fall' }[] = [];
  
  currentPrice: number = 4903.446;
  lastDirection: 'up' | 'down' | null = null;
  private priceInterval: any;
  private predictionInterval: any;
  
  // Real-time predictions
  nextEvenOddPrediction: string = 'EVEN';
  nextOverUnderPrediction: string = 'OVER 5';
  nextMatchDifferPrediction: string = 'DIFFER';
  nextRiseFallPrediction: string = 'RISE';
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    this.initializePriceHistory();
    this.startPriceSimulation();
    this.startPredictionEngine();
  }
  
  ngOnDestroy(): void {
    if (this.priceInterval) {
      clearInterval(this.priceInterval);
    }
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
    }
  }
  
  private initializePriceHistory(): void {
    for (let i = 0; i < this.numberOfDigits; i++) {
      const price = 4900 + (Math.random() * 20 - 10);
      this.priceHistory.push(price);
      if (i > 0) {
        const direction = price > this.priceHistory[i-1] ? 'rise' : 'fall';
        this.ticksHistory.push({ price, direction });
      }
    }
    this.currentPrice = this.priceHistory[this.priceHistory.length - 1];
  }
  
  private startPriceSimulation(): void {
    if (this.priceInterval) {
      clearInterval(this.priceInterval);
    }
    
    this.priceInterval = setInterval(() => {
      const volatility = this.getVolatilityValue();
      const trend = this.getTrendModifier();
      const change = (Math.random() - 0.5 + trend) * volatility;
      let newPrice = this.currentPrice + change;
      
      if (newPrice < 4800) newPrice = 4800 + Math.random() * 100;
      if (newPrice > 5200) newPrice = 5200 - Math.random() * 100;
      
      // Determine direction for animation
      this.lastDirection = newPrice > this.currentPrice ? 'up' : 'down';
      this.currentPrice = parseFloat(newPrice.toFixed(3));
      this.priceHistory.push(this.currentPrice);
      
      while (this.priceHistory.length > this.numberOfDigits) {
        this.priceHistory.shift();
      }
      
      if (this.priceHistory.length >= 2) {
        const lastPrice = this.priceHistory[this.priceHistory.length - 2];
        const direction = this.currentPrice > lastPrice ? 'rise' : 'fall';
        this.ticksHistory.push({ price: this.currentPrice, direction });
        while (this.ticksHistory.length > this.numberOfDigits) {
          this.ticksHistory.shift();
        }
      }
      
      this.cdr.detectChanges();
      
      // Clear direction after short time
      setTimeout(() => {
        this.lastDirection = null;
        this.cdr.detectChanges();
      }, 200);
    }, 800);
  }
  
  private startPredictionEngine(): void {
    this.predictionInterval = setInterval(() => {
      this.updatePredictions();
      this.cdr.detectChanges();
    }, 1000);
  }
  
  private updatePredictions(): void {
    // Even/Odd Prediction based on recent pattern
    const recentDigits = this.priceHistory.slice(-10).map(p => Math.floor(Math.abs(p)) % 10);
    const evenCount = recentDigits.filter(d => d % 2 === 0).length;
    this.nextEvenOddPrediction = evenCount >= 5 ? 'EVEN' : 'ODD';
    
    // Over/Under Prediction (based on last digit vs 5)
    const lastDigit = Math.floor(Math.abs(this.currentPrice)) % 10;
    this.nextOverUnderPrediction = lastDigit > 5 ? `OVER ${lastDigit}` : `UNDER ${lastDigit}`;
    
    // Match/Differ Prediction
    if (this.priceHistory.length >= 2) {
      const prevDigit = Math.floor(Math.abs(this.priceHistory[this.priceHistory.length - 2])) % 10;
      const currDigit = Math.floor(Math.abs(this.currentPrice)) % 10;
      this.nextMatchDifferPrediction = prevDigit === currDigit ? 'MATCH' : 'DIFFER';
    }
    
    // Rise/Fall Prediction based on recent momentum
    const recentTicks = this.ticksHistory.slice(-5);
    const riseCount = recentTicks.filter(t => t.direction === 'rise').length;
    this.nextRiseFallPrediction = riseCount >= 3 ? 'RISE' : 'FALL';
  }
  
  private getVolatilityValue(): number {
    const vol = this.selectedVolatility;
    if (vol.includes('10') && !vol.includes('100')) return 0.4;
    if (vol.includes('25')) return 0.9;
    if (vol.includes('50')) return 1.6;
    if (vol.includes('75')) return 2.2;
    if (vol.includes('100')) return 2.8;
    if (vol.includes('JUMP')) return 5.0;
    if (vol.includes('BULL')) return 1.3;
    if (vol.includes('BEAR')) return 1.3;
    return 0.5;
  }
  
  private getTrendModifier(): number {
    if (this.selectedVolatility.includes('BULL')) return 0.3;
    if (this.selectedVolatility.includes('BEAR')) return -0.3;
    return 0;
  }
  
  get priceDigits(): string {
    const priceStr = this.currentPrice.toFixed(3);
    const digits = priceStr.replace('.', '').split('');
    let result = '';
    for (let i = 0; i < digits.length; i++) {
      result += digits[i];
      if (i < digits.length - 1) result += ' ';
    }
    return result;
  }
  
  get digits(): number[] {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  }
  
  getLiveDigitPercentage(digit: number): number {
    if (this.priceHistory.length === 0) return 0;
    const count = this.priceHistory.filter(price => Math.floor(Math.abs(price)) % 10 === digit).length;
    return (count / this.priceHistory.length) * 100;
  }
  
  getLiveEvenPercentage(): number {
    let evenCount = 0;
    for (const price of this.priceHistory) {
      if (Math.floor(Math.abs(price)) % 2 === 0) evenCount++;
    }
    return (evenCount / this.priceHistory.length) * 100;
  }
  
  getLiveOddPercentage(): number {
    return 100 - this.getLiveEvenPercentage();
  }
  
  getLiveOverPercentage(digit: number): number {
    if (this.priceHistory.length === 0) return 0;
    let count = 0;
    for (const price of this.priceHistory) {
      const priceDigit = Math.floor(Math.abs(price)) % 10;
      if (priceDigit > digit) count++;
    }
    return (count / this.priceHistory.length) * 100;
  }
  
  getLiveUnderPercentage(digit: number): number {
    if (this.priceHistory.length === 0) return 0;
    let count = 0;
    for (const price of this.priceHistory) {
      const priceDigit = Math.floor(Math.abs(price)) % 10;
      if (priceDigit < digit) count++;
    }
    return (count / this.priceHistory.length) * 100;
  }
  
  getLiveMatchDifferPercentage(digit: number): number {
    if (this.priceHistory.length < 2) return 0;
    let differCount = 0;
    for (let i = 1; i < this.priceHistory.length; i++) {
      const prevDigit = Math.floor(Math.abs(this.priceHistory[i-1])) % 10;
      const currDigit = Math.floor(Math.abs(this.priceHistory[i])) % 10;
      if (prevDigit !== currDigit && currDigit === digit) {
        differCount++;
      }
    }
    return (differCount / (this.priceHistory.length - 1)) * 100;
  }
  
  getLiveRisePercentage(): number {
    if (this.ticksHistory.length === 0) return 0;
    const riseCount = this.ticksHistory.filter(t => t.direction === 'rise').length;
    return (riseCount / this.ticksHistory.length) * 100;
  }
  
  getLiveFallPercentage(): number {
    if (this.ticksHistory.length === 0) return 0;
    const fallCount = this.ticksHistory.filter(t => t.direction === 'fall').length;
    return (fallCount / this.ticksHistory.length) * 100;
  }
  
  setActiveTab(tab: 'evenodd' | 'overunder' | 'matchdiffer' | 'risefall'): void {
    this.activeTab = tab;
  }
  
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  
  selectVolatility(vol: string): void {
    this.selectedVolatility = vol;
    this.isDropdownOpen = false;
    this.startPriceSimulation();
  }
  
  incrementDigits(): void {
    if (this.numberOfDigits < 100) {
      this.numberOfDigits += 10;
      this.trimHistory();
    }
  }
  
  decrementDigits(): void {
    if (this.numberOfDigits > 10) {
      this.numberOfDigits -= 10;
      this.trimHistory();
    }
  }
  
  private trimHistory(): void {
    while (this.priceHistory.length > this.numberOfDigits) {
      this.priceHistory.shift();
    }
    while (this.ticksHistory.length > this.numberOfDigits) {
      this.ticksHistory.shift();
    }
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isDropdownOpen = false;
    }
  }
}
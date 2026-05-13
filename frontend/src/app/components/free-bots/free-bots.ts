import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Bot {
  id: number;
  name: string;
  category: string;
  icon: string;
  description: string;
  fullDescription: string;
  winRate: number;
  profit: number;
  users: number;
  avgReturn: number;
  version: string;
  tags: string[];
  features: string[];
  parameters: { name: string; value: string }[];
  metrics: { name: string; value: string; percentage: number }[];
  howItWorks: { title: string; description: string }[];
  chartData: number[];
  basePrice: number;
  // Bot configuration for Deriv bot builder
  botConfig?: {
    market: string;
    tradeType: string;
    contractType: string;
    duration: number;
    stake: number;
    purchaseCondition: string;
  };
}

@Component({
  selector: 'app-free-bots',
  imports: [CommonModule, FormsModule],
  templateUrl: './free-bots.html',
  styleUrl: './free-bots.css',
})
export class FreeBots implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('botChartCanvas') botChartCanvas!: ElementRef<HTMLCanvasElement>;

  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedBot: Bot | null = null;
  chartTimeframe: string = '1D';
  currentChartPrice: number = 0;
  chartPriceChange: number = 0;
  chartPriceChangePercent: number = 0;
  
  private chartInterval: any = null;
  private priceTrend: number = 0;
  
  private chart: any = null;
  private chartDataPoints: number[] = [];
  private chartLabels: string[] = [];
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;

  bots: Bot[] = [
    {
      id: 1,
      name: 'WiseBot free(Matches)',
      category: 'auto',
      icon: 'fa-solid fa-arrows-spin',
      description: 'Automatically switches between RISE and FALL based on market momentum',
      fullDescription: 'This advanced bot monitors market momentum and automatically switches between RISE and FALL positions. It uses a proprietary algorithm that analyzes tick velocity and price action to determine the optimal entry direction.',
      winRate: 78,
      profit: 156,
      users: 2340,
      avgReturn: 12.5,
      version: '2.1.0',
      tags: ['Auto Switch', 'Momentum', 'High Frequency'],
      features: ['Automatic direction switching', 'Smart loss prevention', 'Real-time market analysis', 'Customizable risk settings'],
      parameters: [
        { name: 'Base Stake', value: '10 AUD' },
        { name: 'Max Trades', value: '50' },
        { name: 'Switch Delay', value: '3 ticks' },
        { name: 'Risk Level', value: 'Medium' }
      ],
      metrics: [
        { name: 'Success Rate', value: '78%', percentage: 78 },
        { name: 'Profit Factor', value: '1.85', percentage: 85 },
        { name: 'Sharpe Ratio', value: '1.42', percentage: 70 },
        { name: 'Drawdown', value: '12%', percentage: 30 }
      ],
      howItWorks: [
        { title: 'Market Analysis', description: 'Bot analyzes tick momentum and price action in real-time' },
        { title: 'Direction Detection', description: 'Identifies optimal RISE or FALL entry points' },
        { title: 'Auto Execution', description: 'Automatically executes trades with smart risk management' }
      ],
      chartData: [100, 102, 105, 108, 112, 115, 118, 122, 125, 128, 130, 135],
      basePrice: 100,
      botConfig: {
        market: 'Derived > Continuous Indices > Volatility 100 (1s) Index',
        tradeType: 'Up/Down > Rise/Fall',
        contractType: 'Both',
        duration: 1,
        stake: 1,
        purchaseCondition: 'Rise'
      }
    },
    {
      id: 2,
      name: 'TradePilot free Bot',
      category: 'speed',
      icon: 'fa-solid fa-bolt',
      description: 'Ultra-fast trading bot for rapid market movements',
      fullDescription: 'The Speed Bot V2 is designed for high-velocity markets. It executes trades within milliseconds and is optimized for Boom/Crash indices. Features include advanced tick analysis and instant position management.',
      winRate: 82,
      profit: 189,
      users: 1890,
      avgReturn: 15.2,
      version: '2.0.0',
      tags: ['Speed', 'High Frequency', 'Boom/Crash'],
      features: ['Millisecond execution', 'Tick velocity analysis', 'Auto-adjusting stake', 'Real-time position tracking'],
      parameters: [
        { name: 'Base Stake', value: '15 AUD' },
        { name: 'Speed Mode', value: 'Ultra' },
        { name: 'Tick Threshold', value: '5 ticks' },
        { name: 'Max Speed', value: '50 trades/min' }
      ],
      metrics: [
        { name: 'Success Rate', value: '82%', percentage: 82 },
        { name: 'Profit Factor', value: '2.1', percentage: 90 },
        { name: 'Sharpe Ratio', value: '1.68', percentage: 75 },
        { name: 'Drawdown', value: '8%', percentage: 25 }
      ],
      howItWorks: [
        { title: 'Tick Monitoring', description: 'Analyzes tick patterns and velocity' },
        { title: 'Quick Entry', description: 'Executes trades at optimal moments' },
        { title: 'Fast Exit', description: 'Closes positions for maximum profit' }
      ],
      chartData: [100, 98, 105, 110, 108, 115, 120, 125, 122, 130, 135, 140],
      basePrice: 100,
      botConfig: {
        market: 'Derived > Continuous Indices > Volatility 100 (1s) Index',
        tradeType: 'Up/Down > Rise/Fall',
        contractType: 'Both',
        duration: 1,
        stake: 10,
        purchaseCondition: 'Rise'
      }
    },
    {
      id: 3,
      name: 'AlphaWise Bot 1',
      category: 'speed',
      icon: 'fa-solid fa-gauge-high',
      description: 'Over/Under prediction bot with high accuracy',
      fullDescription: 'Specialized bot for Over/Under markets. Uses historical data and pattern recognition to predict whether the next tick will be over or under the threshold.',
      winRate: 75,
      profit: 142,
      users: 1567,
      avgReturn: 11.8,
      version: '3.1.2',
      tags: ['Over/Under', 'Prediction', 'Tick Analysis'],
      features: ['Over/Under prediction', 'Pattern recognition', 'Confidence scoring', 'Auto-stake management'],
      parameters: [
        { name: 'Base Stake', value: '8 AUD' },
        { name: 'Threshold', value: '0.5%' },
        { name: 'Confidence Level', value: '75%' },
        { name: 'Max Loss', value: '50 AUD' }
      ],
      metrics: [
        { name: 'Success Rate', value: '75%', percentage: 75 },
        { name: 'Profit Factor', value: '1.72', percentage: 78 },
        { name: 'Sharpe Ratio', value: '1.35', percentage: 68 },
        { name: 'Drawdown', value: '15%', percentage: 35 }
      ],
      howItWorks: [
        { title: 'Threshold Analysis', description: 'Determines optimal over/under threshold' },
        { title: 'Pattern Matching', description: 'Matches current patterns with historical data' },
        { title: 'Prediction Execution', description: 'Executes trades based on confidence score' }
      ],
      chartData: [100, 103, 101, 106, 110, 108, 112, 115, 118, 120, 125, 128],
      basePrice: 100,
      botConfig: {
        market: 'Derived > Continuous Indices > Volatility 100 (1s) Index',
        tradeType: 'Digits > Over/Under',
        contractType: 'Both',
        duration: 1,
        stake: 8,
        purchaseCondition: 'Over'
      }
    },
    {
      id: 4,
      name: 'Goldpips Bot Adanced',
      category: 'ai',
      icon: 'fa-solid fa-gem',
      description: 'AI-powered gold mining bot for consistent profits',
      fullDescription: 'Advanced AI bot that uses machine learning to identify high-probability trading opportunities. Features include adaptive learning and strategy evolution based on market conditions.',
      winRate: 85,
      profit: 210,
      users: 3200,
      avgReturn: 18.3,
      version: '1.5.0',
      tags: ['AI', 'Machine Learning', 'Gold Mining'],
      features: ['ML prediction engine', 'Adaptive strategy', 'Risk management AI', 'Performance analytics'],
      parameters: [
        { name: 'Base Stake', value: '20 AUD' },
        { name: 'AI Confidence', value: '85%' },
        { name: 'Learning Rate', value: '0.01' },
        { name: 'Max Positions', value: '3' }
      ],
      metrics: [
        { name: 'Success Rate', value: '85%', percentage: 85 },
        { name: 'Profit Factor', value: '2.35', percentage: 95 },
        { name: 'Sharpe Ratio', value: '1.95', percentage: 85 },
        { name: 'Drawdown', value: '6%', percentage: 20 }
      ],
      howItWorks: [
        { title: 'Data Collection', description: 'Gathers market data for ML training' },
        { title: 'AI Prediction', description: 'ML model predicts optimal trades' },
        { title: 'Automated Trading', description: 'Executes trades with AI oversight' }
      ],
      chartData: [100, 105, 110, 108, 115, 120, 125, 130, 128, 135, 140, 145],
      basePrice: 100,
      botConfig: {
        market: 'Derived > Continuous Indices > Volatility 100 (1s) Index',
        tradeType: 'Up/Down > Rise/Fall',
        contractType: 'Both',
        duration: 1,
        stake: 20,
        purchaseCondition: 'Rise'
      }
    },
    {
      id: 5,
      name: 'TradeWise smart signal',
      category: 'ai',
      icon: 'fa-solid fa-brain',
      description: 'AI bot specialized for under 9 tick predictions',
      fullDescription: 'Specialized AI bot focused on predicting under 9 tick outcomes. Uses neural networks trained on millions of historical ticks for superior accuracy.',
      winRate: 79,
      profit: 168,
      users: 2100,
      avgReturn: 13.7,
      version: '2.23.4',
      tags: ['AI', 'Neural Network', 'Under 9'],
      features: ['Neural network prediction', 'Tick pattern recognition', 'Real-time learning', 'Confidence filtering'],
      parameters: [
        { name: 'Base Stake', value: '12 AUD' },
        { name: 'Neural Layers', value: '4' },
        { name: 'Training Epochs', value: '1000' },
        { name: 'Prediction Threshold', value: '0.8' }
      ],
      metrics: [
        { name: 'Success Rate', value: '79%', percentage: 79 },
        { name: 'Profit Factor', value: '1.92', percentage: 82 },
        { name: 'Sharpe Ratio', value: '1.55', percentage: 72 },
        { name: 'Drawdown', value: '10%', percentage: 28 }
      ],
      howItWorks: [
        { title: 'Neural Analysis', description: 'Processes tick data through neural network' },
        { title: 'Pattern Detection', description: 'Identifies under 9 patterns' },
        { title: 'Smart Execution', description: 'Executes trades with high confidence' }
      ],
      chartData: [100, 102, 98, 105, 110, 108, 112, 115, 118, 120, 122, 125],
      basePrice: 100,
      botConfig: {
        market: 'Derived > Continuous Indices > Volatility 100 (1s) Index',
        tradeType: 'Digits > Matches/Differs',
        contractType: 'Both',
        duration: 1,
        stake: 12,
        purchaseCondition: 'Matches'
      }
    }
  ];

  filteredBots: Bot[] = [];

  constructor(private router: Router) {
    this.filteredBots = this.bots;
  }

  ngOnInit() {
    this.generateRealTimeData();
  }

  ngAfterViewInit() {
    this.startChartAnimation();
  }

  ngOnDestroy() {
    if (this.chartInterval) clearInterval(this.chartInterval);
  }

  generateRealTimeData() {
    let price = 100;
    for (let i = 0; i < 60; i++) {
      const change = (Math.random() - 0.5) * 2;
      price += change;
      this.chartDataPoints.push(price);
      const date = new Date();
      date.setSeconds(date.getSeconds() - (60 - i) * 10);
      this.chartLabels.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    this.currentChartPrice = this.chartDataPoints[this.chartDataPoints.length - 1];
  }

  startChartAnimation() {
    this.chartInterval = setInterval(() => {
      if (!this.selectedBot) return;
      
      this.priceTrend += (Math.random() - 0.5) * 0.3;
      this.priceTrend *= 0.95;
      const change = this.priceTrend + (Math.random() - 0.5) * 1.2;
      
      const oldPrice = this.currentChartPrice;
      this.currentChartPrice += change;
      if (this.currentChartPrice < 80) this.currentChartPrice = 80;
      if (this.currentChartPrice > 200) this.currentChartPrice = 200;
      
      this.chartPriceChange = this.currentChartPrice - oldPrice;
      this.chartPriceChangePercent = (this.chartPriceChange / oldPrice) * 100;
      
      this.chartDataPoints.push(this.currentChartPrice);
      if (this.chartDataPoints.length > 60) this.chartDataPoints.shift();
      
      const newTime = new Date();
      this.chartLabels.push(newTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (this.chartLabels.length > 60) this.chartLabels.shift();
      
      this.drawLiveChart();
    }, 2000);
  }

  drawLiveChart() {
    if (!this.selectedBot || !this.botChartCanvas?.nativeElement) return;

    const canvas = this.botChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      this.canvasWidth = canvas.width;
      this.canvasHeight = canvas.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const padding = { left: 50, right: 20, top: 30, bottom: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const step = chartWidth / (this.chartDataPoints.length - 1);

    const minValue = Math.min(...this.chartDataPoints);
    const maxValue = Math.max(...this.chartDataPoints);
    const range = maxValue - minValue || 1;

    // Draw vertical grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= 8; i++) {
      const x = padding.left + (i * chartWidth / 8);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
      
      if (i < this.chartLabels.length) {
        const labelIndex = Math.floor(i * this.chartLabels.length / 8);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '8px monospace';
        ctx.fillText(this.chartLabels[labelIndex]?.substring(0, 5) || '', x - 15, height - 10);
      }
    }

    // Draw horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      const price = minValue + (range * (1 - i / 5));
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '9px monospace';
      ctx.fillText(price.toFixed(2), 5, y + 3);
      
      if (Math.abs(price - this.currentChartPrice) < range / 10) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 0.5;
      }
    }

    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    const isPositive = this.chartPriceChange >= 0;
    gradient.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

    ctx.beginPath();
    for (let i = 0; i < this.chartDataPoints.length; i++) {
      const x = padding.left + i * step;
      const y = padding.top + chartHeight * (1 - (this.chartDataPoints[i] - minValue) / range);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(width - padding.right, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    for (let i = 0; i < this.chartDataPoints.length; i++) {
      const x = padding.left + i * step;
      const y = padding.top + chartHeight * (1 - (this.chartDataPoints[i] - minValue) / range);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = this.chartPriceChange >= 0 ? '#10B981' : '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw points
    for (let i = 0; i < this.chartDataPoints.length; i += 4) {
      const x = padding.left + i * step;
      const y = padding.top + chartHeight * (1 - (this.chartDataPoints[i] - minValue) / range);
      ctx.fillStyle = this.chartPriceChange >= 0 ? '#10B981' : '#EF4444';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.chartPriceChange >= 0 ? '#10B981' : '#EF4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw last point
    const lastX = padding.left + (this.chartDataPoints.length - 1) * step;
    const lastY = padding.top + chartHeight * (1 - (this.chartDataPoints[this.chartDataPoints.length - 1] - minValue) / range);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = this.chartPriceChange >= 0 ? '#10B981' : '#EF4444';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  filterBots() {
    this.filteredBots = this.bots.filter(bot => {
      const matchesSearch = bot.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           bot.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.selectedCategory === 'all' || bot.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  filterCategory(category: string) {
    this.selectedCategory = category;
    this.filterBots();
  }

  openBotModal(bot: Bot) {
    // Store the selected bot configuration in localStorage
    // Use bot.botConfig instead of trying to access bot.stake directly
    localStorage.setItem('selectedBotConfig', JSON.stringify(bot.botConfig || {
      market: 'Derived > Continuous Indices > Volatility 100 (1s) Index',
      tradeType: 'Up/Down > Rise/Fall',
      contractType: 'Both',
      duration: 1,
      stake: 10, // Default stake if no config exists
      purchaseCondition: 'Rise'
    }));
    localStorage.setItem('selectedBotName', bot.name);
    
    // Navigate to bot-builder
    this.router.navigate(['/bot-builder']);
  }

  closeModal(event?: MouseEvent) {
    if (!event || event.target === event.currentTarget) {
      this.selectedBot = null;
      this.chartTimeframe = '1D';
    }
  }

  setChartTimeframe(timeframe: string) {
    this.chartTimeframe = timeframe;
  }

  showNotification(message: string, type: 'success' | 'error' | 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } transition-opacity duration-300`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}
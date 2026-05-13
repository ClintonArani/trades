import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Market {
  name: string;
  symbol: string;
  change: number;
  price: number;
  volatility: number;
  category: string;
}

interface Candlestick {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HoverData {
  x: number;
  y: number;
  price: number;
  time: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

@Component({
  selector: 'app-fx-charts',
  imports: [CommonModule, FormsModule],
  templateUrl: './fx-charts.html',
  styleUrl: './fx-charts.css',
})
export class FxCharts implements AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart Data
  currentPrice: number = 1428.67;
  priceChange: number = -0.06;
  priceChangePercent: number = 0.00;
  chartType: string = 'line';
  showMarketDropdown: boolean = false;
  showTradingView: boolean = false;
  showFibonacci: boolean = false;
  showGrid: boolean = true;
  activeDrawingTool: string = 'cursor';
  zoomLevel: number = 1;
  
  // Drawing data
  private drawings: any[] = [];
  private isDrawing: boolean = false;
  private drawingStart: { x: number; y: number; price: number } | null = null;
  fibLevels: number[] = [];
  
  // Hover data
  hoverData: HoverData | null = null;
  
  // Market data
  selectedCategory: string = 'Derived';
  selectedMarket: Market = {
    name: 'Volatility 100 (1s) Index',
    symbol: 'VOL100',
    change: 0.00,
    price: 1428.67,
    volatility: 100,
    category: 'Derived'
  };
  
  marketCategories = [
    { name: 'Derived', icon: 'fa-solid fa-chart-line' },
    { name: 'Forex', icon: 'fa-solid fa-dollar-sign' },
    { name: 'Stock Indices', icon: 'fa-solid fa-building' },
    { name: 'Cryptocurrencies', icon: 'fa-brands fa-bitcoin' },
    { name: 'Commodities', icon: 'fa-solid fa-cubes' }
  ];
  
  markets: Market[] = [
    // Derived Indices
    { name: 'Volatility 10 (1s) Index', symbol: 'VOL10', change: 0.12, price: 1250.50, volatility: 10, category: 'Derived' },
    { name: 'Volatility 10 Index', symbol: 'VOL10', change: -0.08, price: 1248.30, volatility: 10, category: 'Derived' },
    { name: 'Volatility 15 (1s) Index', symbol: 'VOL15', change: 0.23, price: 1350.70, volatility: 15, category: 'Derived' },
    { name: 'Volatility 25 (1s) Index', symbol: 'VOL25', change: -0.15, price: 1425.99, volatility: 25, category: 'Derived' },
    { name: 'Volatility 25 Index', symbol: 'VOL25', change: 0.05, price: 1430.20, volatility: 25, category: 'Derived' },
    { name: 'Volatility 30 (1s) Index', symbol: 'VOL30', change: 0.18, price: 1520.40, volatility: 30, category: 'Derived' },
    { name: 'Volatility 50 (1s) Index', symbol: 'VOL50', change: -0.22, price: 1650.80, volatility: 50, category: 'Derived' },
    { name: 'Volatility 50 Index', symbol: 'VOL50', change: 0.08, price: 1660.30, volatility: 50, category: 'Derived' },
    { name: 'Volatility 75 (1s) Index', symbol: 'VOL75', change: 0.31, price: 1820.60, volatility: 75, category: 'Derived' },
    { name: 'Volatility 75 Index', symbol: 'VOL75', change: -0.14, price: 1815.20, volatility: 75, category: 'Derived' },
    { name: 'Volatility 100 (1s) Index', symbol: 'VOL100', change: 0.00, price: 1428.67, volatility: 100, category: 'Derived' },
    // Forex
    { name: 'EUR/USD', symbol: 'EURUSD', change: 0.08, price: 1.0925, volatility: 5, category: 'Forex' },
    { name: 'GBP/USD', symbol: 'GBPUSD', change: -0.12, price: 1.2850, volatility: 6, category: 'Forex' },
    // Stock Indices
    { name: 'S&P 500', symbol: 'SPX', change: 0.45, price: 4850.20, volatility: 15, category: 'Stock Indices' },
    { name: 'NASDAQ', symbol: 'NAS', change: 0.67, price: 16850.40, volatility: 18, category: 'Stock Indices' },
    // Cryptocurrencies
    { name: 'Bitcoin', symbol: 'BTC', change: -1.23, price: 42500.00, volatility: 35, category: 'Cryptocurrencies' },
    { name: 'Ethereum', symbol: 'ETH', change: 0.85, price: 2850.00, volatility: 30, category: 'Cryptocurrencies' },
    // Commodities
    { name: 'Gold', symbol: 'XAUUSD', change: 0.23, price: 2050.00, volatility: 12, category: 'Commodities' },
    { name: 'Silver', symbol: 'XAGUSD', change: -0.08, price: 24.50, volatility: 14, category: 'Commodities' }
  ];
  
  filteredMarkets: Market[] = [];
  
  // Chart data
  private chartDataPoints: number[] = [];
  private chartLabels: string[] = [];
  private candlestickData: Candlestick[] = [];
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private chartInterval: any;
  private priceTrend: number = 0;
  private timeLabels: string[] = [];
  
  constructor() {
    this.filteredMarkets = this.markets.filter(m => m.category === this.selectedCategory);
    this.generateInitialData();
  }
  
  ngAfterViewInit() {
    this.startLiveChart();
    this.drawChart();
  }
  
  ngOnDestroy() {
    if (this.chartInterval) clearInterval(this.chartInterval);
  }
  
  generateInitialData() {
    // Generate line chart data
    let price = this.selectedMarket.price;
    for (let i = 0; i < 80; i++) {
      const change = (Math.random() - 0.5) * this.selectedMarket.volatility / 20;
      price += change;
      this.chartDataPoints.push(Math.max(100, price));
      const date = new Date();
      date.setSeconds(date.getSeconds() - (80 - i) * 5);
      this.chartLabels.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    this.currentPrice = this.chartDataPoints[this.chartDataPoints.length - 1];
    
    // Generate candlestick data
    let basePrice = this.selectedMarket.price;
    for (let i = 0; i < 60; i++) {
      const open = basePrice;
      const change = (Math.random() - 0.5) * this.selectedMarket.volatility / 15;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * this.selectedMarket.volatility / 10;
      const low = Math.min(open, close) - Math.random() * this.selectedMarket.volatility / 10;
      
      this.candlestickData.push({
        time: new Date(Date.now() - (60 - i) * 60000),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 10000) + 5000
      });
      basePrice = close;
    }
  }
  
  startLiveChart() {
    this.chartInterval = setInterval(() => {
      // Simulate market movement based on volatility
      this.priceTrend += (Math.random() - 0.5) * this.selectedMarket.volatility / 100;
      this.priceTrend *= 0.95;
      const change = this.priceTrend + (Math.random() - 0.5) * this.selectedMarket.volatility / 50;
      
      const oldPrice = this.currentPrice;
      this.currentPrice += change;
      if (this.currentPrice < 100) this.currentPrice = 100;
      if (this.currentPrice > 10000) this.currentPrice = 10000;
      
      this.priceChange = this.currentPrice - oldPrice;
      this.priceChangePercent = (this.priceChange / oldPrice) * 100;
      
      if (this.chartType === 'line') {
        this.chartDataPoints.push(this.currentPrice);
        if (this.chartDataPoints.length > 80) this.chartDataPoints.shift();
        
        const newTime = new Date();
        this.chartLabels.push(newTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (this.chartLabels.length > 80) this.chartLabels.shift();
      } else {
        // Add new candlestick every 5 seconds
        const lastCandle = this.candlestickData[this.candlestickData.length - 1];
        if (lastCandle) {
          const newClose = lastCandle.close + change;
          const newOpen = lastCandle.close;
          const newHigh = Math.max(newOpen, newClose) + Math.random() * this.selectedMarket.volatility / 15;
          const newLow = Math.min(newOpen, newClose) - Math.random() * this.selectedMarket.volatility / 15;
          
          this.candlestickData.push({
            time: new Date(),
            open: Number(newOpen.toFixed(2)),
            high: Number(newHigh.toFixed(2)),
            low: Number(newLow.toFixed(2)),
            close: Number(newClose.toFixed(2)),
            volume: Math.floor(Math.random() * 10000) + 5000
          });
          if (this.candlestickData.length > 60) this.candlestickData.shift();
        }
      }
      
      this.drawChart();
    }, 2000);
  }
  
  drawChart() {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      this.canvasWidth = canvas.width;
      this.canvasHeight = canvas.height;
    }
    
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const padding = { left: 60, right: 30, top: 40, bottom: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    if (this.chartType === 'line') {
      this.drawLineChart(ctx, padding, chartWidth, chartHeight);
    } else {
      this.drawCandlestickChart(ctx, padding, chartWidth, chartHeight);
    }
    
    // Draw drawings
    this.drawings.forEach(drawing => {
      ctx.beginPath();
      ctx.moveTo(drawing.startX, drawing.startY);
      ctx.lineTo(drawing.endX, drawing.endY);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      if (drawing.type === 'horizontal') {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px monospace';
        ctx.fillText(drawing.price?.toFixed(2) || '', drawing.endX + 5, drawing.endY - 2);
      }
    });
    
    // Draw Fibonacci levels
    if (this.showFibonacci && this.fibLevels.length > 0) {
      this.drawFibonacci(ctx, padding, chartWidth, chartHeight);
    }
  }
  
  drawLineChart(ctx: CanvasRenderingContext2D, padding: any, chartWidth: number, chartHeight: number) {
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const step = chartWidth / (this.chartDataPoints.length - 1);
    
    const minValue = Math.min(...this.chartDataPoints);
    const maxValue = Math.max(...this.chartDataPoints);
    const range = maxValue - minValue || 1;
    
    // Draw grid (squares)
    if (this.showGrid) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 0.5;
      
      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding.left + (i * chartWidth / 10);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
        
        if (i < this.chartLabels.length) {
          const labelIndex = Math.floor(i * this.chartLabels.length / 10);
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '8px monospace';
          ctx.fillText(this.chartLabels[labelIndex]?.substring(0, 5) || '', x - 15, height - 15);
        }
      }
      
      // Horizontal grid lines
      for (let i = 0; i <= 8; i++) {
        const y = padding.top + (i * chartHeight / 8);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        const price = minValue + (range * (1 - i / 8));
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '9px monospace';
        ctx.fillText(price.toFixed(2), 5, y + 3);
      }
    }
    
    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    const isPositive = this.priceChange >= 0;
    gradient.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    
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
    ctx.strokeStyle = this.priceChange >= 0 ? '#10B981' : '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Draw points
    for (let i = 0; i < this.chartDataPoints.length; i += 5) {
      const x = padding.left + i * step;
      const y = padding.top + chartHeight * (1 - (this.chartDataPoints[i] - minValue) / range);
      ctx.fillStyle = this.priceChange >= 0 ? '#10B981' : '#EF4444';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.priceChange >= 0 ? '#10B981' : '#EF4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Draw last point
    const lastX = padding.left + (this.chartDataPoints.length - 1) * step;
    const lastY = padding.top + chartHeight * (1 - (this.chartDataPoints[this.chartDataPoints.length - 1] - minValue) / range);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = this.priceChange >= 0 ? '#10B981' : '#EF4444';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  drawCandlestickChart(ctx: CanvasRenderingContext2D, padding: any, chartWidth: number, chartHeight: number) {
    if (this.candlestickData.length === 0) return;
    
    const allPrices = this.candlestickData.flatMap(c => [c.high, c.low]);
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice || 1;
    
    const totalCandles = this.candlestickData.length;
    const candleWidth = Math.min(8, chartWidth / totalCandles - 2);
    const spacing = Math.max(1, (chartWidth / totalCandles) - candleWidth);
    
    // Draw grid
    if (this.showGrid) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i <= 8; i++) {
        const x = padding.left + i * (chartWidth / 8);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
      }
      
      for (let i = 0; i <= 8; i++) {
        const y = padding.top + i * (chartHeight / 8);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(this.canvasWidth - padding.right, y);
        ctx.stroke();
        
        const price = maxPrice - (i / 8) * priceRange;
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '9px monospace';
        ctx.fillText(price.toFixed(2), 5, y + 3);
      }
    }
    
    // Draw candlesticks
    for (let i = 0; i < totalCandles; i++) {
      const candle = this.candlestickData[i];
      const x = padding.left + i * (candleWidth + spacing);
      const isBullish = candle.close >= candle.open;
      
      const openY = padding.top + chartHeight * (1 - (candle.open - minPrice) / priceRange);
      const closeY = padding.top + chartHeight * (1 - (candle.close - minPrice) / priceRange);
      const highY = padding.top + chartHeight * (1 - (candle.high - minPrice) / priceRange);
      const lowY = padding.top + chartHeight * (1 - (candle.low - minPrice) / priceRange);
      
      // Draw wick
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      
      ctx.fillStyle = isBullish ? '#26a69a' : '#ef5350';
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      ctx.strokeStyle = isBullish ? '#26a69a' : '#ef5350';
      ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);
    }
  }
  
  drawFibonacci(ctx: CanvasRenderingContext2D, padding: any, chartWidth: number, chartHeight: number) {
    if (this.fibLevels.length < 2) return;
    
    const minPrice = Math.min(...this.fibLevels);
    const maxPrice = Math.max(...this.fibLevels);
    const range = maxPrice - minPrice;
    const fibRatio = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    
    for (let ratio of fibRatio) {
      const price = maxPrice - ratio * range;
      const y = padding.top + chartHeight * (1 - (price - minPrice) / range);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(this.canvasWidth - padding.right, y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#f59e0b';
      ctx.font = '8px monospace';
      ctx.fillText(`${(ratio * 100).toFixed(1)}% - ${price.toFixed(2)}`, this.canvasWidth - padding.right - 50, y - 2);
    }
  }
  
  onChartHover(event: MouseEvent) {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (this.chartType === 'line') {
      const padding = 60;
      const chartWidth = canvas.width - 90;
      const step = chartWidth / (this.chartDataPoints.length - 1);
      const dataIndex = Math.floor((x * scaleX - padding) / step);
      
      if (dataIndex >= 0 && dataIndex < this.chartDataPoints.length) {
        this.hoverData = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          price: this.chartDataPoints[dataIndex],
          time: this.chartLabels[dataIndex] || '',
          volume: Math.floor(Math.random() * 10000)
        };
      }
    } else {
      const padding = 60;
      const chartWidth = canvas.width - 90;
      const totalCandles = this.candlestickData.length;
      const candleWidth = Math.min(8, chartWidth / totalCandles - 2);
      const spacing = Math.max(1, (chartWidth / totalCandles) - candleWidth);
      
      const candleIndex = Math.floor((x * scaleX - padding) / (candleWidth + spacing));
      
      if (candleIndex >= 0 && candleIndex < totalCandles) {
        const candle = this.candlestickData[candleIndex];
        this.hoverData = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          price: candle.close,
          time: candle.time.toLocaleTimeString(),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        };
      } else {
        this.hoverData = null;
      }
    }
  }
  
  onChartClick(event: MouseEvent) {
    if (this.activeDrawingTool === 'cursor') return;
    
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    if (!this.isDrawing) {
      this.isDrawing = true;
      this.drawingStart = { x, y, price: this.getPriceAtY(y) };
    } else {
      this.drawings.push({
        type: this.activeDrawingTool,
        startX: this.drawingStart!.x,
        startY: this.drawingStart!.y,
        endX: x,
        endY: y,
        price: this.getPriceAtY(y)
      });
      this.isDrawing = false;
      this.drawingStart = null;
      this.drawChart();
    }
  }
  
  getPriceAtY(y: number): number {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return 0;
    
    const allPrices = this.chartType === 'line' 
      ? this.chartDataPoints 
      : this.candlestickData.flatMap(c => [c.high, c.low]);
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice;
    const padding = { top: 40, bottom: 50 };
    const chartHeight = canvas.height - padding.top - padding.bottom;
    
    return maxPrice - ((y - padding.top) / chartHeight) * priceRange;
  }
  
  toggleMarketDropdown() {
    this.showMarketDropdown = !this.showMarketDropdown;
  }
  
  selectMarketCategory(category: any) {
    this.selectedCategory = category.name;
    this.filteredMarkets = this.markets.filter(m => m.category === this.selectedCategory);
  }
  
  selectMarket(market: Market) {
    this.selectedMarket = market;
    this.currentPrice = market.price;
    this.showMarketDropdown = false;
    
    // Reset chart data
    this.chartDataPoints = [];
    this.candlestickData = [];
    let price = market.price;
    for (let i = 0; i < 80; i++) {
      const change = (Math.random() - 0.5) * market.volatility / 20;
      price += change;
      this.chartDataPoints.push(Math.max(100, price));
    }
    this.currentPrice = this.chartDataPoints[this.chartDataPoints.length - 1];
    
    let basePrice = market.price;
    for (let i = 0; i < 60; i++) {
      const open = basePrice;
      const change = (Math.random() - 0.5) * market.volatility / 15;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * market.volatility / 10;
      const low = Math.min(open, close) - Math.random() * market.volatility / 10;
      this.candlestickData.push({
        time: new Date(Date.now() - (60 - i) * 60000),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 10000) + 5000
      });
      basePrice = close;
    }
    
    this.drawChart();
  }
  
  setChartType(type: string) {
    this.chartType = type;
    this.drawChart();
  }
  
  toggleDrawingTool(tool: string) {
    this.activeDrawingTool = this.activeDrawingTool === tool ? 'cursor' : tool;
    this.isDrawing = false;
    this.drawingStart = null;
  }
  
  addFibonacci() {
    this.showFibonacci = !this.showFibonacci;
    if (this.showFibonacci) {
      const allPrices = this.chartType === 'line' 
        ? this.chartDataPoints 
        : this.candlestickData.flatMap(c => [c.high, c.low]);
      this.fibLevels = [Math.min(...allPrices), Math.max(...allPrices)];
    }
    this.drawChart();
  }
  
  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.drawChart();
  }
  
  toggleTradingView() {
    this.showTradingView = !this.showTradingView;
    if (this.showTradingView) {
      this.chartType = 'candlestick';
    } else {
      this.chartType = 'line';
    }
    this.drawChart();
  }
  
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.2, 2);
    this.drawChart();
  }
  
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.2, 0.5);
    this.drawChart();
  }
  
  resetChart() {
    this.zoomLevel = 1;
    this.activeDrawingTool = 'cursor';
    this.showFibonacci = false;
    this.drawings = [];
    this.drawChart();
  }
}
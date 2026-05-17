import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Dashboard } from './components/dashboard/dashboard';
import { BotBuilder } from './components/bot-builder/bot-builder';
import { MarketAnalyzer } from './components/market-analyzer/market-analyzer';
import { FreeBots } from './components/free-bots/free-bots';
import { Charts } from './components/charts/charts';
import { FrequencyAnalysis } from './components/frequency-analysis/frequency-analysis'; // Placeholder for Frequency Analysi
import {DigitalTool} from "./components/digital-tool/digital-tool"; // Placeholder for Digital Tool
import { AnalysisTool } from './components/analysis-tool/analysis-tool';
import { FxCharts } from './components/fx-charts/fx-charts'; 
import { AuthError } from './components/auth-error/auth-error'; // Placeholder for Auth Error

export const routes: Routes = [
  {
    path: '',
    component: Home,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'bot-builder', component: BotBuilder },
      { path: 'analysis-tool', component: AnalysisTool },
      { path: 'market-analyzer', component: MarketAnalyzer },
      { path: 'free-bots' , component: FreeBots },
      { path: 'charts', component: Charts},
      { path: 'market-analyzer', component: MarketAnalyzer },
      { path: 'frequency-analysis', component: FrequencyAnalysis },
      { path: 'digital-tool', component: DigitalTool }, 
      { path: 'fx-charts', component: FxCharts },
      { path: 'auth-error', component: AuthError},
      // Optional default child route
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
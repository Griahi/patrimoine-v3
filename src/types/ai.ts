export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: ChartData | TableData;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: Record<string, unknown>[];
  config?: {
    xAxisKey?: string;
    yAxisKey?: string;
    title?: string;
    colors?: string[];
  };
}

export interface TableData {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface QueryIntent {
  type: 'performance' | 'comparison' | 'prediction' | 'tax' | 'alert' | 'general';
  entities: string[];
  timeframe?: { start: Date; end: Date };
  metrics?: string[];
  confidence: number;
}

export interface PatrimonyContext {
  totalValue: number;
  assets: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
    performance?: number;
  }>;
  entities: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  monthlyPerformance?: number;
  yearlyPerformance?: number;
  bankFees?: number;
  diversification?: {
    byAssetType: Record<string, number>;
    concentration: number;
  };
}

export interface ChatRequest {
  message: string;
  context?: PatrimonyContext;
}

export interface ChatResponse {
  text: string;
  data?: ChartData | TableData;
  suggestions?: string[];
} 
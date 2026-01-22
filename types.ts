export enum AppStep {
  UPLOAD = 'UPLOAD',
  ANALYSIS = 'ANALYSIS',
  SELECTION = 'SELECTION',
  CONFIGURATION = 'CONFIGURATION',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT_2_3 = '2:3',
  LANDSCAPE_3_2 = '3:2',
  PORTRAIT_3_4 = '3:4',
  LANDSCAPE_4_3 = '4:3',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE_16_9 = '16:9',
  CINEMATIC_21_9 = '21:9',
}

export interface AnalyzedElement {
  id: string;
  label: string;
  type: 'object' | 'text' | 'background' | 'person';
  selected: boolean;
}

export interface GeneratedImage {
  url: string; // Base64 data URL
  aspectRatio: AspectRatio;
  promptUsed: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  promptModifier: string;
}

export interface StockImage {
  id: string;
  url: string;
  description: string;
}

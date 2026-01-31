import React, { useState } from 'react';
import { Image as ImageIcon, Download, RefreshCw, Wand2, ArrowLeft, Plus, FileText } from 'lucide-react';
import { AppStep, AspectRatio, AnalyzedElement, GeneratedImage, Template } from './types';
import { analyzeImageContents, generateRecomposedImage, generateNewImage } from './services/geminiService';
import { convertPdfToImage, saveImageAsPdf } from './services/pdfService';
import { Button } from './components/Button';
import { FileUpload } from './components/FileUpload';
import { ElementSelector } from './components/ElementSelector';
import { TEMPLATES, STOCK_IMAGES, ASPECT_RATIO_OPTIONS } from './constants';

const App = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [analyzedElements, setAnalyzedElements] = useState<AnalyzedElement[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[1]);
  const [targetAspectRatio, setTargetAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE_16_9);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isNewCreationMode, setIsNewCreationMode] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let base64Image = "";

      if (file.type === 'application/pdf') {
        base64Image = await convertPdfToImage(file);
      } else {
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read image file."));
          reader.readAsDataURL(file);
        });
      }

      setOriginalImage(base64Image);
      setCurrentStep(AppStep.ANALYSIS);
      const elements = await analyzeImageContents(base64Image);
      setAnalyzedElements(elements);
      setCurrentStep(AppStep.SELECTION);

    } catch (err: any) {
      setError(err.message || "Failed to process file. Please try again.");
      setCurrentStep(AppStep.UPLOAD);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleElement = (id: string) => {
    setAnalyzedElements(prev => prev.map(el => 
      el.id === id ? { ...el, selected: !el.selected } : el
    ));
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isNewCreationMode) {
        const resultUrl = await generateNewImage(customPrompt, targetAspectRatio);
        setGeneratedImage({
            url: resultUrl,
            aspectRatio: targetAspectRatio,
            promptUsed: customPrompt
        });
      } else if (originalImage) {
        const resultUrl = await generateRecomposedImage(
            originalImage,
            analyzedElements,
            targetAspectRatio,
            selectedTemplate.promptModifier,
            customPrompt
        );
        setGeneratedImage({
            url: resultUrl,
            aspectRatio: targetAspectRatio,
            promptUsed: `Template: ${selectedTemplate.name}`
        });
      }
      setCurrentStep(AppStep.RESULT);
    } catch (err) {
      setError("Magic Server is currently busy or the composition was too complex. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (format: 'png' | 'jpeg') => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage.url;
    link.download = `nim-magic-output.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPdf = () => {
    if (!generatedImage) return;
    saveImageAsPdf(generatedImage.url, 'nim-magic-output.pdf');
  };

  const renderContent = () => {
    switch (currentStep) {
      case AppStep.UPLOAD:
        return (
           <div className="max-w-4xl mx-auto w-full">
            <FileUpload onFileSelect={handleFileSelect} />
            <div className="mt-8 text-center">
                <p className="text-gray-400 mb-4">Or use N.I.M's direct magic</p>
                <Button variant="secondary" onClick={() => {
                    setIsNewCreationMode(true);
                    setCurrentStep(AppStep.CONFIGURATION);
                }}>
                    <Plus size={18} /> Create New from Scratch
                </Button>
            </div>
           </div>
        );

      case AppStep.ANALYSIS:
        return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-16 h-16 border-4 border-tavern-gold border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Content</h2>
            <p className="text-gray-400">N.I.M is reading your file, identifying objects, and preparing for magic...</p>
          </div>
        );

      case AppStep.SELECTION:
        return (
          <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Magic Wand Selection</h2>
                    <p className="text-gray-400">Click elements to keep them in the new landscape</p>
                </div>
                <Button onClick={() => setCurrentStep(AppStep.CONFIGURATION)}>
                    Style Settings <ArrowLeft className="rotate-180 ml-2" size={18} />
                </Button>
            </div>
            {originalImage && (
              <ElementSelector 
                elements={analyzedElements} 
                onToggle={toggleElement} 
                imageUrl={originalImage}
              />
            )}
          </div>
        );

      case AppStep.CONFIGURATION:
        return (
          <div className="max-w-6xl mx-auto w-full">
             <div className="mb-8 flex justify-between items-center">
                <Button variant="ghost" onClick={() => {
                  if (isNewCreationMode) {
                    setIsNewCreationMode(false);
                    setCurrentStep(AppStep.UPLOAD);
                  } else {
                    setCurrentStep(AppStep.SELECTION);
                  }
                }}>
                    <ArrowLeft size={18} /> Back
                </Button>
                <h2 className="text-2xl font-bold text-white">
                    {isNewCreationMode ? 'Infinite Creation' : 'Magic Recomposition'}
                </h2>
                <div className="w-24"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <ImageIcon size={18} className="text-tavern-gold"/> Target Ratio
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            {ASPECT_RATIO_OPTIONS.map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => setTargetAspectRatio(ratio)}
                                    className={`
                                        py-2 px-3 rounded-lg text-sm font-medium border transition-all
                                        ${targetAspectRatio === ratio 
                                            ? 'bg-tavern-gold text-tavern-dark border-tavern-gold' 
                                            : 'bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600'}
                                    `}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!isNewCreationMode && (
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Wand2 size={18} className="text-tavern-gold"/> Environment Template
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {TEMPLATES.map(t => (
                                    <div 
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t)}
                                        className={`
                                            cursor-pointer p-3 rounded-lg border transition-all flex items-center gap-3
                                            ${selectedTemplate.id === t.id 
                                                ? 'bg-tavern-gold/20 border-tavern-gold' 
                                                : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'}
                                        `}
                                    >
                                        <div className="w-12 h-12 rounded bg-gray-600 overflow-hidden flex-shrink-0">
                                            <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-left">
                                            <div className={`font-semibold text-sm ${selectedTemplate.id === t.id ? 'text-tavern-gold' : 'text-gray-200'}`}>
                                                {t.name}
                                            </div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{t.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-tavern-gold"/> {isNewCreationMode ? 'Describe Vision' : 'Additional Magic'}
                        </h3>
                        <textarea
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-tavern-gold focus:ring-1 focus:ring-tavern-gold outline-none h-32"
                            placeholder={isNewCreationMode ? "Describe what you want to create..." : "Extra instructions for N.I.M (e.g., set the time to sunset)"}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                        />
                    </div>

                     <Button 
                        onClick={handleGenerate} 
                        isLoading={isLoading} 
                        className="w-full text-lg py-4"
                        disabled={isNewCreationMode && !customPrompt.trim()}
                    >
                        {isNewCreationMode ? 'Cast Magic' : 'Run Server Recomposition'}
                    </Button>
                </div>

                <div className="space-y-8">
                     <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">N.I.M's Inspiration</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {STOCK_IMAGES.map(stock => (
                                <img 
                                    key={stock.id} 
                                    src={stock.url} 
                                    alt={stock.description}
                                    className="rounded-lg hover:opacity-80 cursor-pointer transition-opacity border border-gray-700"
                                    onClick={() => setCustomPrompt(prev => prev + (prev ? " " : "") + `Style: ${stock.description}`)}
                                />
                            ))}
                        </div>
                     </div>
                </div>
            </div>
          </div>
        );

      case AppStep.RESULT:
        return (
          <div className="max-w-6xl mx-auto w-full flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
                <Button variant="ghost" onClick={() => setCurrentStep(AppStep.CONFIGURATION)}>
                    <ArrowLeft size={18} /> Adjust Composition
                </Button>
                <div className="flex gap-3">
                    <Button onClick={() => downloadImage('png')} variant="secondary">
                        <Download size={18} /> PNG
                    </Button>
                    <Button onClick={downloadPdf} variant="primary">
                        <FileText size={18} /> Export PDF
                    </Button>
                </div>
            </div>

            {generatedImage && (
                <div className="relative group w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                    <img 
                        src={generatedImage.url} 
                        alt="N.I.M Result" 
                        className="w-full h-auto object-contain max-h-[75vh]"
                    />
                </div>
            )}

            <div className="mt-8 flex gap-4">
                 <Button onClick={() => {
                     setCurrentStep(AppStep.UPLOAD);
                     setOriginalImage(null);
                     setAnalyzedElements([]);
                     setGeneratedImage(null);
                 }} variant="ghost">
                    <RefreshCw size={18} /> New Session
                 </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-tavern-dark text-gray-100 font-sans selection:bg-tavern-gold selection:text-tavern-dark">
      <header className="border-b border-gray-800 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-tavern-gold to-yellow-700 rounded-xl flex items-center justify-center text-tavern-dark font-black text-lg shadow-lg shadow-tavern-gold/20 border-2 border-white/10">
                NIM
            </div>
            <div>
                <h1 className="text-xl font-black text-white leading-none">N.I.M's</h1>
                <p className="text-[9px] text-tavern-gold uppercase tracking-[0.25em] font-bold mt-1">Image Magic Server</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-500">
             <span className={currentStep === AppStep.UPLOAD ? 'text-tavern-gold' : ''}>01 Source</span>
             <span className="w-6 h-px bg-gray-800"></span>
             <span className={currentStep === AppStep.SELECTION ? 'text-tavern-gold' : ''}>02 Wand</span>
             <span className="w-6 h-px bg-gray-800"></span>
             <span className={currentStep === AppStep.CONFIGURATION ? 'text-tavern-gold' : ''}>03 Cast</span>
             <span className="w-6 h-px bg-gray-800"></span>
             <span className={currentStep === AppStep.RESULT ? 'text-tavern-gold' : ''}>04 Result</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {error && (
            <div className="bg-red-950/40 border border-red-900/50 text-red-400 p-4 rounded-xl mb-10 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"></div>
                <p className="text-sm font-medium">{error}</p>
            </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
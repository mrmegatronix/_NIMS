import React from 'react';
import { AnalyzedElement } from '../types';
import { Check, Wand2, Type, User, Image as ImageIcon } from 'lucide-react';

interface ElementSelectorProps {
  elements: AnalyzedElement[];
  onToggle: (id: string) => void;
  imageUrl: string;
}

export const ElementSelector: React.FC<ElementSelectorProps> = ({ elements, onToggle, imageUrl }) => {
  
  const getIcon = (type: AnalyzedElement['type']) => {
    switch(type) {
      case 'person': return <User size={16} />;
      case 'text': return <Type size={16} />;
      case 'background': return <ImageIcon size={16} />;
      default: return <Wand2 size={16} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Image Preview - In a real app, we would use SVG overlays for masks */}
      <div className="flex-1 bg-black/50 rounded-xl p-4 flex items-center justify-center relative border border-gray-700">
        <img 
          src={imageUrl} 
          alt="Source" 
          className="max-h-[60vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="absolute top-6 right-6 bg-black/70 px-4 py-2 rounded-full text-sm font-medium border border-tavern-gold/50 text-tavern-gold flex items-center gap-2">
           <Wand2 size={16} /> Intelligent Analysis Active
        </div>
      </div>

      {/* Layers / Elements Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 h-full">
          <h3 className="text-xl font-bold mb-1 text-white">Detected Content</h3>
          <p className="text-gray-400 text-sm mb-6">Select the elements you want to keep in the final composition.</p>
          
          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {elements.map((el) => (
              <div 
                key={el.id}
                onClick={() => onToggle(el.id)}
                className={`
                  relative p-4 rounded-lg cursor-pointer border transition-all duration-200 group
                  ${el.selected 
                    ? 'bg-tavern-gold/20 border-tavern-gold shadow-[0_0_15px_rgba(197,160,89,0.15)]' 
                    : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${el.selected ? 'bg-tavern-gold text-tavern-dark' : 'bg-gray-600 text-gray-300'}`}>
                      {getIcon(el.type)}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${el.selected ? 'text-tavern-gold' : 'text-gray-300'}`}>
                        {el.label}
                      </h4>
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">{el.type}</span>
                    </div>
                  </div>
                  
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                    ${el.selected ? 'bg-tavern-gold border-tavern-gold' : 'border-gray-500 group-hover:border-gray-400'}
                  `}>
                    {el.selected && <Check size={14} className="text-tavern-dark" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700 text-xs text-gray-500">
             Tip: Backgrounds are often best deselected to allow the new template environment to take over.
          </div>
        </div>
      </div>
    </div>
  );
};

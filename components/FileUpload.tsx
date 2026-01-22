import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
        flex flex-col items-center justify-center min-h-[400px]
        ${isDragging ? 'border-tavern-gold bg-tavern-gold/10' : 'border-tavern-gold/30 hover:border-tavern-gold hover:bg-white/5'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        ref={inputRef}
        type="file" 
        accept="image/*,application/pdf" 
        className="hidden" 
        onChange={handleChange}
      />
      
      <div className="bg-tavern-gold/10 p-6 rounded-full mb-6">
        <Upload className="w-12 h-12 text-tavern-gold" />
      </div>
      
      <h3 className="text-2xl font-semibold mb-2 text-white">Upload Portrait Image or PDF</h3>
      <p className="text-gray-400 max-w-sm mb-6">
        Drag and drop your file here, or click to browse. 
        Best for photos or documents you want to convert to 1080p TV landscapes.
      </p>
      
      <div className="flex gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1"><ImageIcon size={14}/> JPG</span>
        <span className="flex items-center gap-1"><ImageIcon size={14}/> PNG</span>
        <span className="flex items-center gap-1"><FileText size={14}/> PDF</span>
      </div>
    </div>
  );
};

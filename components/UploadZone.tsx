import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, FileText } from 'lucide-react';
import Button from './Button';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    } else {
      alert("Please upload image files (JPG, PNG, WebP) or PDF documents.");
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer h-full min-h-[400px]
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        multiple
        accept="image/*,application/pdf"
      />
      
      <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-gray-700 group">
        <UploadCloud className={`w-10 h-10 transition-colors ${isDragging ? 'text-indigo-400' : 'text-gray-400 group-hover:text-white'}`} />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-3">Upload Documents</h3>
      <p className="text-gray-400 text-sm text-center max-w-sm mb-8 leading-relaxed">
        Drag & drop your slide deck or PDF here.
        <br/>
        We'll analyze it so you can chat with it.
        <br/>
        <span className="text-xs text-gray-500 mt-3 inline-block font-mono bg-gray-900/50 px-2 py-1 rounded">Supports PDF, JPG, PNG</span>
      </p>
      
      <div className="flex gap-3">
        <Button variant="primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          <FileText size={18} className="mr-2" />
          Select PDF / Images
        </Button>
      </div>
    </div>
  );
};

export default UploadZone;
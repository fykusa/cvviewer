import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileLoad: (xmlContent: string, fileName: string) => void;
  error?: string | null;
}

export default function FileUpload({ onFileLoad, error }: FileUploadProps) {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileLoad(content, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoad]
  );

  const handleExampleFile = async () => {
    try {
      const response = await fetch('/src/xml_example_minimal.calculationview');
      const content = await response.text();
      onFileLoad(content, 'xml_example_ZZP01_MAT.calculationview');
    } catch (err) {
      console.error('Failed to load example file:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              HANA Calculation View Viewer
            </h1>
            <p className="text-gray-600">
              Upload a .calculationview XML file to visualize the data flow
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm text-gray-500 mb-2">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">.calculationview XML files only</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".calculationview,.xml"
                onChange={handleFileChange}
              />
            </label>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or try an example</span>
              </div>
            </div>

            <button
              onClick={handleExampleFile}
              className="w-full px-4 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Load Example File
            </button>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { ImportService } from '../../services/import';
import { ImportResult } from '../../types';

interface FlashcardImportProps {
  onImportComplete: (result: ImportResult) => void;
}

export const FlashcardImport: React.FC<FlashcardImportProps> = ({ onImportComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!['json', 'csv'].includes(fileExtension || '')) {
      const errorResult: ImportResult = {
        success: false,
        imported_count: 0,
        errors: ['Please select a JSON or CSV file'],
        flashcards: [],
      };
      setImportResult(errorResult);
      onImportComplete(errorResult);
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      let result: ImportResult;

      if (fileExtension === 'json') {
        result = await ImportService.importFromJSON(file);
      } else {
        result = await ImportService.importFromCSV(file);
      }

      setImportResult(result);
      onImportComplete(result);
    } catch (error) {
      const errorResult: ImportResult = {
        success: false,
        imported_count: 0,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        flashcards: [],
      };
      setImportResult(errorResult);
      onImportComplete(errorResult);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const downloadTemplate = () => {
    ImportService.downloadCSVTemplate();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Import Flashcards</h2>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Drag and drop your file here</p>
          <p className="text-sm text-gray-500 mb-4">or click to select a file</p>

          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />

          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Select File'}
          </label>

          <p className="text-xs text-gray-500 mt-2">Supports JSON and CSV formats</p>
        </div>

        {/* Template Download */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Need a template?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Download our CSV template with sample data to get started quickly.
          </p>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </button>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className="mt-6">
            {importResult.success ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <h3 className="text-sm font-medium text-green-800">Import Successful!</h3>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Successfully imported {importResult.imported_count} flashcard(s).
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <h3 className="text-sm font-medium text-red-800">Import Issues</h3>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-red-700">
                    Imported {importResult.imported_count} flashcard(s) with{' '}
                    {importResult.errors.length} error(s):
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>... and {importResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Format Guide */}
        <div className="mt-6 text-xs text-gray-500">
          <h4 className="font-medium mb-2">Supported Formats:</h4>
          <ul className="space-y-1">
            <li>
              <strong>JSON:</strong> Array of flashcard objects with full schema support
            </li>
            <li>
              <strong>CSV:</strong> Simplified format with required columns (use template)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

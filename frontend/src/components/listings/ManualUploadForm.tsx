'use client';

import { useState } from 'react';
import { UploadCloudIcon, XIcon } from 'lucide-react';

interface ManualUploadFormProps {
  businessId: string;
  onUploadSuccess?: () => void;
}

interface PreviewRow {
  directory: string;
  name: string;
  url: string;
  phone?: string;
}

export default function ManualUploadForm({ businessId, onUploadSuccess }: ManualUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);

    // Parse CSV for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter((line) => line.trim());
        const rows = lines.slice(1); // Skip header

        const preview: PreviewRow[] = rows
          .slice(0, 5) // Show first 5 rows
          .map((row) => {
            const fields = parseCSVRow(row);
            return {
              directory: fields[0] || '',
              name: fields[1] || '',
              url: fields[2] || '',
              phone: fields[3],
            };
          });

        setPreview(preview);
      } catch (err: any) {
        setError('Failed to parse CSV: ' + err.message);
        setFile(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const parseCSVRow = (row: string): string[] => {
    const fields: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());

    return fields.map((f) => f.replace(/^"|"$/g, ''));
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Read file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      const response = await fetch(
        `/api/businesses/${businessId}/listings/manual/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ csvData: fileContent }),
        }
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'Upload failed');
      }

      setSuccess(true);
      setFile(null);
      setPreview([]);
      onUploadSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <UploadCloudIcon className="w-5 h-5" />
        Manual Directory Upload
      </h2>

      <div className="space-y-4">
        {/* CSV Template Info */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-medium text-blue-900 mb-2">CSV Format:</h3>
          <code className="text-xs bg-white p-2 rounded block overflow-x-auto text-gray-800">
            directory,name,url,phone,hours,description,photoUrls
          </code>
          <p className="text-xs text-blue-800 mt-2">
            Example: "Uber Eats","My Restaurant","https://...","+1-555-1234","9am-9pm","Great food",""
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
              disabled={uploading}
            />
            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                }}
                className="p-2 text-gray-500 hover:text-red-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows):</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left font-medium">Directory</th>
                    <th className="border p-2 text-left font-medium">Business Name</th>
                    <th className="border p-2 text-left font-medium">URL</th>
                    <th className="border p-2 text-left font-medium">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border p-2">
                        <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                          {row.directory}
                        </span>
                      </td>
                      <td className="border p-2">{row.name}</td>
                      <td className="border p-2">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {row.url.substring(0, 40)}...
                        </a>
                      </td>
                      <td className="border p-2 text-gray-600">{row.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : 'Upload Listings'}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm flex items-start gap-2">
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            ✓ Listings uploaded successfully!
          </div>
        )}
      </div>
    </div>
  );
}

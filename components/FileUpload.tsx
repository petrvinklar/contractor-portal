"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UploadedFile {
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onIsdocParsed?: (data: any) => void;
  onPdfParsed?: (data: any) => void;
}

export default function FileUpload({ onFilesUploaded, onIsdocParsed, onPdfParsed }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisSeconds, setAnalysisSeconds] = useState(0);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload selhal");
    }
    return res.json();
  };

  const parseIsdoc = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-isdoc", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Parsování ISDOC selhalo — vyplňte údaje ručně");
        // Fall back to PDF flow (full form) for manual entry
        onPdfParsed?.({});
        return;
      }
      const data = await res.json();
      onIsdocParsed?.(data);
    } catch {
      setError("Parsování ISDOC selhalo — vyplňte údaje ručně");
      onPdfParsed?.({});
    }
  };

  const parsePdf = async (file: File) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Analýza PDF selhala — vyplňte údaje ručně");
        // Still show the form for manual entry
        onPdfParsed?.({});
        return;
      }
      const data = await res.json();
      onPdfParsed?.(data);
    } catch {
      setError("Analýza PDF selhala — vyplňte údaje ručně");
      onPdfParsed?.({});
    } finally {
      setAnalyzing(false);
    }
  };

  // Timer for AI analysis countdown
  useEffect(() => {
    if (!analyzing) {
      setAnalysisSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setAnalysisSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [analyzing]);

  const estimatedSeconds = 30;

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setError("");
      setUploading(true);

      try {
        const newFiles: UploadedFile[] = [];
        for (const file of Array.from(fileList)) {
          const isXml = file.name.endsWith(".isdoc") || file.name.endsWith(".xml") || file.type.includes("xml");
          const isPdf = file.name.endsWith(".pdf") || file.type === "application/pdf";

          if (isXml && onIsdocParsed) {
            // ISDOC: parse then upload sequentially
            await parseIsdoc(file);
            const uploaded = await uploadFile(file);
            if (uploaded) newFiles.push(uploaded);
          } else if (isPdf && onPdfParsed) {
            // PDF: upload and OCR in parallel
            const [uploaded] = await Promise.all([
              uploadFile(file),
              parsePdf(file),
            ]);
            if (uploaded) newFiles.push(uploaded);
          } else {
            const uploaded = await uploadFile(file);
            if (uploaded) newFiles.push(uploaded);
          }
        }

        const all = [...files, ...newFiles];
        setFiles(all);
        onFilesUploaded(all);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, onFilesUploaded, onIsdocParsed, onPdfParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesUploaded(updated);
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="text-gray-500">
          {analyzing ? (
            <div>
              <p className="text-lg font-medium">Analyzuji PDF...</p>
              <p className="text-sm mt-1">Extrahuji údaje z faktury pomocí AI</p>
              <div className="mt-3 w-48 mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((analysisSeconds / estimatedSeconds) * 100, 95)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {analysisSeconds < estimatedSeconds
                    ? `~${estimatedSeconds - analysisSeconds}s`
                    : "Ještě chvíli..."}
                </p>
              </div>
            </div>
          ) : uploading ? (
            <p>Nahrávám...</p>
          ) : (
            <>
              <p className="text-lg font-medium">Přetáhněte soubory sem</p>
              <p className="text-sm mt-1">nebo klikněte pro výběr (PDF, ISDOC/XML, max 10 MB)</p>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
              <span>{f.file_name} ({(f.file_size / 1024).toFixed(0)} KB)</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-red-500 hover:text-red-700"
              >
                Odebrat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

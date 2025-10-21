
import React from 'react';

interface PdfPreviewProps {
    pdfUrl: string | null;
    isLoading: boolean;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ pdfUrl, isLoading }) => {
    return (
        <div className="flex flex-col h-full">
            <label className="text-sm font-medium text-gray-300 mb-2">PDF Preview & Download</label>
            <div className="flex-grow w-full h-full bg-gray-800 border-2 border-dashed border-gray-700 rounded-md flex items-center justify-center p-4 min-h-[400px]">
                {isLoading && (
                     <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-indigo-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-gray-400">Generating your PDF...</p>
                    </div>
                )}
                {!isLoading && pdfUrl && (
                    <div className="w-full h-full flex flex-col">
                        <iframe
                            src={pdfUrl}
                            title="PDF Preview"
                            className="w-full flex-grow rounded-md border border-gray-600"
                        />
                         <a
                            href={pdfUrl}
                            download="generated-document.pdf"
                            className="mt-4 text-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                        >
                            Download PDF
                        </a>
                    </div>
                )}
                {!isLoading && !pdfUrl && (
                    <div className="text-center text-gray-500">
                        <p>Your generated PDF will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfPreview;

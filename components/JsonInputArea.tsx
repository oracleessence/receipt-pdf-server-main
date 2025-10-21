
import React from 'react';
import { FileJsonIcon } from './icons/FileJsonIcon';

interface JsonInputAreaProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    error: string | null;
}

const JsonInputArea: React.FC<JsonInputAreaProps> = ({ value, onChange, error }) => {
    return (
        <div className="flex flex-col h-full">
            <label htmlFor="json-input" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                <FileJsonIcon className="h-5 w-5 mr-2 text-indigo-400" />
                JSON Input
            </label>
            <div className={`relative flex-grow rounded-md shadow-sm transition-all duration-200 ${error ? 'ring-2 ring-red-500' : 'focus-within:ring-2 focus-within:ring-indigo-500'}`}>
                <textarea
                    id="json-input"
                    name="json-input"
                    rows={20}
                    className="block w-full h-full p-4 bg-gray-800 border-gray-700 rounded-md resize-none font-mono text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-500"
                    placeholder='{ "example": "Paste your JSON here" }'
                    value={value}
                    onChange={onChange}
                    spellCheck="false"
                />
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-500" id="json-error">
                    {error}
                </p>
            )}
        </div>
    );
};

export default JsonInputArea;

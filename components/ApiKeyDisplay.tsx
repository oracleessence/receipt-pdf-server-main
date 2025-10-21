import React, { useState } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { KeyIcon } from './icons/KeyIcon';

interface ApiKeyDisplayProps {
    apiKey: string;
}

const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({ apiKey }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <section className="mt-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-100">
                <KeyIcon className="h-6 w-6 mr-3 text-yellow-400" />
                Your Generated API Key
            </h2>
            <p className="mt-2 text-gray-400">
                Use this key to secure your server. Add it to your <code className="text-xs bg-gray-900 p-1 rounded">.env</code> file.
            </p>
            <div className="mt-4 flex items-center space-x-2">
                <div className="flex-grow p-3 bg-gray-900 rounded-md text-sm text-yellow-300 font-mono select-all">
                    {apiKey}
                </div>
                <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
                >
                    <ClipboardIcon className="h-5 w-5 mr-2" />
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </section>
    );
};

export default ApiKeyDisplay;
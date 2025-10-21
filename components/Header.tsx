import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                JSON to Receipt PDF Generator
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-400">
                Craft a professional payment receipt from JSON. For direct integration, use the guide below to set up your own dedicated webhook server for automation.
            </p>
        </header>
    );
};

export default Header;
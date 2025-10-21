import React from 'react';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { MapIcon } from './icons/MapIcon';

interface Mapping {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    receiptNumber: string;
    date: string;
    customerName: string;
    customerAddress: string;
    customerEmail: string;
    paymentMethod: string;
    products: string;
    productsMap: {
        name: string;
        quantity: string;
        unitPrice: string;
    };
    tax: string;
    discount: string;
}

interface WebhookMapperProps {
    mapping: Mapping;
    setMapping: React.Dispatch<React.SetStateAction<Mapping>>;
}

const MappingInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, value, onChange }) => (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_2fr] gap-2 sm:gap-4 items-center">
        <label htmlFor={`map-${label}`} className="font-mono text-sm text-indigo-300 justify-self-start sm:justify-self-end">
            {label}
        </label>
        <ArrowRightIcon className="h-5 w-5 text-gray-500 hidden sm:block justify-self-center" />
        <input
            id={`map-${label}`}
            type="text"
            value={value}
            onChange={onChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. data.clientName"
        />
    </div>
);

const SectionHeader: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
    <div className="mt-8 border-t border-gray-700 pt-6">
        <h3 className="text-lg font-bold text-gray-200">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
    </div>
);

const WebhookMapper: React.FC<WebhookMapperProps> = ({ mapping, setMapping }) => {
    
    const handleMappingChange = (field: keyof Mapping, value: string) => {
        setMapping(prev => ({ ...prev, [field]: value }));
    };

    const handleProductMapChange = (field: keyof Mapping['productsMap'], value: string) => {
        setMapping(prev => ({
            ...prev,
            productsMap: {
                ...prev.productsMap,
                [field]: value
            }
        }));
    };

    return (
        <section className="mt-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-100">
                <MapIcon className="h-6 w-6 mr-3 text-indigo-400" />
                Webhook Field Mapper
            </h2>
            <p className="mt-2 text-gray-400">
                Connect your webhook's data fields to the PDF generator fields. Use dot notation for nested objects (e.g., <code className="text-xs bg-gray-900 p-1 rounded">customer.details.name</code>).
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_2fr] gap-2 sm:gap-4 items-center">
                <h3 className="font-semibold text-gray-300 justify-self-start sm:justify-self-end">PDF Field</h3>
                <div></div>
                <h3 className="font-semibold text-gray-300 justify-self-start">Your Webhook Field Key</h3>
            </div>
            
            <SectionHeader title="Company & Receipt Details" subtitle="Information about your business and the specific transaction." />
            <div className="mt-4 space-y-4">
                <MappingInput label="companyName" value={mapping.companyName} onChange={(e) => handleMappingChange('companyName', e.target.value)} />
                <MappingInput label="companyAddress" value={mapping.companyAddress} onChange={(e) => handleMappingChange('companyAddress', e.target.value)} />
                <MappingInput label="companyPhone" value={mapping.companyPhone} onChange={(e) => handleMappingChange('companyPhone', e.target.value)} />
                <MappingInput label="companyEmail" value={mapping.companyEmail} onChange={(e) => handleMappingChange('companyEmail', e.target.value)} />
                <MappingInput label="receiptNumber" value={mapping.receiptNumber} onChange={(e) => handleMappingChange('receiptNumber', e.target.value)} />
                <MappingInput label="date" value={mapping.date} onChange={(e) => handleMappingChange('date', e.target.value)} />
            </div>

            <SectionHeader title="Customer Details" subtitle="Information about the person or entity being billed." />
            <div className="mt-4 space-y-4">
                <MappingInput label="customerName" value={mapping.customerName} onChange={(e) => handleMappingChange('customerName', e.target.value)} />
                <MappingInput label="customerAddress" value={mapping.customerAddress} onChange={(e) => handleMappingChange('customerAddress', e.target.value)} />
                <MappingInput label="customerEmail" value={mapping.customerEmail} onChange={(e) => handleMappingChange('customerEmail', e.target.value)} />
                <MappingInput label="paymentMethod" value={mapping.paymentMethod} onChange={(e) => handleMappingChange('paymentMethod', e.target.value)} />
            </div>

            <SectionHeader title="Products Array Mapping" subtitle="Specify the keys for the array of products and the properties within each product object." />
            <div className="mt-4 space-y-4">
                 <MappingInput label="products" value={mapping.products} onChange={(e) => handleMappingChange('products', e.target.value)} />
                 <div className="pl-4 sm:pl-8 border-l-2 border-gray-700 space-y-4">
                    <MappingInput label="name" value={mapping.productsMap.name} onChange={(e) => handleProductMapChange('name', e.target.value)} />
                    <MappingInput label="quantity" value={mapping.productsMap.quantity} onChange={(e) => handleProductMapChange('quantity', e.target.value)} />
                    <MappingInput label="unitPrice" value={mapping.productsMap.unitPrice} onChange={(e) => handleProductMapChange('unitPrice', e.target.value)} />
                 </div>
            </div>
            
            <SectionHeader title="Totals Mapping (Optional)" subtitle="Specify keys for tax and discount amounts. Leave blank if not applicable." />
            <div className="mt-4 space-y-4">
                 <MappingInput label="tax" value={mapping.tax} onChange={(e) => handleMappingChange('tax', e.target.value)} />
                 <MappingInput label="discount" value={mapping.discount} onChange={(e) => handleMappingChange('discount', e.target.value)} />
            </div>
        </section>
    );
};

export default WebhookMapper;

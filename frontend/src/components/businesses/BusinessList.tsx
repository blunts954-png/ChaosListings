'use client';
import { useState } from 'react';
import { Business } from '@/lib/types';
import Link from 'next/link';

const mockBusinesses: Business[] = [
    { id: '1', name: 'Business A', address: '123 Main St', phone: '555-1234', website: 'a.com', gmbUrl: '', reviewUrl: '' },
    { id: '2', name: 'Business B', address: '456 Oak Ave', phone: '555-5678', website: 'b.com', gmbUrl: '', reviewUrl: '' },
    { id: '3', name: 'Business C', address: '789 Pine Ln', phone: '555-9012', website: 'c.com', gmbUrl: '', reviewUrl: '' },
];

export default function BusinessList() {
    const [businesses, setBusinesses] = useState<Business[]>(mockBusinesses);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBusinesses = businesses.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Businesses</h2>
                <Link href="/businesses/create" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Create Business
                </Link>
            </div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search businesses..."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Name</th>
                        <th className="py-2 px-4 border-b">Address</th>
                        <th className="py-2 px-4 border-b">Phone</th>
                        <th className="py-2 px-4 border-b">Status</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBusinesses.map(business => (
                        <tr key={business.id}>
                            <td className="py-2 px-4 border-b">{business.name}</td>
                            <td className="py-2 px-4 border-b">{business.address}</td>
                            <td className="py-2 px-4 border-b">{business.phone}</td>
                            <td className="py-2 px-4 border-b">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                </span>
                            </td>
                            <td className="py-2 px-4 border-b">
                                <Link href={`/businesses/${business.id}`} className="text-blue-600 hover:text-blue-900">
                                    View
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
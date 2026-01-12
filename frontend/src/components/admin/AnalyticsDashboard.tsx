"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', users: 400, businesses: 240, agencies: 120 },
  { name: 'Feb', users: 300, businesses: 139, agencies: 100 },
  { name: 'Mar', users: 200, businesses: 980, agencies: 200 },
  { name: 'Apr', users: 278, businesses: 390, agencies: 150 },
  { name: 'May', users: 189, businesses: 480, agencies: 80 },
  { name: 'Jun', users: 239, businesses: 380, agencies: 110 },
  { name: 'Jul', users: 349, businesses: 430, agencies: 180 },
];

export default function AnalyticsDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Analytics & Reports</h1>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Platform Growth</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#8884d8" />
                <Bar dataKey="businesses" fill="#82ca9d" />
                <Bar dataKey="agencies" fill="#ffc658" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

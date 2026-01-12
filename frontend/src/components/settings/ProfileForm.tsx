'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api';

export default function ProfileForm() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/auth/me', { name });
      setSuccess('Profile updated successfully.');
      // Ideally, we would update the user in the AuthContext here
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await api.patch('/auth/me/password', { password });
      setSuccess('Password updated successfully.');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password.');
    }
  };

  return (
    <>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Update Profile</h3>
          <form onSubmit={handleProfileSubmit} className="mt-5 sm:flex sm:items-center">
             <div className="w-full sm:max-w-xs">
                <label htmlFor="name" className="sr-only">Name</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
             </div>
             <button type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                Save
             </button>
          </form>
        </div>
      </div>

       <div className="bg-white shadow sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
             <div>
                <label htmlFor="password" className="sr-only">New Password</label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
             </div>
             <div>
                <label htmlFor="password_confirmation" className="sr-only">Confirm New Password</label>
                <input
                    type="password"
                    name="password_confirmation"
                    id="password_confirmation"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Confirm New Password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
             </div>
             <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                    Update Password
                </button>
             </div>
          </form>
        </div>
      </div>
      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}
      {success && <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">{success}</div>}
    </>
  );
}
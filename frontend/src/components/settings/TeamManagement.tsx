'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ErrorMessage from '../ui/ErrorMessage';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TeamMember {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    role: 'AGENCY_OWNER' | 'AGENCY_MEMBER';
}

export default function TeamManagement() {
    const { user } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'AGENCY_OWNER' | 'AGENCY_MEMBER'>('AGENCY_MEMBER');
    
    useEffect(() => {
        if (user && user.agencyId) {
            setLoading(true);
            api.get(`/agencies/${user.agencyId}/members`)
                .then(response => {
                    setMembers(response.data);
                })
                .catch(err => {
                    setError(err.response?.data?.message || 'Failed to load team members.');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.agencyId) return;
        setError(null);
        try {
            const response = await api.post(`/agencies/${user.agencyId}/members`, {
                email: inviteEmail,
                role: inviteRole
            });
            setMembers([...members, response.data]);
            setInviteEmail('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to invite team member.');
        }
    };
    
    const handleRemoveMember = async (membershipId: string) => {
        if (!user || !user.agencyId) return;
        try {
            await api.delete(`/agencies/${user.agencyId}/members/${membershipId}`);
            setMembers(members.filter(m => m.id !== membershipId));
        } catch (err: any) {
             setError(err.response?.data?.message || 'Failed to remove team member.');
        }
    };

    if (loading) return <LoadingSpinner />;

    if (!user?.agencyId) {
        return <p>You are not part of an agency.</p>
    }

    return (
        <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Invite Team Member</h3>
                    <form onSubmit={handleInvite} className="mt-5 sm:flex sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex-grow">
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="you@example.com"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                             <label htmlFor="role" className="sr-only">Role</label>
                             <select 
                                id="role" 
                                name="role" 
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value as 'AGENCY_OWNER' | 'AGENCY_MEMBER')}
                             >
                                 <option value="AGENCY_MEMBER">Member</option>
                                 <option value="AGENCY_OWNER">Owner</option>
                             </select>
                        </div>
                        <button type="submit" className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm">
                            Invite
                        </button>
                    </form>
                    {error && <div className="mt-4"><ErrorMessage message={error}/></div>}
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
                    <ul className="mt-5 divide-y divide-gray-200">
                        {members.map(member => (
                            <li key={member.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                                    <p className="text-sm text-gray-500">{member.user.email} - {member.role}</p>
                                </div>
                                { user.id !== member.user.id && (
                                     <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="text-red-600 hover:text-red-900"
                                     >
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
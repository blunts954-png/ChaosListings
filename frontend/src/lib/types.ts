export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  agencyId?: string | null;
  role?: string;
}

export interface Business {
    id: string;
    name: string;
    address: string;
    phone: string;
    website: string;
    gmbUrl?: string;
    reviewUrl?: string;

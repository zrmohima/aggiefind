export type LostItem = {
    id: string;
    name: string;
    description: string;
    location: string;
    dropLocation?: string;
    imageUrl?: string | null | undefined;
    dateFound: string;
    foundBy: string;
    status: 'lost' | 'claimed' | 'found';
    visibility: 'public' | 'private';
    users: string[];
    createdAt: number;
};
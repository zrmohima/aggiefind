export type LostItem = {
    id: string;
    name: string;
    description: string;
    location: string;
    imageUrl?: string;
    dateFound: string;
    foundBy: string;
    status: 'lost' | 'claimed' | 'found';
    createdAt: number;
};
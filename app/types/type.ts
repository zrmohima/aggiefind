export type LostItem = {
    id: string;
    name: string;
    description: string;
    location: string;
    dropLocation?: string;
    // whether the poster wants their contact/info shared with finders
    shareContact?: boolean;
    // optional contact info (only when shareContact is true)
    contactName?: string;
    contactPhone?: string;
    creatorName: string;
    creatorEmail: string;
    imageUrl?: string | null | undefined;
    dateFound: string;
    foundBy?: string;
    postType: 'lost' | 'found';
    status: 'lost' | 'claimed' | 'found';
    visibility: 'public' | 'private';
    users: string[];
    createdAt: number;
    pendingClaim?: {
        byId: string;
        byName: string;
        byEmail?: string;
        desiredStatus: string;
        at: number;
    };
};
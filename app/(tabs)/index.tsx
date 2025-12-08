import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    Alert, FlatList,
    Image,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Field from "../components/Field";
import Header from "../components/Header";
import Input from "../components/Input";
import { ACCENT_ADD, ACCENT_ADD_P, BG, BORDER, INV_TEXT, SUB } from "../constants/color";
import { LostItem } from "../types/type";

export default function HomeScreen() {
    const [items, setItems] = useState<LostItem[]>([]);
    const [query, setQuery] = useState('');

    const filtered = (() => {
        const q = query.trim().toLowerCase();
        if (q.length === 0) return items;
        return items.filter(it => {
            return (
                it.name.toLowerCase().includes(q) ||
                it.description.toLowerCase().includes(q) ||
                it.location.toLowerCase().includes(q) ||
                it.foundBy?.toLowerCase().includes(q)
            );
        });
    })();

    const loadItemsFromBackend = () => {
        fetch('http://localhost:4000/api/items')
            .then(r => r.json())
            .then(data => {
                // show all unresolved items (hide only when a Lost post has been marked found by owner)
                const visible = (data || []).filter((it: LostItem) => !(it.postType === 'lost' && it.status === 'found'));
                setItems(visible);
            })
            .catch(err => {
                console.log('Error loading items:', err);
            });
    };

    const claimItem = (item: LostItem) => {
        const headers: any = { 'Content-Type': 'application/json' };
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const t = window.sessionStorage.getItem('aggiefind_token');
                if (t) headers['Authorization'] = `Bearer ${t}`;
            }
        } catch (e) { }
        const desiredStatus = item.postType === 'lost' ? 'found' : 'lost';

        fetch(`http://localhost:4000/api/user/items/${item.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: desiredStatus })
        })
            .then(r => r.json())
            .then(data => {
                // If server returned a pending claim object
                if (data && data.pendingClaim) {
                    const pc = data.pendingClaim;
                    let msg = `${pc.byName} submitted a claim.`;
                    // include creator contact/drop instructions if available
                    if (data.shareContact && data.contactPhone) {
                        msg += ` Call/text: ${data.contactPhone}`;
                    } else if (data.dropLocation) {
                        msg += ` Drop location: ${data.dropLocation}`;
                    } else if (data.creatorName) {
                        msg += ` Contact: ${data.creatorName} (${data.creatorEmail || 'no email'})`;
                    }
                    Alert.alert('Claim submitted', msg);
                } else if (data && data.deleted) {
                    Alert.alert('Resolved', 'The owner has confirmed and the item was removed.');
                } else if (data && data.status === desiredStatus) {
                    Alert.alert('Success', `Item status updated to ${desiredStatus}.`);
                }
                loadItemsFromBackend();
            })
            .catch(err => {
                console.log('Error claiming item:', err);
            });
    };

    useFocusEffect(
        useCallback(() => {
            loadItemsFromBackend();
        }, [])
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <Header title="AggieFind" />
            <View style={{ flex: 1, padding: 16 }}>
                <Field label="Search by name, description, location, or finder">
                    <Input
                        value={query}
                        onChangeText={setQuery}
                        placeholder="e.g., MacBook, Zuhl, John"
                    />
                </Field>

                <View style={{ height: 12 }} />
                <FlatList
                    data={filtered}
                    keyExtractor={(it: LostItem) => it.id}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    ListEmptyComponent={
                        <Text style={{ color: SUB, textAlign: 'center', marginTop: 24 }}>
                            {query.trim().length === 0 ? 'Type to search lost items.' : 'No items match your search.'}
                        </Text>
                    }
                    renderItem={({ item }: { item: LostItem }) => (
                        <View style={{
                            backgroundColor: SUB, borderColor: BORDER, borderRadius: 8, overflow: 'hidden'
                        }}>

                            <Image source={{ uri: 'https://mint.fiu.edu/wp-content/uploads/2021/10/image-not-available.jpg' }} style={{ width: '100%', height: 180 }} />
                            <View style={{
                                padding: 12, gap: 6
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ color: INV_TEXT, fontSize: 16, fontWeight: '700' }}>
                                        {item.name}
                                    </Text>
                                    <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: item.status === 'found' ? '#22c55e' : '#fbbf24' }}>
                                        <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>
                                            {item.status == 'found' ? 'FOUND' : 'MISSING'}
                                        </Text>
                                    </View>
                                </View>
                                {item.description ? <Text style={{ color: INV_TEXT }}>{item.description}</Text> : null}
                                {item.creatorName || item.creatorEmail ? <Text style={{ color: INV_TEXT }}>Posted by: {item.creatorName || item.creatorEmail}</Text> : null}
                                {item.location ? <Text style={{ color: INV_TEXT }}>Found at: {item.location}</Text> : null}
                                {item.dateFound ? <Text style={{ color: INV_TEXT }}>Found on: {item.dateFound}</Text> : null}
                                {item.pendingClaim ? (
                                    <View style={{ marginTop: 6, padding: 8, backgroundColor: '#FEE2E2', borderRadius: 4 }}>
                                        <Text style={{ color: '#DC2626', fontWeight: '600' }}>Pending Claim</Text>
                                        <Text style={{ color: '#DC2626', fontSize: 12 }}>Claimant: {item.pendingClaim.byName}</Text>
                                        {item.shareContact && item.contactPhone ? <Text style={{ color: '#DC2626', fontSize: 12 }}>Return: {item.contactPhone}</Text> : null}
                                        {item.dropLocation ? <Text style={{ color: '#DC2626', fontSize: 12 }}>Drop at: {item.dropLocation}</Text> : null}
                                    </View>
                                ) : null}
                                {item.foundBy ? <Text style={{ color: INV_TEXT }}>Found by: {item.foundBy}</Text> : null}
                                {item.status === item.postType && (
                                    <View style={{ flexDirection: 'row', gap: 5, marginTop: 8, marginBottom: 8 }}>
                                        {item.postType === 'lost' && <Button title="Mark Found" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={() => claimItem(item)} />}
                                        {item.postType === 'found' && <Button title="I Lost This" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={() => claimItem(item)} />}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}
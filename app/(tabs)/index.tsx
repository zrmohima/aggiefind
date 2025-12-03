import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    FlatList,
    Image,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Field from "../components/Field";
import Header from "../components/Header";
import Input from "../components/Input";
import { ACCENT_ADD, ACCENT_ADD_P, BG, BORDER, CARD, INV_TEXT, SUB } from "../constants/color";
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
                it.foundBy.toLowerCase().includes(q)
            );
        });
    })();

    const loadItemsFromBackend = () => {
        fetch('http://localhost:4000/api/items')
            .then(r => r.json())
            .then(data => {
                setItems(data);
            })
            .catch(err => {
                console.log('Error loading items:', err);
            });
    };

    const markFound = (item: LostItem) => {
        fetch(`http://localhost:4000/api/user/items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...item, status: 'found' })
        })
            .then(r => r.json())
            .then(data => {
                loadItemsFromBackend();
            })
            .catch(err => {
                console.log('Error marking item as found:', err);
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
                            backgroundColor: CARD, borderColor: BORDER, borderRadius: 8, overflow: 'hidden'
                        }}>

                            <Image source={{ uri: 'https://mint.fiu.edu/wp-content/uploads/2021/10/image-not-available.jpg' }} style={{ width: '100%', height: 180 }} />
                            <View style={{
                                padding: 12, gap: 6
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ color: INV_TEXT, fontSize: 16, fontWeight: '700' }}>
                                        {item.name}
                                    </Text>

                                    {/* Status badge */}
                                    <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: item.status === 'found' ? '#22c55e' : '#fbbf24' }}>
                                        <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>
                                            {item.status == 'found' ? 'FOUND' : 'MISSING'}
                                        </Text>
                                    </View>
                                </View>
                                {item.description ? <Text style={{ color: INV_TEXT }}>{item.description}</Text> : null}
                                {item.location ? <Text style={{ color: INV_TEXT }}>Found at: {item.location}</Text> : null}
                                {item.dateFound ? <Text style={{ color: INV_TEXT }}>Found on: {item.dateFound}</Text> : null}
                                {item.foundBy ? <Text style={{ color: INV_TEXT }}>Found by: {item.foundBy}</Text> : null}
                                {item.status === 'lost' && <View style={{ flexDirection: 'row', gap: 5, marginTop: 8, marginBottom: 8 }}>
                                    <Button title="Mark Found" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={() => markFound(item)} />
                                </View>}
                            </View>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}
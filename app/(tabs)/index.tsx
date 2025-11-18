import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    Modal,
    StyleSheet,
} from "react-native";
import Header from "../components/Header";
import Input from "../components/Input";
import Field from "../components/Field";
import { LostItem } from "../types/type";
import { SafeAreaView } from "react-native-safe-area-context";
import { BG, BORDER, CARD, INV_TEXT, SUB } from "../constants/color";

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

    useEffect(() => {
        loadItemsFromBackend();
    }, []);

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
                            {query.trim().length === 0 ? 'Type to search lost items.' : 'No approved items match your search.'}
                        </Text>
                    }
                    renderItem={({ item }: { item: LostItem }) => (
                        <View style={{
                            backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 14,
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
                            {item.location ? <Text style={{ color: SUB }}>Found at: {item.location}</Text> : null}
                            {item.dateFound ? <Text style={{ color: SUB }}>Found on: {item.dateFound}</Text> : null}
                            {item.foundBy ? <Text style={{ color: SUB }}>Found by: {item.foundBy}</Text> : null}
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}
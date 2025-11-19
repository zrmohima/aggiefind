import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import Header from "../components/Header";
import Input from "../components/Input";
import Field from "../components/Field";
import { LostItem } from "../types/type";
import { SafeAreaView } from "react-native-safe-area-context";
import { ACCENT_ADD, ACCENT_ADD_P, BG, BORDER, CARD, INV_TEXT, SUB, TEXT } from "../constants/color";
import Button from "../components/Button";
import { useRouter } from "expo-router";

export default function HomeScreen() {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [loc, setLoc] = useState('');
    const [dateFound, setDateFound] = useState(new Date().toISOString().slice(0, 10));
    const [foundBy, setFoundBy] = useState('');
    const valid = name.trim().length > 0;
    const router = useRouter();

    const addItem = () => {
        if (!valid) {
            Alert.alert('Missing name', 'Please enter an item name.');
            return;
        }
        const newItem: LostItem = {
            id: String(Date.now()),
            name: name.trim(),
            description: desc.trim(),
            location: loc.trim(),
            dateFound: dateFound.trim(),
            foundBy: foundBy.trim(),
            status: 'lost',
            createdAt: Date.now(),
        };

        // Send to backend
        fetch('http://localhost:4000/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        })
            .then(r => r.json())
            .then(data => {
                Alert.alert('Success', 'Item submitted!');
                router.navigate('/');
            })
            .catch(err => {
                Alert.alert('Error', 'Could not submit item: ' + String(err).slice(0, 50));
            });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <Header title="AggieFind" />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={{ flex: 1, padding: 16, gap: 16 }}>
                    <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700' }}>Add Lost Item</Text>

                    <Field label="Item name (required)">
                        <Input value={name} onChangeText={setName} placeholder="e.g., Silver MacBook Pro" />
                    </Field>

                    <Field label="Description">
                        <Input
                            value={desc}
                            onChangeText={setDesc}
                            placeholder="Color, stickers, unique marks…"
                            multiline
                            style={{ height: 90, textAlignVertical: 'top' }}
                        />
                    </Field>

                    <Field label="Where it was found">
                        <Input value={loc} onChangeText={setLoc} placeholder="e.g., Zuhl Library 2nd floor" />
                    </Field>

                    <Field label="When it was found (YYYY-MM-DD)">
                        <Input value={dateFound} onChangeText={setDateFound} placeholder="e.g., 2025-10-24" />
                    </Field>

                    <Field label="Who found it">
                        <Input value={foundBy} onChangeText={setFoundBy} placeholder="e.g., John Doe" />
                    </Field>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                        <Button title="Save Item" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={addItem} />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Field from "../components/Field";
import Header from "../components/Header";
import Input from "../components/Input";
import { ACCENT_ADD, ACCENT_ADD_P, BG, BORDER, INV_TEXT, SUB, TEXT } from "../constants/color";
import { LostItem } from "../types/type";

const NMSU_LOCATIONS = [
    { label: "Select where it was found...", value: "" },
    { label: "Science Hall", value: "ScienceHall" },
    { label: "Walden Hall", value: "WaldenHall" },
    { label: "Biology Annex", value: "BiologyAnnex" },
    { label: "Astronomy Building", value: "AstronomyBuilding" },
    { label: "Branson Library", value: "BransonLibrary" },
    { label: "Foster Hall", value: "FosterHall" },
    { label: "Young Hall", value: "YoungHall" },
    { label: "Pete V. Domenici Hall", value: "PeteDomenici" },
    { label: "Hardman & Jacobs", value: "HardmanJacobs" },
    { label: "Milton Hall", value: "MiltonHall" },
    { label: "Frenger Food Court", value: "FrencerFoodCourt" },
    { label: "Zuhl Library", value: "ZuhlLibrary" },
    { label: "Aggie Health & Wellness", value: "AggieHealth" },
    { label: "Hadley Hall", value: "HadleyHall" },
];

export default function HomeScreen() {
    const [items, setItems] = useState<LostItem[]>([]);
    const [query, setQuery] = useState('');
    const [markFoundModal, setMarkFoundModal] = useState(false);
    const [pendingItem, setPendingItem] = useState<LostItem | null>(null);
    const [selectedLocation, setSelectedLocation] = useState('');

    const filtered = (() => {
        const q = query.trim().toLowerCase();
        if (q.length === 0) return items;
        return items.filter(it =>
            it.name.toLowerCase().includes(q) ||
            it.description.toLowerCase().includes(q) ||
            it.location.toLowerCase().includes(q) ||
            it.foundBy?.toLowerCase().includes(q)
        );
    })();

    const loadItemsFromBackend = () => {
        fetch('http://localhost:4000/api/items')
            .then(r => r.json())
            .then(data => {
                const visible = (data || []).filter(
                    (it: LostItem) =>
                        !(it.postType === 'lost' && it.status === 'found') &&
                        it.status !== 'claimed'
                );
                setItems(visible);
            })
            .catch(err => console.log('Error loading items:', err));
    };

    useFocusEffect(useCallback(() => { loadItemsFromBackend(); }, []));

    function authHeaders(): any {
        const h: any = { 'Content-Type': 'application/json' };
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const t = window.sessionStorage.getItem('aggiefind_token');
                if (t) h['Authorization'] = `Bearer ${t}`;
            }
        } catch (e) { }
        return h;
    }

    // Single API call helper — action-based
    const callItemAPI = (item: LostItem, action: string, foundLocation?: string) => {
        const body: any = { action };
        if (foundLocation) body.foundLocation = foundLocation;

        fetch(`http://localhost:4000/api/user/items/${item.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(body),
        })
            .then(r => r.json())
            .then(data => {
                if (data && data.pendingClaim) {
                    const pc = data.pendingClaim;
                    let msg = `${pc.byName} submitted a claim.`;
                    if (data.shareContact && data.contactPhone) msg += ` Call/text: ${data.contactPhone}`;
                    else if (data.dropLocation) msg += ` Drop at: ${data.dropLocation}`;
                    else if (data.creatorName) msg += ` Contact: ${data.creatorName}`;
                    Alert.alert('Claim submitted', msg);
                } else if (data && data.deleted) {
                    Alert.alert('Resolved', 'The owner confirmed and the item was removed.');
                } else if (data && data.status) {
                    Alert.alert('Updated', `Item marked as ${data.status}.`);
                }
                loadItemsFromBackend();
            })
            .catch(err => console.log('Error updating item:', err));
    };

    // "Mark Found" — opens modal to ask where item was found
    const handleMarkFound = (item: LostItem) => {
        setPendingItem(item);
        setSelectedLocation('');
        setMarkFoundModal(true);
    };

    // Modal confirm — sends action: markFound with selected foundLocation
    const handleMarkFoundConfirm = () => {
        if (!pendingItem || !selectedLocation) {
            Alert.alert('Please select a location');
            return;
        }
        setMarkFoundModal(false);
        callItemAPI(pendingItem, 'markFound', selectedLocation);
        setPendingItem(null);
        setSelectedLocation('');
    };

    // "I Lost This" — sends action: iLostThis, backend uses item.location
    const handleILostThis = (item: LostItem) => {
        callItemAPI(item, 'iLostThis');
    };

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
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 48 }}>
                            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
                            <Text style={{ color: SUB, textAlign: 'center', fontSize: 14 }}>
                                {query.trim().length === 0 ? 'Type to search lost items.' : 'No items match your search.'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }: { item: LostItem }) => (
                        <View style={{
                            backgroundColor: SUB,
                            borderColor: BORDER,
                            borderWidth: 1,
                            borderRadius: 14,
                            overflow: 'hidden',
                            elevation: 2,
                            shadowColor: '#000',
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 2 },
                        }}>
                            <Image
                                source={{ uri: item?.imageUrl || 'https://mint.fiu.edu/wp-content/uploads/2021/10/image-not-available.jpg' }}
                                style={{ width: '100%', height: 180 }}
                            />
                            <View style={{ padding: 14, gap: 6 }}>

                                {/* Title + badge */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <Text style={{ flex: 1, color: INV_TEXT, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <View style={{
                                        paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20,
                                        backgroundColor: item.status === 'found' ? '#059669' : '#F59E0B',
                                    }}>
                                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                                            {item.status === 'found' ? 'FOUND' : 'MISSING'}
                                        </Text>
                                    </View>
                                </View>

                                {item.description ? (
                                    <Text style={{ color: INV_TEXT, fontSize: 13, opacity: 0.8 }} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                ) : null}

                                <View style={{ gap: 3, marginTop: 2 }}>
                                    {item.location ? <Text style={{ color: INV_TEXT, fontSize: 13, opacity: 0.7 }}>📍 {item.location}</Text> : null}
                                    {item.dateFound ? <Text style={{ color: INV_TEXT, fontSize: 13, opacity: 0.7 }}>🕐 {new Date(item.dateFound).toLocaleString()}</Text> : null}
                                    {item.creatorName || item.creatorEmail
                                        ? <Text style={{ color: INV_TEXT, fontSize: 13, opacity: 0.7 }}>👤 {item.creatorName || item.creatorEmail}</Text>
                                        : null}
                                    {item.foundBy ? <Text style={{ color: INV_TEXT, fontSize: 13, opacity: 0.7 }}>✋ Found by: {item.foundBy}</Text> : null}
                                </View>

                                {item.pendingClaim ? (
                                    <View style={{
                                        marginTop: 6, padding: 10,
                                        backgroundColor: '#FEF3C7',
                                        borderRadius: 10,
                                        borderLeftWidth: 3,
                                        borderLeftColor: '#F59E0B',
                                        gap: 3,
                                    }}>
                                        <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 13 }}>🔔 Pending Claim</Text>
                                        <Text style={{ color: '#92400E', fontSize: 12 }}>Claimant: {item.pendingClaim.byName}</Text>
                                        {item.shareContact && item.contactPhone
                                            ? <Text style={{ color: '#92400E', fontSize: 12 }}>📞 Return: {item.contactPhone}</Text>
                                            : null}
                                        {item.dropLocation
                                            ? <Text style={{ color: '#92400E', fontSize: 12 }}>📦 Drop at: {item.dropLocation}</Text>
                                            : null}
                                    </View>
                                ) : null}

                                {item.status === item.postType && (
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                        {item.postType === 'lost' && (
                                            <Button
                                                title="Mark Found"
                                                bg={ACCENT_ADD}
                                                bgPressed={ACCENT_ADD_P}
                                                onPress={() => handleMarkFound(item)}
                                            />
                                        )}
                                        {item.postType === 'found' && (
                                            <Button
                                                title="I Lost This"
                                                bg={ACCENT_ADD}
                                                bgPressed={ACCENT_ADD_P}
                                                onPress={() => handleILostThis(item)}
                                            />
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            </View>

            {/* Mark Found Modal */}
            <Modal
                visible={markFoundModal}
                transparent
                animationType="slide"
                onRequestClose={() => setMarkFoundModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Where was it found?</Text>
                        <Text style={styles.modalSub}>
                            Select the building where you found{'\n'}
                            <Text style={{ fontWeight: '700' }}>{pendingItem?.name}</Text>
                        </Text>

                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={selectedLocation}
                                onValueChange={(v) => setSelectedLocation(v.toString())}
                                style={{ color: TEXT }}
                            >
                                {NMSU_LOCATIONS.map(loc => (
                                    <Picker.Item key={loc.value} label={loc.label} value={loc.value} />
                                ))}
                            </Picker>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setMarkFoundModal(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, !selectedLocation && styles.confirmBtnDisabled]}
                                onPress={handleMarkFoundConfirm}
                                disabled={!selectedLocation}
                            >
                                <Text style={styles.confirmText}>Confirm Found</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: BG,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        gap: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: TEXT,
    },
    modalSub: {
        fontSize: 14,
        color: TEXT,
        opacity: 0.7,
        lineHeight: 20,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: SUB,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
    },
    cancelText: {
        color: TEXT,
        fontWeight: '600',
        fontSize: 15,
    },
    confirmBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#882345',
        alignItems: 'center',
    },
    confirmBtnDisabled: {
        opacity: 0.45,
    },
    confirmText: {
        color: INV_TEXT,
        fontWeight: '700',
        fontSize: 15,
    },
});
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import Header from "../components/Header";
import { ACCENT_ADD, ACCENT_ADD_P, BG, BORDER, INV_TEXT, SUB } from "../constants/color";
import { LostItem } from "../types/type";

export default function ClaimsScreen() {
    const router = useRouter();
    const [items, setItems] = useState<LostItem[]>([]);
    const [selected, setSelected] = useState<LostItem | null>(null);

    const loadItemsFromBackend = () => {
        const headers: any = {};
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const t = window.sessionStorage.getItem('aggiefind_token');
                if (t) headers['Authorization'] = `Bearer ${t}`;
            }
        } catch (e) { }

        fetch('http://localhost:4000/api/user/items', { headers })
            .then(r => {
                if (!r.ok) throw new Error('Unauthorized');
                return r.json();
            })
            .then(data => {
                setItems(data);
            })
            .catch(err => {
                console.log('Error loading user items:', err);
            });
    };

    // reload items whenever this screen gains focus so newly posted items appear
    useFocusEffect(
        React.useCallback(() => {
            loadItemsFromBackend();
        }, [])
    );

    const handleEdit = (item: LostItem): void => {
        router.push({
            pathname: '/post',
            params: { id: item.id }
        });
    };

    const handleDelete = (item: LostItem): void => {
        //check if the same user is deleting the post and status and post type match
        Alert.alert(
            "Confirm Deletion",
            `Are you sure you want to delete item ${item.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        console.log(`Deleting item with ID: ${item.id}`);
                    }
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: LostItem }) => (
        <TouchableOpacity onPress={() => setSelected(item)} style={styles.card}>
            <Image source={{ uri: item.imageUrl || 'https://mint.fiu.edu/wp-content/uploads/2021/10/image-not-available.jpg' }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardText}>{item.location}</Text>
                <Text style={styles.cardText}>{item.dateFound ? new Date(item.dateFound).toLocaleString() : ""}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            </View>
                <View>
                    <Text style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: item.status === 'found' ? '#22c55e' : '#fbbf24', color: '#000', fontSize: 12, fontWeight: '700' }}>
                        {item.status == 'found' ? 'FOUND' : 'MISSING'}
                    </Text>

                    {/* Show pending claim information if present */}
                    {item.pendingClaim ? (
                        <Text style={{ color: '#000', marginTop: 6 }}>Claim by: {item.pendingClaim.byName}</Text>
                    ) : null}

                    {item.status == item.postType && <Button style={{ marginTop: 5, marginBottom: 5, padding: 2, backgroundColor: INV_TEXT }} kind="ghost" title="Edit Item" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={() => handleEdit(item)} />}

                    {/* If owner and there's a claim, show confirm button */}
                    {item.pendingClaim ? (
                        <Button title={`Confirm (returned)`} onPress={() => {
                            // confirm as owner
                            const headers: any = { 'Content-Type': 'application/json' };
                            try {
                                if (typeof window !== 'undefined' && window.sessionStorage) {
                                    const t = window.sessionStorage.getItem('aggiefind_token');
                                    if (t) headers['Authorization'] = `Bearer ${t}`;
                                }
                            } catch (e) { }
                            fetch(`http://localhost:4000/api/user/items/${item.id}`, {
                                method: 'PUT', headers, body: JSON.stringify({ action: 'confirm' })
                            })
                                .then(r => r.json())
                                .then(data => {
                                    if (data && data.deleted) {
                                        Alert.alert('Confirmed', 'Item resolved and removed from the list.');
                                    } else {
                                        Alert.alert('Confirmed', 'Item status updated.');
                                    }
                                    loadItemsFromBackend();
                                })
                                .catch(err => console.log('Error confirming claim:', err));
                        }} />
                    ) : null}
                </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <Header title="AggieFind" />
            <FlatList
                data={items}
                keyExtractor={(i) => i.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            />

            <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        {selected?.imageUrl ? <Image source={{ uri: selected.imageUrl }} style={styles.modalImage} /> : <Image source={{ uri: 'https://mint.fiu.edu/wp-content/uploads/2021/10/image-not-available.jpg' }} style={styles.modalImage} />}
                        <Text style={styles.modalTitle}>{selected?.name}</Text>
                        <Text style={styles.modalMeta}>Location: {selected?.location}</Text>
                        <Text style={styles.modalMeta}>
                            Date: {selected?.dateFound ? new Date(selected.dateFound).toLocaleString() : ""}
                        </Text>
                        <Text style={styles.modalDesc}>{selected?.description}</Text>

                        <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        backgroundColor: SUB,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 12,
        gap: 6,
        marginBottom: 12,
        elevation: 2,
        alignItems: "center",
    },
    cardImage: { width: 100, height: 100, borderRadius: 8 },
    cardContent: { flex: 1, marginLeft: 12 },
    cardTitle: { color: INV_TEXT, fontWeight: "700", fontSize: 16, marginBottom: 4 },
    cardText: { color: INV_TEXT, fontSize: 14, marginBottom: 2 },
    cardDesc: { color: INV_TEXT, marginTop: 4 },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 },
    modalCard: { width: "100%", maxWidth: 720, backgroundColor: "#fff", borderRadius: 12, padding: 16 },
    modalImage: { width: "100%", height: 220, borderRadius: 10, marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
    modalMeta: { color: "#6B7280", marginBottom: 6 },
    modalDesc: { color: "#374151", marginBottom: 16 },
    closeBtn: { backgroundColor: "#882345", paddingVertical: 12, borderRadius: 10 },
    closeText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});

import React, { useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { LostItem } from "../types/type";
import { BG, BORDER, CARD, INV_TEXT, SUB } from "../constants/color";

export default function ClaimsScreen() {

    const [items, setItems] = useState<LostItem[]>([]);
    const [selected, setSelected] = useState<LostItem | null>(null);

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

    const renderItem = ({ item }: { item: LostItem }) => (
        <TouchableOpacity onPress={() => setSelected(item)} style={styles.card}>
            <Image source={{ uri: item.imageUrl || 'https://mint.fiu.edu/wp-content/uploads/2021/10/image-not-available.jpg' }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardText}>{item.location}</Text>
                <Text style={styles.cardText}>{item.dateFound ? new Date(item.dateFound).toLocaleString() : ""}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            </View>
            <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: item.status === 'found' ? '#22c55e' : '#fbbf24' }}>
                <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>
                    {item.status == 'found' ? 'FOUND' : 'MISSING'}
                </Text>
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
        backgroundColor: CARD,
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

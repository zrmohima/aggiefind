import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
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
import { runSearch } from "../services/compute";
import { ensureScheduleForRange } from "../services/scheduler";
import { LostItem } from "../types/type";

export default function ClaimsScreen() {
    const router = useRouter();
    const [items, setItems] = useState<LostItem[]>([]);
    const [selected, setSelected] = useState<LostItem | null>(null);
    const [searchState, setSearchState] = useState<Record<string, any>>({});
    const [schedule, setSchedule] = useState<any[]>([]);

    const handleAIAssist = useCallback((item: LostItem) => {
        setSearchState(prev => ({
            ...prev,
            [item.id]: { loading: true, results: null },
        }));
        setTimeout(() => {
            const updated = ensureScheduleForRange(item.dateFound, schedule);
            setSchedule(updated);
            const output = runSearch(item.location, item.dateFound, updated);
            setSearchState(prev => ({
                ...prev,
                [item.id]: { loading: false, results: output },
            }));
        }, 400);
    }, [schedule]);

    function openMapsToBuilding(label: string) {
        const encoded = encodeURIComponent(`${label}, NMSU, Las Cruces, NM`);
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=walking`);
    }

    function scoreColor(score: number) {
        if (score > 0.05) return "#059669";
        if (score > 0.02) return "#F59E0B";
        return "#EF4444";
    }

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

    const renderSearchResults = (item: LostItem) => {
        const state = searchState[item.id];
        if (!state) return null;

        if (state.loading) {
            return (
                <View style={styles.searchBox}>
                    <View style={styles.searchingRow}>
                        <ActivityIndicator color="#882345" size="small" />
                        <Text style={styles.searchingText}>Running search...</Text>
                    </View>
                </View>
            );
        }

        if (!state.results) return null;
        const { results, hoursElapsed, confidence } = state.results;

        return (
            <View style={styles.searchBox}>
                <View style={styles.searchHeader}>
                    <Text style={styles.searchTitle}>Search Results</Text>
                    <View style={styles.confidencePill}>
                        <Text style={styles.confidenceText}>
                            {confidence}% confidence · {hoursElapsed}h ago
                        </Text>
                    </View>
                </View>

                {results.length === 0 ? (
                    <View style={styles.noResultRow}>
                        <Text style={styles.noResultIcon}>⚠</Text>
                        <Text style={styles.noResultText}>Item likely still in transit or confidence too low.</Text>
                    </View>
                ) : (
                    results.map((r: any, i: number) => (
                        <View key={r.building} style={styles.resultRow}>
                            <View style={[styles.rankBadge, { backgroundColor: i === 0 ? "#882345" : "#E5E7EB" }]}>
                                <Text style={[styles.rankText, { color: i === 0 ? "#fff" : "#374151" }]}>#{i + 1}</Text>
                            </View>
                            <View style={styles.resultContent}>
                                <Text style={styles.facilityName}>{r.label}</Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, {
                                        width: `${Math.min(r.finalScore * 1000, 100)}%` as any,
                                        backgroundColor: scoreColor(r.finalScore),
                                    }]} />
                                </View>
                                <View style={styles.resultMeta}>
                                    <Text style={styles.scoreText}>Score: {r.finalScore}</Text>
                                    <Text style={styles.scoreText}>Traffic: {r.trafficLoad}%</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.directionsBtn} onPress={() => openMapsToBuilding(r.label)}>
                                <FontAwesome5 name="walking" size={24} color="black" style={styles.directionsIcon} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                <TouchableOpacity style={styles.refreshBtn} onPress={() => handleAIAssist(item)}>
                    <Text style={styles.refreshIcon}>↻</Text>
                    <Text style={styles.refreshText}>Re-run Search</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderItem = ({ item }: { item: LostItem }) => (
        <View style={styles.cardWrapper}>
            <TouchableOpacity onPress={() => setSelected(item)} style={styles.card} activeOpacity={0.85}>
                <Image
                    source={{ uri: item.imageUrl || 'https://mint.fiu.edu/wp-content/uploads/2021/10/image-not-available.jpg' }}
                    style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'found' ? '#059669' : '#F59E0B' }]}>
                            <Text style={styles.statusText}>{item.status === 'found' ? 'FOUND' : 'MISSING'}</Text>
                        </View>
                    </View>

                    <Text style={styles.cardText}>📍 {item.location}</Text>
                    <Text style={styles.cardText}>🕐 {item.dateFound ? new Date(item.dateFound).toLocaleString() : ""}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                    {item.pendingClaim ? (
                        <View style={styles.claimBanner}>
                            <Text style={styles.claimText}>🔔 Claim by: {item.pendingClaim.byName}</Text>
                        </View>
                    ) : null}

                    <View style={styles.cardActions}>
                        <View style={styles.cardActionsLeft}>
                            {item.status == item.postType && (
                                <Button
                                    style={styles.editBtn}
                                    kind="ghost"
                                    title="Edit"
                                    bg={ACCENT_ADD}
                                    bgPressed={ACCENT_ADD_P}
                                    onPress={() => handleEdit(item)}
                                />
                            )}
                        </View>

                        {item.status !== 'found' && (
                            <TouchableOpacity style={styles.aiBtn} onPress={() => handleAIAssist(item)} activeOpacity={0.8}>
                                <Octicons name="sparkles-fill" size={16} color="white" />
                                <Text style={styles.aiBtnText}>Search with AI</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {item.pendingClaim ? (
                        <Button
                            title="Confirm Return"
                            onPress={() => {
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
                            }}
                        />
                    ) : null}
                </View>
            </TouchableOpacity>

            {renderSearchResults(item)}
        </View>
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
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No items yet</Text>
                        <Text style={styles.emptySubText}>Items you post will appear here</Text>
                    </View>
                }
            />

            <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Image
                            source={{ uri: selected?.imageUrl || 'https://mint.fiu.edu/wp-content/uploads/2021/10/image-not-available.jpg' }}
                            style={styles.modalImage}
                        />
                        <View style={styles.modalTitleRow}>
                            <Text style={styles.modalTitle}>{selected?.name}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: selected?.status === 'found' ? '#059669' : '#F59E0B' }]}>
                                <Text style={styles.statusText}>{selected?.status === 'found' ? 'FOUND' : 'MISSING'}</Text>
                            </View>
                        </View>
                        <Text style={styles.modalMeta}>📍 {selected?.location}</Text>
                        <Text style={styles.modalMeta}>
                            🕐 {selected?.dateFound ? new Date(selected.dateFound).toLocaleString() : ""}
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
    cardWrapper: {
        marginBottom: 16,
    },
    card: {
        flexDirection: "row",
        backgroundColor: SUB,
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        alignItems: "flex-start",
        gap: 6,
    },
    cardImage: {
        width: 90,
        height: 90,
        borderRadius: 10,
    },
    cardContent: {
        flex: 1,
        marginLeft: 8,
    },
    cardTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
        gap: 6,
    },
    cardTitle: {
        flex: 1,
        color: INV_TEXT,
        fontWeight: "700",
        fontSize: 15,
    },
    statusBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 20,
    },
    statusText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    cardText: {
        color: INV_TEXT,
        fontSize: 13,
        marginBottom: 2,
        opacity: 0.7,
    },
    cardDesc: {
        color: INV_TEXT,
        marginTop: 4,
        fontSize: 13,
        opacity: 0.8,
    },
    claimBanner: {
        marginTop: 8,
        backgroundColor: "#FEF3C7",
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    claimText: {
        color: "#92400E",
        fontSize: 12,
        fontWeight: "600",
    },
    editBtn: {
        marginTop: 0,
        marginBottom: 0,
        padding: 0,
        backgroundColor: INV_TEXT,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
        gap: 8,
    },
    emptyIcon: {
        fontSize: 48,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "700",
        color: INV_TEXT,
    },
    emptySubText: {
        fontSize: 14,
        color: INV_TEXT,
        opacity: 0.5,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalCard: {
        width: "100%",
        maxWidth: 720,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
    },
    modalImage: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        marginBottom: 14,
    },
    modalTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
        gap: 8,
    },
    modalTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
    },
    modalMeta: {
        color: "#6B7280",
        marginBottom: 6,
        fontSize: 14,
    },
    modalDesc: {
        color: "#374151",
        marginBottom: 16,
        fontSize: 14,
        lineHeight: 20,
    },
    cardActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 10,
    },
    cardActionsLeft: {
        flex: 1,
    },
    aiBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#882345",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        gap: 10,
    },
    aiBtnIcon: {
        width: 14,
        height: 14,
    },
    aiBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

    searchBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginTop: 4,
        borderLeftWidth: 3,
        borderLeftColor: "#882345",
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
    },
    searchingRow: { flexDirection: "row", alignItems: "center" },
    searchingText: { color: "#6B7280", marginLeft: 8, fontSize: 13 },
    searchHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    searchTitle: { fontWeight: "700", fontSize: 14, color: "#111827" },
    confidencePill: {
        backgroundColor: "#F3F4F6",
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    confidenceText: { fontSize: 11, color: "#6B7280" },
    resultRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 10,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    rankText: { fontWeight: "800", fontSize: 13 },
    resultContent: { flex: 1 },
    facilityName: { fontWeight: "600", fontSize: 13, color: "#1F2937", marginBottom: 4 },
    barTrack: {
        height: 6,
        backgroundColor: "#F3F4F6",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 3,
    },
    barFill: { height: 6, borderRadius: 3 },
    resultMeta: { flexDirection: "row", gap: 12 },
    scoreText: { fontSize: 11, color: "#9CA3AF" },
    noResultRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
    },
    noResultIcon: { fontSize: 18, color: "#F59E0B" },
    noResultText: { color: "#6B7280", fontSize: 13, flex: 1 },
    directionsBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    directionsIcon: { width: 36, height: 36, borderRadius: 8 },
    refreshBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#882345",
        gap: 6,
    },
    refreshIcon: { color: "#882345", fontSize: 16, fontWeight: "700" },
    refreshText: { color: "#882345", fontWeight: "600", fontSize: 13 },

    closeBtn: {
        backgroundColor: "#882345",
        paddingVertical: 13,
        borderRadius: 12,
    },
    closeText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "700",
        fontSize: 15,
    },
});
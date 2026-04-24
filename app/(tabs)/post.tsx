import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { BG, BORDER, CRIMSON, TEXT } from "../constants/color";
import { LostItem } from "../types/type";

const NMSU_USER_EMAILS = [
    "user1@nmsu.edu", "student2@nmsu.edu", "faculty3@nmsu.edu",
    "john.doe@nmsu.edu", "jane.smith@nmsu.edu", "michael.c@nmsu.edu",
    "sara.k@nmsu.edu", "testuser@nmsu.edu", "aggie_fan@nmsu.edu",
    "researcher10@nmsu.edu", "campus.admin@nmsu.edu", "support.staff@nmsu.edu",
    "alumni.g@nmsu.edu", "engineering.s@nmsu.edu", "library.h@nmsu.edu"
];

const NMSU_DROPLOCATIONS = [
    { label: "Hadley Hall Lost & Found", value: "HadleyHall" },
    { label: "Zuhl Library Front Desk", value: "ZuhlLibrary" },
    { label: "Walden Hall Lost & Found", value: "WaldenHall" },
];

const NMSU_LOCATIONS = [
    { label: "Select a location...", value: "" },
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

export default function PostScreen() {
    const [creatorName, setCreatorName] = useState('');
    const [creatorEmail, setCreatorEmail] = useState('');
    const [pendingFoundItem, setPendingFoundItem] = useState<LostItem | null>(null);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [postType, setPostType] = useState<"lost" | "found">("lost");
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [loc, setLoc] = useState('');
    const [dropLoc, setDropLoc] = useState(NMSU_DROPLOCATIONS[0].value);
    const [wishToDrop, setWishToDrop] = useState(false);
    const [shareInfo, setShareInfo] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const valid = name.trim().length > 0;
    const router = useRouter();
    const [image, setImage] = useState('');
    const [visibility, setVisibility] = useState(true);
    const [dateTime, setDateTime] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState("date");

    const [selectedNMSUUsers, setSelectedNMSUUsers] = useState<string[]>([]);
    const [nmsuUserInput, setNmsuUserInput] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [similarItems, setSimilarItems] = useState<LostItem[]>([]);

    const [filteredNMSUUsers, setFilteredNMSUUsers] = useState<string[]>([]);
    const params = useLocalSearchParams();
    const itemId = params.id;
    const [originalItem, setOriginalItem] = useState<LostItem | null>(null);
    const isEditMode = !!itemId;

    const formatter = new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    useEffect(() => {
        if (Platform.OS === 'web') {
            setCreatorName(JSON.parse(window.sessionStorage.getItem('aggiefind_user') || '').name || '');
            setCreatorEmail(JSON.parse(window.sessionStorage.getItem('aggiefind_user') || '').email || '');
        }
        if (isEditMode) {
            fetch(`http://localhost:4000/api/items/${itemId}`)
                .then(r => r.json())
                .then(data => {
                    setOriginalItem(data);
                    populateFormState(data);
                })
                .catch(err => {
                    Alert.alert("Error", "Could not load item for editing.");
                });
        }
    }, [itemId]);

    const populateFormState = (item: LostItem) => {
        setName(item.name);
        setDesc(item.description);
        setLoc(item.location);
        setDropLoc(item.dropLocation || NMSU_DROPLOCATIONS[0].value);
        setImage(item.imageUrl || '');
        setPostType(item.postType);
        setVisibility(item.visibility === 'public');
        setSelectedNMSUUsers(item.users || []);
        setDateTime(new Date(item.dateFound));
        setShareInfo(item.shareContact ?? false);
        setContactName(item.contactName ?? '');
        setContactPhone(item.contactPhone ?? '');
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];

            if (asset.base64) {
                setImage(`data:image/jpeg;base64,${asset.base64}`);
            } else {
                setImage(asset.uri);
            }
        }
    };

    const showDateTimePicker = (mode: string) => {
        setPickerMode(mode);
        setShowPicker(true);
    };

    const onChange = (event: any, selected: any) => {
        if (event?.type === "dismissed") {
            setShowPicker(false);
            return;
        }
        if (selected) {
            setShowPicker(Platform.OS === "ios");
            if (pickerMode === "date") {
                const d = new Date(selected);
                d.setHours(dateTime.getHours());
                d.setMinutes(dateTime.getMinutes());
                setDateTime(d);
            } else {
                const d = new Date(dateTime);
                d.setHours(selected.getHours());
                d.setMinutes(selected.getMinutes());
                setDateTime(d);
            }
        }
    };

    const handleNMSUUserInput = (text: string) => {
        setNmsuUserInput(text);
        if (text.length > 0) {
            const filtered = NMSU_USER_EMAILS.filter(email =>
                email.toLowerCase().includes(text.toLowerCase()) && !selectedNMSUUsers.includes(email)
            );
            setFilteredNMSUUsers(filtered.slice(0, 5));
        } else {
            setFilteredNMSUUsers([]);
        }
    };

    const handleSelectNMSUUser = (email: string) => {
        if (!selectedNMSUUsers.includes(email)) {
            setSelectedNMSUUsers([...selectedNMSUUsers, email]);
            setNmsuUserInput('');
            setFilteredNMSUUsers([]);
        }
    };

    const handleRemoveNMSUUser = (emailToRemove: string) => {
        setSelectedNMSUUsers(selectedNMSUUsers.filter(email => email !== emailToRemove));
    };

    const postItemToApi = (newItem: LostItem) => {
        if (!valid) {
            Alert.alert('Missing name', 'Please enter an item name.');
            return;
        }
        // backend expects items to be posted to /api/items (single collection)
        const headers: any = { 'Content-Type': 'application/json' };
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const t = window.sessionStorage.getItem('aggiefind_token');
                if (t) headers['Authorization'] = `Bearer ${t}`;
            }
        } catch (e) { }

        fetch('http://localhost:4000/api/items', {
            method: 'POST',
            headers,
            body: JSON.stringify(newItem)
        })
            .then(r => r.json())
            .then(data => {
                // show a confirmation and navigate to the main tabs when user acknowledges
                Alert.alert(
                    'Success',
                    `${postType === 'lost' ? 'Lost' : 'Found'} Item submitted!`,
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                );
            })
            .catch(err => {
                Alert.alert('Error', `Could not submit item: ${String(err).slice(0, 50)}`);
            });
    };

    const fetchSimilarItems = async (itemDetails: LostItem): Promise<LostItem[]> => {
        //implement API call to fetch similar items based on itemDetails
        //for now we will return dummy data
        return [
            { ...itemDetails, name: "Set of Silver Keys" },
        ];
    };

    const handleFoundItemSubmission = async (newItem: LostItem) => {
        // skip similar-items modal for a simpler flow: submit found posts immediately
        postItemToApi(newItem);
        resetForm();
    };

    const resetForm = () => {
        setName("");
        setDesc("");
        setImage('');
        setDropLoc(NMSU_DROPLOCATIONS[0].value);
        setVisibility(true);
        setShareInfo(false);
        setContactName('');
        setContactPhone('');
        setDateTime(new Date());
        setSelectedNMSUUsers([]);
        setSimilarItems([]);
    }

    const isMissing = (fieldName: string) => missingFields.includes(fieldName);
    const handleSubmit = async () => {
        const requiredFields: { [key: string]: string | string[] } = {
            name: name.trim(),
            desc: desc.trim(),
            loc: loc,
        };
        if (!visibility && selectedNMSUUsers.length === 0) {
            requiredFields.users = selectedNMSUUsers;
        }
        if (shareInfo) {
            requiredFields.contactName = contactName.trim();
            requiredFields.contactPhone = contactPhone.trim();
        }

        const errors: string[] = [];
        if (!requiredFields.name) errors.push('name');
        if (!requiredFields.desc) errors.push('desc');
        if (!requiredFields.loc) errors.push('loc');
        if (requiredFields.users && requiredFields.users.length === 0) errors.push('users');
        if (shareInfo && (!requiredFields.contactName || (typeof requiredFields.contactName === 'string' && requiredFields.contactName.length === 0))) errors.push('contactName');
        if (shareInfo && (!requiredFields.contactPhone || (typeof requiredFields.contactPhone === 'string' && requiredFields.contactPhone.length === 0))) errors.push('contactPhone');

        if (errors.length > 0) {
            setMissingFields(errors);
            Alert.alert("Missing Required Fields", "Please fill in all marked fields.");
            return;
        }

        setMissingFields([]);

        const newItem: LostItem = {
            id: originalItem ? originalItem.id : String(Date.now()),
            name: name.trim(),
            description: desc.trim(),
            imageUrl: image != '' ? image : null,
            location: loc || "Unknown",
            dropLocation: wishToDrop ? dropLoc : undefined,
            shareContact: shareInfo,
            creatorName,
            creatorEmail,
            contactName: shareInfo ? contactName.trim() : undefined,
            contactPhone: shareInfo ? contactPhone.trim() : undefined,
            dateFound: dateTime.toISOString(),
            status: postType,
            visibility: visibility ? "public" : "private",
            users: visibility ? [] : selectedNMSUUsers,
            postType: postType,
            createdAt: originalItem ? originalItem.createdAt : Date.now(),
        };
        if (postType === "found") {
            await handleFoundItemSubmission(newItem);
        } else {
            postItemToApi(newItem);
            resetForm();
        }
    };

    const SimilarItemsModal = () => {
        const [modalSearchText, setModalSearchText] = useState('');
        const trimmedSearchText = modalSearchText.toLowerCase().trim();
        const spacedKeywords = trimmedSearchText.split(/\s+/).filter(kw => kw.length > 0);
        const contiguousSearchText = trimmedSearchText.replace(/\s/g, '');

        const filteredItems = similarItems.filter(item => {
            if (!trimmedSearchText) {
                return true;
            }
            const itemDataString = [
                item.name,
                item.description,
                item.location,
                item.dropLocation ? item.dropLocation : '',
                new Date(item.dateFound).toLocaleDateString(),
                formatter.format(new Date(item.dateFound)),
            ].join(' ').toLowerCase();
            const normalizedItemData = itemDataString.replace(/\s/g, '');
            const contiguousMatch = normalizedItemData.includes(contiguousSearchText);
            const keywordMatch = spacedKeywords.every(keyword => itemDataString.includes(keyword));
            return contiguousMatch || keywordMatch;
        });

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderText}>Possible Matches Found!</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>X</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchBarContainer}>
                            <TextInput
                                placeholder="Search within list..."
                                placeholderTextColor="#9CA3AF"
                                value={modalSearchText}
                                onChangeText={setModalSearchText}
                                style={styles.searchBar}
                            />
                        </View>

                        <FlatList
                            data={filteredItems}
                            keyExtractor={item => item.id}
                            style={styles.modalBody}
                            renderItem={({ item }) => (
                                <View style={styles.listItem}>
                                    <Text style={styles.listItemTitle}>{item.name}</Text>
                                    <Text style={styles.listItemText}>{item.description}</Text>
                                </View>
                            )}
                            ListEmptyComponent={() => (
                                <Text style={{ textAlign: 'center', color: TEXT, marginTop: 20 }}>No items match your search.</Text>
                            )}
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalSubmitButton}
                                onPress={() => {
                                    // If there is a pending found item, submit it to the API
                                    if (pendingFoundItem) {
                                        postItemToApi(pendingFoundItem);
                                        setPendingFoundItem(null);
                                    }
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <Text style={styles.textStyle}>Confirm and Submit Found Item</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <Header title="Post" />
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Text style={styles.pageTitle}>Post an Item</Text>

                {/* Post Type Toggle */}
                <View style={styles.section}>
                    <Text style={styles.label}>Post Type</Text>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            onPress={() => setPostType("lost")}
                            style={[styles.toggleBtn, postType === "lost" && styles.toggleBtnActive]}
                        >
                            <Text style={[styles.toggleText, postType === "lost" && styles.toggleTextActive]}>Lost</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setPostType("found")}
                            style={[styles.toggleBtn, postType === "found" && styles.toggleBtnActive]}
                        >
                            <Text style={[styles.toggleText, postType === "found" && styles.toggleTextActive]}>Found</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.section}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        placeholder="e.g., Black backpack with NMSU sticker"
                        placeholderTextColor="#9CA3AF"
                        value={name}
                        onChangeText={(text) => { setName(text); text !== "" && setMissingFields(missingFields.filter(f => f !== "name")); }}
                        style={[styles.textInput, { color: TEXT }, isMissing('name') && styles.inputError]}
                    />
                </View>

                {/* Image */}
                <View style={styles.section}>
                    <Text style={styles.label}>Photo</Text>

                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {image
                            ? <Image source={{ uri: image }} style={styles.imagePreview} />
                            : <View style={styles.imagePlaceholder}>
                                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                                <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                            </View>
                        }
                    </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        placeholder="Describe the item in detail..."
                        placeholderTextColor="#9CA3AF"
                        value={desc}
                        onChangeText={(text) => { setDesc(text); text !== "" && setMissingFields(missingFields.filter(f => f !== "desc")); }}
                        multiline
                        style={[styles.textInput, { color: TEXT, height: 100, textAlignVertical: 'top' }, isMissing('desc') && styles.inputError]}
                    />
                </View>

                {/* Location Picker */}
                <View style={styles.section}>
                    <Text style={styles.label}>Location</Text>
                    <View style={[styles.pickerWrapper, isMissing('loc') && styles.inputError]}>
                        <Picker
                            style={{ backgroundColor: BG, color: TEXT }}
                            selectedValue={loc}
                            onValueChange={(v) => {
                                setLoc(v.toString());
                                v !== "" && setMissingFields(missingFields.filter(f => f !== 'loc'));
                            }}
                        >
                            {NMSU_LOCATIONS.map((item) => (
                                <Picker.Item key={item.value} label={item.label} value={item.value} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Drop off */}
                <View style={styles.section}>
                    <Text style={styles.label}>Drop off at a facility?</Text>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, wishToDrop && styles.toggleBtnActive]}
                            onPress={() => setWishToDrop(true)}
                        >
                            <Text style={[styles.toggleText, wishToDrop && styles.toggleTextActive]}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, !wishToDrop && styles.toggleBtnActive]}
                            onPress={() => setWishToDrop(false)}
                        >
                            <Text style={[styles.toggleText, !wishToDrop && styles.toggleTextActive]}>No</Text>
                        </TouchableOpacity>
                    </View>

                    {wishToDrop && (
                        <View style={[styles.pickerWrapper, { marginTop: 10 }]}>
                            <Picker
                                style={{ backgroundColor: BG, color: TEXT }}
                                selectedValue={dropLoc}
                                onValueChange={(v) => setDropLoc(v.toString())}
                            >
                                {NMSU_DROPLOCATIONS.map((item) => (
                                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                                ))}
                            </Picker>
                        </View>
                    )}
                </View>

                {/* Share contact */}
                <View style={styles.section}>
                    <Text style={styles.label}>Share your contact info?</Text>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            onPress={() => setShareInfo(true)}
                            style={[styles.toggleBtn, shareInfo && styles.toggleBtnActive]}
                        >
                            <Text style={[styles.toggleText, shareInfo && styles.toggleTextActive]}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShareInfo(false)}
                            style={[styles.toggleBtn, !shareInfo && styles.toggleBtnActive]}
                        >
                            <Text style={[styles.toggleText, !shareInfo && styles.toggleTextActive]}>No</Text>
                        </TouchableOpacity>
                    </View>

                    {shareInfo && (
                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.subLabel}>Contact name</Text>
                            <TextInput
                                placeholder="Your name"
                                placeholderTextColor="#9CA3AF"
                                value={contactName}
                                onChangeText={(t) => { setContactName(t); t !== "" && setMissingFields(missingFields.filter(f => f !== 'contactName')); }}
                                style={[styles.textInput, { color: TEXT }, isMissing('contactName') && styles.inputError]}
                            />
                            <Text style={styles.subLabel}>Phone number</Text>
                            <TextInput
                                placeholder="e.g., 575-123-4567"
                                placeholderTextColor="#9CA3AF"
                                value={contactPhone}
                                onChangeText={(t) => { setContactPhone(t); t !== "" && setMissingFields(missingFields.filter(f => f !== 'contactPhone')); }}
                                style={[styles.textInput, { color: TEXT }, isMissing('contactPhone') && styles.inputError]}
                                keyboardType="phone-pad"
                            />
                        </View>
                    )}
                </View>

                {/* Date & Time */}
                <View style={styles.section}>
                    <Text style={styles.label}>Date & Time</Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            onPress={() => showDateTimePicker("date")}
                            style={styles.dateBtn}
                        >
                            <Text style={styles.dateBtnIcon}>📅</Text>
                            <Text style={[styles.dateBtnText, { color: TEXT }]}>
                                {new Date(dateTime).toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => showDateTimePicker("time")}
                            style={styles.dateBtn}
                        >
                            <Text style={styles.dateBtnIcon}>🕐</Text>
                            <Text style={[styles.dateBtnText, { color: TEXT }]}>
                                {new Date(dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {showPicker && (
                        <DateTimePicker
                            value={dateTime}
                            mode={pickerMode as "date" | "time"}
                            display={Platform.OS === "ios" ? "inline" : "default"}
                            onChange={onChange}
                        />
                    )}
                </View>

                {/* Visibility */}
                <View style={styles.section}>
                    <Text style={styles.label}>Visibility</Text>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            onPress={() => setVisibility(true)}
                            style={[styles.toggleBtn, visibility && styles.toggleBtnActive]}
                        >
                            <Text style={[styles.toggleText, visibility && styles.toggleTextActive]}>Public</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setVisibility(false)}
                            style={[styles.toggleBtn, !visibility && styles.toggleBtnActive]}
                        >
                            <Text style={[styles.toggleText, !visibility && styles.toggleTextActive]}>NMSU Only</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* NMSU Users */}
                {!visibility && (
                    <View style={[styles.section, styles.nmsuUserContainer, isMissing('users') && styles.inputError]}>
                        <Text style={styles.label}>Select Users (Emails)</Text>
                        <View>
                            <TextInput
                                placeholder="Search and select user email..."
                                placeholderTextColor="#9CA3AF"
                                value={nmsuUserInput}
                                onChangeText={handleNMSUUserInput}
                                style={[styles.textInput, { color: TEXT }]}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {filteredNMSUUsers.length > 0 && (
                                <View style={styles.dropdownContainer}>
                                    <ScrollView style={styles.dropdown} nestedScrollEnabled={true}>
                                        {filteredNMSUUsers.map((email) => (
                                            <TouchableOpacity
                                                key={email}
                                                style={styles.dropdownItem}
                                                onPress={() => handleSelectNMSUUser(email)}
                                            >
                                                <Text style={{ color: TEXT }}>{email}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        {selectedNMSUUsers.length > 0 && (
                            <View>
                                <Text style={styles.subLabel}>Selected Emails:</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                                    {selectedNMSUUsers.map((email) => (
                                        <View key={email} style={styles.selectedChip}>
                                            <Text style={{ color: '#fff', fontSize: 12, marginRight: 4 }}>{email}</Text>
                                            <TouchableOpacity onPress={() => handleRemoveNMSUUser(email)}>
                                                <Text style={{ color: '#fca5a5', fontSize: 14, fontWeight: '700' }}>×</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Submit */}
                <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
                    <Text style={styles.submitText}>
                        {isEditMode
                            ? "Save Changes"
                            : postType === "found" ? "Submit Found Item" : "Submit Lost Item"
                        }
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 20,
        color: "#111827",
    },
    section: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    subLabel: {
        fontSize: 13,
        fontWeight: "500",
        color: "#6B7280",
        marginBottom: 6,
        marginTop: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        backgroundColor: "#FAFAFA",
    },
    inputError: {
        borderColor: '#EF4444',
        borderWidth: 1.5,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#FAFAFA",
    },
    toggleRow: {
        flexDirection: "row",
        gap: 8,
    },
    toggleBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#F9FAFB",
    },
    toggleBtnActive: {
        backgroundColor: "#882345",
        borderColor: "#882345",
    },
    toggleText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    toggleTextActive: {
        color: "#fff",
    },
    imagePicker: {
        height: 180,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: "#D1D5DB",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#F9FAFB",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    imagePlaceholderIcon: {
        fontSize: 32,
    },
    imagePlaceholderText: {
        color: "#9CA3AF",
        fontSize: 14,
    },
    dateRow: {
        flexDirection: "row",
        gap: 10,
    },
    dateBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        padding: 12,
        backgroundColor: "#F9FAFB",
    },
    dateBtnIcon: {
        fontSize: 16,
    },
    dateBtnText: {
        fontSize: 14,
        fontWeight: "500",
    },
    submitBtn: {
        backgroundColor: "#882345",
        padding: 15,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: "#882345",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    submitText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "700",
        fontSize: 16,
    },
    nmsuUserContainer: {
        padding: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        backgroundColor: "#FAFAFA",
    },
    dropdownContainer: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: "#fff",
    },
    dropdown: {
        maxHeight: 150,
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#882345',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginRight: 6,
        marginBottom: 6,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: BG,
        borderRadius: 20,
        height: '80%',
        width: '90%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        padding: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        padding: 5,
        position: 'absolute',
        right: 10,
        top: 10,
    },
    closeButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT,
    },
    modalHeaderText: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: TEXT,
    },
    modalBody: {
        flex: 1,
        paddingHorizontal: 15,
    },
    searchBarContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchBar: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        padding: 10,
        backgroundColor: BG,
        color: TEXT,
    },
    listItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    listItemTitle: {
        fontWeight: 'bold',
        color: TEXT,
    },
    listItemText: {
        fontSize: 14,
        color: TEXT,
    },
    modalFooter: {
        padding: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    modalSubmitButton: {
        backgroundColor: "#882345",
        padding: 12,
        borderRadius: 10,
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    radioGroup: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 8,
        minWidth: 150,
        marginBottom: 5,
    },
    radioLabel: {
        fontSize: 14,
        marginBottom: 5,
        fontWeight: '500',
        color: TEXT,
    },
    radioOptions: {
        flexDirection: 'row',
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    selectedCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: CRIMSON,
    },
    radioText: {
        fontSize: 16,
        color: TEXT,
    },
    statusView: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: BORDER,
    },
    statusText: {
        fontSize: 14,
        color: TEXT,
        marginBottom: 5,
    },
});
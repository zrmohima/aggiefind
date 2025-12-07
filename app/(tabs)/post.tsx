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
    { label: "Zuhl Library", value: "Zuhl Library" },
    { label: "Corbett Center", value: "Corbett Center" },
    { label: "Student Union Building", value: "Student Union Building" },
    { label: "Frenger Mall", value: "Frenger Mall" }
];

export default function PostScreen() {
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
        });
        if (!result.canceled) setImage(result.assets[0].uri);
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
        fetch('http://localhost:4000/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const similar = await fetchSimilarItems(newItem);

        if (similar.length > 0) {
            setSimilarItems(similar);
            setModalVisible(true);
        } else {
            postItemToApi(newItem);
            resetForm();
        }
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
            loc: loc.trim(),
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
                                    setModalVisible(false);
                                    Alert.alert("Submission Logic", "Item will be submitted as 'Found' now.");
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

            {SimilarItemsModal()}

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Post an Item</Text>

                <View style={{ marginBottom: 16 }}>
                    <Text style={{ marginBottom: 6 }}>Post Type</Text>
                    <View style={{ flexDirection: "row" }}>
                        <TouchableOpacity onPress={() => setPostType("lost")} style={{ padding: 8, marginRight: 8, backgroundColor: postType === "lost" ? "#882345" : "#f0f0f0", borderRadius: 5 }}>
                            <Text style={{ color: postType === "lost" ? "#fff" : "#111827" }}>Lost</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setPostType("found")} style={{ padding: 8, backgroundColor: postType === "found" ? "#882345" : "#f0f0f0", borderRadius: 5 }}>
                            <Text style={{ color: postType === "found" ? "#fff" : "#111827" }}>Found</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TextInput placeholder="Title" placeholderTextColor="#9CA3AF" value={name} onChangeText={(text) => { setName(text); text != "" && setMissingFields(missingFields.filter(field => field != "name")); }} style={[styles.textInput, { color: TEXT }, isMissing('name') && styles.inputError]} />

                <TouchableOpacity onPress={pickImage} style={{ height: 180, borderWidth: 2, borderStyle: "dashed", borderRadius: 5, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
                    {image ? <Image source={{ uri: image }} style={{ width: "100%", height: "100%", borderRadius: 5 }} /> : <Text style={{ color: "#9CA3AF" }}>Tap to add image</Text>}
                </TouchableOpacity>

                <TextInput placeholder="Description" placeholderTextColor="#9CA3AF" value={desc} onChangeText={(text) => { setDesc(text); text != "" && setMissingFields(missingFields.filter(field => field != "desc")); }} multiline style={[styles.textInput, { color: TEXT, height: 100, textAlignVertical: 'top' }, isMissing('desc') && styles.inputError]} />

                <TextInput placeholder="Location" placeholderTextColor="#9CA3AF" value={loc} onChangeText={(text) => { setLoc(text); text != "" && setMissingFields(missingFields.filter(field => field != "loc")); }} multiline style={[styles.textInput, { color: TEXT }, isMissing('loc') && styles.inputError]} />

                <View style={styles.radioGroup}>
                    <Text style={styles.radioLabel}>Do you wish your item to be dropped off at a facility?</Text>
                    <View style={styles.radioOptions}>

                        <TouchableOpacity
                            style={styles.radioButton}
                            onPress={() => setWishToDrop(true)}
                        >
                            <View style={styles.radioCircle}>
                                {wishToDrop && <View style={styles.selectedCircle} />}
                            </View>
                            <Text style={styles.radioText}>Yes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.radioButton}
                            onPress={() => setWishToDrop(false)}
                        >
                            <View style={styles.radioCircle}>
                                {!wishToDrop && <View style={styles.selectedCircle} />}
                            </View>
                            <Text style={styles.radioText}>No</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {wishToDrop && (
                    <View style={{ marginBottom: 5 }}>
                        <Text style={{ marginBottom: 6, color: TEXT }}>Select Drop Location</Text>
                        <View style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
                            <Picker style={{ backgroundColor: BG, color: TEXT }} selectedValue={dropLoc} onValueChange={(v) => setDropLoc(v.toString())}>
                                {NMSU_DROPLOCATIONS.map((item) => (
                                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                                ))}
                            </Picker>
                        </View>
                        {/* New share-info question shown after drop location */}
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ marginBottom: 6, color: TEXT }}>Do you want to share your information?</Text>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity onPress={() => setShareInfo(true)} style={{ padding: 8, marginRight: 8, backgroundColor: shareInfo ? "#882345" : "#f0f0f0", borderRadius: 5 }}>
                                    <Text style={{ color: shareInfo ? "#fff" : "#111827" }}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShareInfo(false)} style={{ padding: 8, backgroundColor: shareInfo ? "#f0f0f0" : "#882345", borderRadius: 5 }}>
                                    <Text style={{ color: shareInfo ? "#111827" : "#fff" }}>No</Text>
                                </TouchableOpacity>
                            </View>

                            {shareInfo && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={{ marginBottom: 6, color: TEXT }}>Contact name</Text>
                                    <TextInput
                                        placeholder="Your name"
                                        placeholderTextColor="#9CA3AF"
                                        value={contactName}
                                        onChangeText={(t) => { setContactName(t); t != "" && setMissingFields(missingFields.filter(f => f !== 'contactName')); }}
                                        style={[styles.textInput, { color: TEXT }, isMissing('contactName') && styles.inputError]}
                                    />

                                    <Text style={{ marginBottom: 6, marginTop: 8, color: TEXT }}>Phone number</Text>
                                    <TextInput
                                        placeholder="e.g., 575-123-4567"
                                        placeholderTextColor="#9CA3AF"
                                        value={contactPhone}
                                        onChangeText={(t) => { setContactPhone(t); t != "" && setMissingFields(missingFields.filter(f => f !== 'contactPhone')); }}
                                        style={[styles.textInput, { color: TEXT }, isMissing('contactPhone') && styles.inputError]}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            )}
                        </View>
                    </View>)}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                    <TouchableOpacity onPress={() => showDateTimePicker("date")} style={{ flex: 1, borderWidth: 1, borderRadius: 5, padding: 12, alignItems: "center" }}>
                        <Text style={{ color: TEXT }}>{new Date(dateTime).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => showDateTimePicker("time")} style={{ flex: 1, borderWidth: 1, borderRadius: 5, padding: 12, alignItems: "center" }}>
                        <Text style={{ color: TEXT }}>{new Date(dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                    </TouchableOpacity>
                </View>

                {showPicker && <DateTimePicker value={dateTime} mode={pickerMode as "date" | "time"} display={Platform.OS === "ios" ? "inline" : "default"} onChange={onChange} />}

                <View style={{ marginBottom: 16 }}>
                    <Text style={{ marginBottom: 6 }}>Visibility</Text>
                    <View style={{ flexDirection: "row" }}>
                        <TouchableOpacity onPress={() => setVisibility(true)} style={{ padding: 8, marginRight: 8, backgroundColor: visibility ? "#882345" : "#f0f0f0", borderRadius: 5 }}>
                            <Text style={{ color: visibility ? "#fff" : "#111827" }}>Public</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setVisibility(false)} style={{ padding: 8, backgroundColor: visibility ? "#f0f0f0" : "#882345", borderRadius: 5 }}>
                            <Text style={{ color: visibility ? "#111827" : "#fff" }}>NMSU Only</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {!visibility && (
                    <View style={[styles.nmsuUserContainer, isMissing('users') && styles.inputError]}>
                        <Text style={{ marginBottom: 6, fontWeight: '600', color: TEXT }}>Select Users (Emails)</Text>

                        {/* Wrapper for dropdown positioning */}
                        <View>
                            <TextInput
                                placeholder="Search and select user email..."
                                placeholderTextColor="#9CA3AF"
                                value={nmsuUserInput}
                                onChangeText={handleNMSUUserInput}
                                style={{ borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 8, backgroundColor: BG, color: TEXT }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {/* Dropdown for Filtered Users (Fixed Height and Scrollable) */}
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
                                <Text style={{ marginTop: 8, fontWeight: '500', color: TEXT }}>Selected Emails:</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                                    {selectedNMSUUsers.map((email) => (
                                        <View key={email} style={styles.selectedChip}>
                                            <Text style={{ color: '#fff', fontSize: 12, marginRight: 4 }}>{email}</Text>
                                            <TouchableOpacity onPress={() => handleRemoveNMSUUser(email)}>
                                                <Text style={{ color: 'red', fontSize: 14 }}>x</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: "#882345", padding: 12, borderRadius: 5 }}>
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
                        {isEditMode
                            ? "Save Changes"
                            : (postType === "found" ? "Submit Found Item" : "Submit Lost Item")
                        }
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    inputError: {
        borderColor: '#FF0000',
        borderWidth: 2,
    },
    nmsuUserContainer: {
        marginBottom: 16,
        padding: 10,
        borderWidth: 1,
        borderRadius: 5,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 12,
    },
    dropdownContainer: {
        zIndex: 10,
        borderRadius: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ccc',
    },

    dropdown: {
        maxHeight: 150
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },

    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#882345',
        borderRadius: 5,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginRight: 6,
        marginBottom: 6
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
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        padding: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
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
        borderBottomColor: '#ccc',
    },
    searchBar: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 5,
        padding: 10,
        backgroundColor: BG,
        color: TEXT,
    },
    listItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
        borderTopColor: '#ccc',
    },

    modalSubmitButton: {
        backgroundColor: "#882345",
        padding: 12,
        borderRadius: 10,
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
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
    }
});
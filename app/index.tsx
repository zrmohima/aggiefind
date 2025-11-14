import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  Text, TextInput,
  View
} from 'react-native';

const BG = '#FFFFFF';           // app background -> white
const TEXT = '#0B0B0B';         // primary text on white background
const INV_TEXT = '#FFFFFF';     // text used on dark surfaces (cards/header)
const SUB = '#6B7280';          // secondary text
const BORDER = '#E5E7EB';
const CARD = '#111827';
const ACCENT_ADD = '#650015';    // crimson for header / add
const ACCENT_LIST = '#1D4ED8';
const ACCENT_ADD_P = '#aa1526';
const ACCENT_LIST_P = '#2563EB';

// Remote patterned texture (subtle)
const HOME_BG_URI = 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=60';

type LostItem = {
  id: string;
  name: string;
  description: string;
  location: string;
  dateFound: string;
  foundBy: string;
  found: boolean;
  verified: boolean;
  verifiedBy?: string;
  createdAt: number;
};

export default function Index() {
  const [mode, setMode] = useState<'home' | 'add' | 'list' | 'search'>('home');

  // form state
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loc, setLoc] = useState('');
  const [dateFound, setDateFound] = useState(new Date().toISOString().slice(0, 10));
  const [foundBy, setFoundBy] = useState('');

  // item list (in-memory)
  const [items, setItems] = useState<LostItem[]>([]);

  // search state
  const [query, setQuery] = useState('');

  const valid = name.trim().length > 0;

  // Load items from backend
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

  // Load items when list view opens
  useEffect(() => {
    if (mode === 'list' || mode === 'search') {
      loadItemsFromBackend();
    }
  }, [mode]);

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
      found: false,
      verified: false,  // New items start as unverified (pending admin approval)
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
        Alert.alert('Success', 'Item submitted! Admin will review and approve it.');
        // Add to local list
        setItems(prev => [data, ...prev]);
        // Clear form
        setName(''); setDesc(''); setLoc(''); setDateFound(new Date().toISOString().slice(0, 10)); setFoundBy('');
        setMode('list');
      })
      .catch(err => {
        Alert.alert('Error', 'Could not submit item: ' + String(err).slice(0, 50));
      });
  };

  const toggleFound = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, found: !it.found } : it));
  };

  // compute filtered results for search (case-insensitive)
  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    return items.filter(it => {
      return (
        it.name.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.location.toLowerCase().includes(q) ||
        it.foundBy.toLowerCase().includes(q)
      );
    });
  })();

  const openEmail = () => {
    const email = 'aggiefind@nmsu.edu';
    const subject = encodeURIComponent('Lost & Found Inquiry');
    Linking.openURL(`mailto:${email}?subject=${subject}`).catch(() => {
      Alert.alert('Unable to open mail client');
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ padding: 16, backgroundColor: ACCENT_ADD, borderBottomWidth: 1, borderColor: BORDER }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Logo />
          <View>
            <Text accessibilityRole="header" style={{ color: INV_TEXT, fontSize: 36, fontWeight: '800' }}>
              AggieFind
            </Text>
            <Text style={{ color: INV_TEXT, marginTop: 4, textAlign: 'center' }}>
              Hello World - Welcome to NMSU Lost & Found
            </Text>
          </View>
        </View>
      </View>

      {/* Home buttons */}
      {mode === 'home' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
          {/* Patterned, subtle background behind the home content.
              pointerEvents='none' ensures buttons remain tappable. */}
          <HomeBackground />

          <Button title="Add a Lost Item" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={() => setMode('add')} />
          <Button title="Show a List of Lost Items" bg={ACCENT_LIST} bgPressed={ACCENT_LIST_P} onPress={() => setMode('list')} />
          <Button title="Search Lost Items" bg={ACCENT_LIST} bgPressed={ACCENT_LIST_P} onPress={() => { setQuery(''); setMode('search'); }} />
        </View>
      )}

      {/* Add form */}
      {mode === 'add' && (
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
              <Button title="Back" kind="ghost" onPress={() => setMode('home')} />
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* List view - Shows only APPROVED items */}
      {mode === 'list' && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700' }}>Approved Lost Items</Text>
            <Button title="Back" kind="ghost" onPress={() => setMode('home')} />
          </View>

          {/* Only show verified/approved items */}
          <FlatList
            data={items.filter(it => it.verified)}
            keyExtractor={(it: LostItem) => it.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <Text style={{ color: SUB, textAlign: 'center', marginTop: 24 }}>
                No approved items yet. Check back soon!
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

                  {/* Status badge - Shows if found or not */}
                  <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: item.found ? '#22c55e' : '#fbbf24' }}>
                    <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>
                      {item.found ? 'FOUND' : 'MISSING'}
                    </Text>
                  </View>
                </View>

                {item.description ? <Text style={{ color: INV_TEXT }}>{item.description}</Text> : null}
                {item.location ? <Text style={{ color: SUB }}>Found at: {item.location}</Text> : null}
                {item.dateFound ? <Text style={{ color: SUB }}>Found on: {item.dateFound}</Text> : null}
                {item.foundBy ? <Text style={{ color: SUB }}>Found by: {item.foundBy}</Text> : null}
                {item.verifiedBy ? <Text style={{ color: SUB, fontSize: 11 }}>Verified by: {item.verifiedBy}</Text> : null}
              </View>
            )}
          />

          <View style={{ height: 12 }} />
          <Button title="Add a Lost Item" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={() => setMode('add')} />
        </View>
      )}

      {/* Search view - Shows only APPROVED items that match query */}
      {mode === 'search' && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700' }}>Search Lost Items</Text>
            <Button title="Back" kind="ghost" onPress={() => setMode('home')} />
          </View>

          <Field label="Search by name, description, location, or finder">
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="e.g., MacBook, Zuhl, John"
            />
          </Field>

          <View style={{ height: 12 }} />

          {/* Only search through verified items */}
          <FlatList
            data={filtered.filter(it => it.verified)}
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
                  <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: item.found ? '#22c55e' : '#fbbf24' }}>
                    <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>
                      {item.found ? 'FOUND' : 'MISSING'}
                    </Text>
                  </View>
                </View>

                {item.description ? <Text style={{ color: INV_TEXT }}>{item.description}</Text> : null}
                {item.location ? <Text style={{ color: SUB }}>Found at: {item.location}</Text> : null}
                {item.dateFound ? <Text style={{ color: SUB }}>Found on: {item.dateFound}</Text> : null}
                {item.foundBy ? <Text style={{ color: SUB }}>Found by: {item.foundBy}</Text> : null}
                {item.verifiedBy ? <Text style={{ color: SUB, fontSize: 11 }}>Verified by: {item.verifiedBy}</Text> : null}
              </View>
            )}
          />
        </View>
      )}

      {/* Footer / Contact Us */}
      <View style={{ borderTopWidth: 1, borderColor: BORDER, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: BG }}>
        <Text style={{ color: TEXT, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>Contact Us</Text>
        <Text style={{ color: SUB, textAlign: 'center', marginTop: 6 }}>
          Questions or found an item? Reach out to us.
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 }}>
          <Pressable onPress={openEmail} style={({ pressed }) => ({ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: pressed ? '#f3f4f6' : '#fff' })}>
            <Text style={{ color: ACCENT_ADD, fontWeight: '700' }}>Email: aggiefind@nmsu.edu</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Small helpers ---------- */

function HomeBackground() {
  // Uses a remote subtle patterned photo with blur and a light maroon tint overlay.
  return (
    <ImageBackground
      source={{ uri: HOME_BG_URI }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      imageStyle={{
        // gentle blur (works on iOS/Android) and low opacity so it's decorative only
        opacity: 0.6,
      }}
      blurRadius={6}
    >
      {/* subtle tint to tie the pattern to the Aggie colors */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(101,0,21,0.04)' }} />
    </ImageBackground>
  );
}

// tiny helper to avoid repeating absolute fill style
const StyleSheetAbsoluteFill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

function Logo() {
  // simple inline logo (letter A inside a white circle) so no image asset is required
  return (
    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: INV_TEXT, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <Text style={{ color: ACCENT_ADD, fontSize: 20, fontWeight: '900' }}>A</Text>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: TEXT, fontSize: 14 }}>{label}</Text>
      {children}
    </View>
  );
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#9CA3AF"
      style={[{
        backgroundColor: CARD,
        color: INV_TEXT,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER
      }, props.style]}
    />
  );
}

function Button({
  title, onPress, kind = 'primary',
  bg = ACCENT_ADD, bgPressed = ACCENT_ADD_P
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost';
  bg?: string;
  bgPressed?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: kind === 'ghost' ? (pressed ? '#F3F4F6' : 'transparent') : (pressed ? bgPressed : bg),
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: kind === 'ghost' ? 1 : 0,
        borderColor: kind === 'ghost' ? BORDER : 'transparent',
        minWidth: 180
      })}
    >
      <Text style={{ color: kind === 'ghost' ? TEXT : INV_TEXT, fontSize: 16, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

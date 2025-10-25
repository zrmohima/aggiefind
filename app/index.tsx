import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text, TextInput,
  View
} from 'react-native';

const BG = '#0B0B0B';
const FG = '#FFFFFF';
const SUB = '#D1D5DB';
const BORDER = '#374151';
const CARD = '#111827';
const ACCENT_ADD = '#9D2235';    
const ACCENT_LIST = '#1D4ED8';   
const ACCENT_ADD_P = '#7f1d1d';
const ACCENT_LIST_P = '#2563EB';

type LostItem = {
  id: string;
  name: string;
  description: string;
  location: string;   
  dateFound: string;  
  foundBy: string;    
  found: boolean;     
};

export default function Index() {
  const [mode, setMode] = useState<'home' | 'add' | 'list'>('home');

  // form state
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loc, setLoc] = useState('');
  const [dateFound, setDateFound] = useState(new Date().toISOString().slice(0, 10));
  const [foundBy, setFoundBy] = useState('');

  // item list (in-memory)
  const [items, setItems] = useState<LostItem[]>([]);

  const valid = name.trim().length > 0;

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
    };
    setItems(prev => [newItem, ...prev]);
    // clear and go to list
    setName(''); setDesc(''); setLoc(''); setDateFound(new Date().toISOString().slice(0, 10)); setFoundBy('');
    setMode('list');
  };

  const toggleFound = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, found: !it.found } : it));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: BORDER, alignItems: 'center' }}>
        <Text accessibilityRole="header" style={{ color: FG, fontSize: 36, fontWeight: '800' }}>
          AggieFind
        </Text>
        <Text style={{ color: SUB, marginTop: 4, textAlign: 'center' }}>
          Hello World - Welcome to NMSU Lost & Found
        </Text>
      </View>

      {/* Home buttons */}
      {mode === 'home' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
          <Button title="Add a Lost Item" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={() => setMode('add')} />
          <Button title="Show a List of Lost Items" bg={ACCENT_LIST} bgPressed={ACCENT_LIST_P} onPress={() => setMode('list')} />
        </View>
      )}

      {/* Add form */}
      {mode === 'add' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, padding: 16, gap: 16 }}>
            <Text style={{ color: FG, fontSize: 18, fontWeight: '700' }}>Add Lost Item</Text>

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

      {/* List view */}
      {mode === 'list' && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: FG, fontSize: 18, fontWeight: '700' }}>Lost Items</Text>
            <Button title="Back" kind="ghost" onPress={() => setMode('home')} />
          </View>

          <FlatList
            data={items}
            keyExtractor={(it: LostItem) => it.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <Text style={{ color: SUB, textAlign: 'center', marginTop: 24 }}>
                No items yet. Add one first.
              </Text>
            }
            renderItem={({ item }: { item: LostItem }) => (
              <View style={{
                backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 14,
                padding: 12, gap: 6
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: FG, fontSize: 16, fontWeight: '700' }}>
                    {item.name}
                  </Text>

                  {/* Tick box (found status) */}
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.found }}
                    onPress={() => toggleFound(item.id)}
                    style={({ pressed }) => ({
                      width: 26, height: 26, borderRadius: 6, borderWidth: 2,
                      borderColor: item.found ? '#22c55e' : BORDER,
                      backgroundColor: item.found ? '#22c55e' : (pressed ? '#1f2937' : CARD),
                      alignItems: 'center', justifyContent: 'center'
                    })}
                  >
                    {item.found ? <Text style={{ color: '#0b0b0b', fontWeight: '900' }}>✓</Text> : null}
                  </Pressable>
                </View>

                {item.description ? <Text style={{ color: FG }}>{item.description}</Text> : null}
                {item.location ? <Text style={{ color: SUB }}>Found at: {item.location}</Text> : null}
                {item.dateFound ? <Text style={{ color: SUB }}>Found on: {item.dateFound}</Text> : null}
                {item.foundBy ? <Text style={{ color: SUB }}>Found by: {item.foundBy}</Text> : null}
              </View>
            )}
          />

          <View style={{ height: 12 }} />
          <Button title="Add a Lost Item" bg={ACCENT_ADD} bgPressed={ACCENT_ADD_P} onPress={() => setMode('add')} />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ---------- Small helpers ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: FG, fontSize: 14 }}>{label}</Text>
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
        color: FG,
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
        backgroundColor: kind === 'ghost' ? (pressed ? '#1f2937' : 'transparent') : (pressed ? bgPressed : bg),
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: kind === 'ghost' ? 1 : 0,
        borderColor: kind === 'ghost' ? BORDER : 'transparent',
        minWidth: 180
      })}
    >
      <Text style={{ color: FG, fontSize: 16, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

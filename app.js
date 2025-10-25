import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text, TextInput,
    View
} from 'react-native';

const COLORS = {
  bg: '#0B0B0B',
  text: '#FFFFFF',
  sub: '#D1D5DB',
  card: '#111827',
  stroke: '#374151',
  brand: '#9D2235',
  brandAlt: '#7f1d1d',
};
const CATEGORIES = ['Electronics', 'IDs/Cards', 'Keys', 'Clothing', 'Bottles', 'Books', 'Other'];
const BUILDINGS = [
  'Corbett Center', 'Zuhl Library', 'Branson Library', 'Engineering Complex',
  'Pan Am Center', 'Aggie Memorial', 'Gerald Thomas', 'Aggie Health & Wellness',
  'Jett Hall', 'Goddard Hall', 'Hardman & Jacobs', 'Other'
];

function Section({ title, children }) {
  return (
    <View style={{ gap: 8, marginBottom: 16 }}>
      <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Field({ label, children, helper }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: COLORS.text, fontSize: 14 }}>{label}</Text>
      {children}
      {helper ? (
        <Text style={{ color: COLORS.sub, fontSize: 12 }}>{helper}</Text>
      ) : null}
    </View>
  );
}

function Input(props) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#9CA3AF"
      style={[{
        backgroundColor: COLORS.card,
        color: COLORS.text,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.stroke
      }, props.style]}
    />
  );
}

function Pill({ selected, onPress, label, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.stroke,
        backgroundColor: selected ? COLORS.brand : (pressed ? '#1f2937' : COLORS.card),
      })}
    >
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: selected ? '700' : '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Button({ title, onPress, kind = 'primary', disabled }) {
  const styles = {
    primary: {
      bg: COLORS.brand,
      bgPressed: COLORS.brandAlt,
      text: '#fff',
    },
    ghost: {
      bg: 'transparent',
      bgPressed: '#1f2937',
      text: '#fff',
      border: COLORS.stroke,
    }
  }[kind];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: pressed ? styles.bgPressed : styles.bg,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
        borderWidth: styles.border ? 1 : 0,
        borderColor: styles.border || 'transparent',
        opacity: disabled ? 0.6 : 1
      })}
    >
      <Text style={{ color: styles.text, fontSize: 16, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

// item: { id, type: 'lost'|'found', title, category, building, date, description, contact, status: 'open'|'claimed' }
function ItemCard({ item, onClaim }) {
  return (
    <View
      accessibilityRole="summary"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.stroke,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>
        {item.title} <Text style={{ color: COLORS.sub, fontSize: 12 }}>({item.type})</Text>
      </Text>
      <Text style={{ color: COLORS.sub, fontSize: 13 }}>
        {item.category} • {item.building} • {item.date}
      </Text>
      {item.description ? (
        <Text style={{ color: COLORS.text, fontSize: 14 }}>{item.description}</Text>
      ) : null}
      {item.contact ? (
        <Text style={{ color: COLORS.sub, fontSize: 13 }}>Contact: {item.contact}</Text>
      ) : null}
      <View style={{ marginTop: 8 }}>
        {item.status === 'open' ? (
          <Button title="Mark as Claimed" onPress={() => onClaim?.(item)} />
        ) : (
          <Text style={{ color: '#22c55e', fontWeight: '700' }}>✅ Claimed</Text>
        )}
      </View>
    </View>
  );
}

function FilterRow({ selectedCat, setSelectedCat, selectedBldg, setSelectedBldg }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: COLORS.text, fontWeight: '700' }}>Filter</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pill
            selected={!selectedCat}
            label="All Categories"
            onPress={() => setSelectedCat(null)}
          />
          {CATEGORIES.map(cat => (
            <Pill
              key={cat}
              selected={selectedCat === cat}
              label={cat}
              onPress={() => setSelectedCat(cat)}
            />
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <Pill
            selected={!selectedBldg}
            label="All Buildings"
            onPress={() => setSelectedBldg(null)}
          />
          {BUILDINGS.map(b => (
            <Pill
              key={b}
              selected={selectedBldg === b}
              label={b}
              onPress={() => setSelectedBldg(b)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// --- Main App ---
export default function App() {
  const [tab, setTab] = useState('browse'); 
  const [items, setItems] = useState([
    {
      id: 'seed-1',
      type: 'lost',
      title: 'Student ID (Crimson Card)',
      category: 'IDs/Cards',
      building: 'Zuhl Library',
      date: '2025-10-20',
      description: 'Blue lanyard. Last seen on 2nd floor.',
      contact: 'example@nmsu.edu',
      status: 'open',
      mine: false,
    },
    {
      id: 'seed-2',
      type: 'found',
      title: 'Hydro Flask Bottle',
      category: 'Bottles',
      building: 'Corbett Center',
      date: '2025-10-22',
      description: 'Black 32oz with stickers.',
      contact: 'example@nmsu.edu',
      status: 'open',
      mine: false,
    },
  ]);

  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedBldg, setSelectedBldg] = useState(null);

  const visibleItems = useMemo(() => {
    return items.filter(it =>
      (!selectedCat || it.category === selectedCat) &&
      (!selectedBldg || it.building === selectedBldg)
    );
  }, [items, selectedCat, selectedBldg]);

  const myItems = useMemo(() => items.filter(i => i.mine), [items]);

  function addItem(newItem) {
    setItems(prev => [{ ...newItem, id: String(Date.now()), status: 'open' }, ...prev]);
    setTab('mine');
  }

  function claimItem(it) {
    setItems(prev => prev.map(p => (p.id === it.id ? { ...p, status: 'claimed' } : p)));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar style="light" />
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: COLORS.stroke }}>
        <Text
          accessibilityRole="header"
          style={{ color: COLORS.text, fontSize: 24, fontWeight: '800', textAlign: 'center' }}
        >
          AggieFind
        </Text>
        <Text style={{ color: COLORS.sub, textAlign: 'center', marginTop: 4 }}>
          NMSU Campus Lost & Found
        </Text>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        gap: 8,
        padding: 12,
        borderBottomWidth: 1,
        borderColor: COLORS.stroke,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {[
          ['browse', 'Browse'],
          ['lost', 'Report Lost'],
          ['found', 'Report Found'],
          ['mine', 'My Reports']
        ].map(([key, label]) => (
          <Pill key={key} selected={tab === key} onPress={() => setTab(key)} label={label} />
        ))}
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {tab === 'browse' && (
          <View style={{ flex: 1, padding: 16, gap: 16 }}>
            <FilterRow
              selectedCat={selectedCat}
              setSelectedCat={setSelectedCat}
              selectedBldg={selectedBldg}
              setSelectedBldg={setSelectedBldg}
            />
            <FlatList
              data={visibleItems}
              keyExtractor={(it) => it.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => (
                <ItemCard item={item} onClaim={claimItem} />
              )}
              ListEmptyComponent={
                <Text style={{ color: COLORS.sub, textAlign: 'center', marginTop: 24 }}>
                  No items match your filters yet.
                </Text>
              }
            />
          </View>
        )}

        {tab === 'lost' && (
          <ReportForm type="lost" onSubmit={(payload) => addItem({ ...payload, mine: true })} />
        )}

        {tab === 'found' && (
          <ReportForm type="found" onSubmit={(payload) => addItem({ ...payload, mine: true })} />
        )}

        {tab === 'mine' && (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
              My Reports
            </Text>
            <FlatList
              data={myItems}
              keyExtractor={(it) => it.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => (
                <ItemCard item={item} onClaim={claimItem} />
              )}
              ListEmptyComponent={
                <Text style={{ color: COLORS.sub, textAlign: 'center', marginTop: 24 }}>
                  You haven’t submitted anything yet.
                </Text>
              }
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Report Form component ---
function ReportForm({ type, onSubmit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [building, setBuilding] = useState(BUILDINGS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');

  const valid = title.trim().length > 1 && contact.trim().length > 3;

  function handleSubmit() {
    if (!valid) return;
    onSubmit({
      type,
      title: title.trim(),
      category,
      building,
      date,
      description: description.trim(),
      contact: contact.trim(),
    });
    // clear
    setTitle(''); setDescription(''); setContact('');
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 60 }}>
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>
          {type === 'lost' ? 'Report Lost Item' : 'Report Found Item'}
        </Text>

        <Section title="Basics">
          <Field label="Title" helper="Short, descriptive (e.g., 'Silver MacBook Pro 13”')">
            <Input value={title} onChangeText={setTitle} placeholder="Item title" />
          </Field>

          <Field label="Category">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <Pill key={c} selected={category === c} label={c} onPress={() => setCategory(c)} />
                ))}
              </View>
            </ScrollView>
          </Field>

          <Field label="Building / Area">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {BUILDINGS.map(b => (
                  <Pill key={b} selected={building === b} label={b} onPress={() => setBuilding(b)} />
                ))}
              </View>
            </ScrollView>
          </Field>

          <Field label="Date (YYYY-MM-DD)">
            <Input value={date} onChangeText={setDate} placeholder="2025-10-24" />
          </Field>
        </Section>

        <Section title="Details">
          <Field label="Description" helper="Color, stickers, unique marks, case, etc.">
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Extra identifying info"
              style={{ height: 90, textAlignVertical: 'top' }}
              multiline
            />
          </Field>

          <Field label="Contact (email or phone)">
            <Input value={contact} onChangeText={setContact} placeholder="your@nmsu.edu" />
          </Field>
        </Section>

        <Button title={`Submit ${type === 'lost' ? 'Lost' : 'Found'} Report`} onPress={handleSubmit} disabled={!valid} />
      </ScrollView>
    </View>
  );
}

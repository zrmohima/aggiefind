import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

export default function Header({ title }) {
    const router = useRouter();
    let user = null;

    try {
        if (Platform.OS == 'web' && typeof window !== 'undefined') {
            const store = window.sessionStorage || window.localStorage;
            const u = store.getItem('aggiefind_user');
            if (u) user = JSON.parse(u);
        }
    } catch (e) { }

    const handleLogout = () => {
        if (Platform.OS == 'web' && typeof window !== 'undefined') {
            const store = window.sessionStorage || window.localStorage;
            store.removeItem('aggiefind_token');
            store.removeItem('aggiefind_user');
            router.replace('/');
        }
    };

    return (
        <View style={{ backgroundColor: '#882345', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>{title}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {user ? (
                    <>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: 'white', fontWeight: '700' }}>{user.name || user.username}</Text>
                            {user.email ? <Text style={{ color: 'white', fontSize: 12 }}>{user.email}</Text> : null}
                        </View>

                        <TouchableOpacity
                            onPress={handleLogout}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>Log Out</Text>
                            <Ionicons name="log-out-outline" size={18} color="white" />
                        </TouchableOpacity>
                    </>
                ) : null}
            </View>
        </View>
    );
}
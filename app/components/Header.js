// components/Header.js
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function Header({ title }) {
    let user = null;
    try {
        if (typeof window !== 'undefined') {
            // read from sessionStorage so header reflects the user for this tab only
            const store = window.sessionStorage || window.localStorage;
            const u = store.getItem('aggiefind_user');
            if (u) user = JSON.parse(u);
        }
    } catch (e) { }

    return (
        <View style={{ backgroundColor: '#882345', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>{title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {user ? (
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: 'white', fontWeight: '700' }}>{user.name || user.username}</Text>
                        {user.email ? <Text style={{ color: 'white', fontSize: 12 }}>{user.email}</Text> : null}
                    </View>
                ) : (
                    <TouchableOpacity>
                        <Ionicons name="person-circle-outline" size={26} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
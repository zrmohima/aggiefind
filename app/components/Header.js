// components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ title }) {
    return (
        <View style={{ backgroundColor: '#882345', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>{title}</Text>
            <TouchableOpacity>
                <Ionicons name="person-circle-outline" size={26} color="white" />
            </TouchableOpacity>
        </View>
    );
}
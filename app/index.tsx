import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Header from './components/Header';
import Field from './components/Field';
import Input from './components/Input';
import Button from './components/Button';
import { BG, SUB, TEXT } from './constants/color';

export default function LoginScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [email, setEmail] = useState('');

    const onLogin = () => {
        // No verification requested — just navigate to the main tabs
        // In future we could persist the student info to AsyncStorage here.
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <Header title="Login" />
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700' }}>Welcome to AggieFind.</Text>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
                <Field label="Student name">
                    <Input value={name} onChangeText={setName} placeholder="e.g., John Doe" />
                </Field>

                <Field label="Student ID">
                    <Input value={studentId} onChangeText={setStudentId} placeholder="e.g., 12345678" keyboardType="default" />
                </Field>

                <Field label="Email">
                    <Input value={email} onChangeText={setEmail} placeholder="e.g., jane@nmsu.edu" keyboardType="email-address" />
                </Field>

                <View style={{ height: 8 }} />

                <Button title="Login" onPress={onLogin} />

                <Text style={{ color: SUB, marginTop: 8, fontSize: 13 }}>
                    Press Login to continue.
                </Text>
            </View>
        </SafeAreaView>
    );
}

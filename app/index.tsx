import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from './components/Button';
import Field from './components/Field';
import Header from './components/Header';
import Input from './components/Input';
import { BG, SUB, TEXT } from './constants/color';

export default function AuthScreen() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'register'>('login');

    // login fields
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // register fields
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    const doRegister = async () => {
        if (!regEmail || !regPassword) {
            Alert.alert('Missing fields', 'Please provide email and password');
            return;
        }
        try {
            const r = await fetch('http://localhost:4000/api/user/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: regEmail, password: regPassword, name: regName, email: regEmail })
            });
            if (r.status === 201) {
                Alert.alert('Registered', 'Account created — please login.');
                setMode('login');
                setRegName(''); setRegEmail(''); setRegPassword('');
            } else {
                const err = await r.json();
                Alert.alert('Error', err.error || 'Could not register');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not reach server');
        }
    };

    const doLogin = async () => {
        if (!loginUsername || !loginPassword) {
            Alert.alert('Missing', 'Provide username and password');
            return;
        }
        try {
            const r = await fetch('http://localhost:4000/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUsername, password: loginPassword })
            });
            if (!r.ok) {
                const err = await r.json();
                Alert.alert('Login failed', err.error || 'Invalid credentials');
                return;
            }
            const data = await r.json();
            // store token and user for later
            try {
                if (typeof window !== 'undefined' && window.sessionStorage) {
                    // use sessionStorage so each browser tab maintains its own session
                    window.sessionStorage.setItem('aggiefind_token', data.token);
                    window.sessionStorage.setItem('aggiefind_user', JSON.stringify(data.user || { username: loginUsername }));
                }
            } catch (e) { }
            router.replace('/(tabs)');
        } catch (err) {
            Alert.alert('Error', 'Could not reach server');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <Header title={mode === 'login' ? 'Login' : 'Register'} />
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700' }}>Welcome to AggieFind.</Text>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button title="Login" kind={mode === 'login' ? 'primary' : 'ghost'} onPress={() => setMode('login')} style={{ width: '48%' }} />
                    <Button title="Register" kind={mode === 'register' ? 'primary' : 'ghost'} onPress={() => setMode('register')} style={{ width: '48%' }} />
                </View>

                {mode === 'register' ? (
                    <>
                        <Field label="Name">
                            <Input value={regName} onChangeText={setRegName} placeholder="Your name" />
                        </Field>
                        <Field label="Email">
                            <Input value={regEmail} onChangeText={setRegEmail} placeholder="you@nmsu.edu" keyboardType="email-address" />
                        </Field>
                        <Field label="Password">
                            <Input value={regPassword} onChangeText={setRegPassword} placeholder="password" secureTextEntry />
                        </Field>
                        <View style={{ height: 8 }} />
                        <Button title="Create account" onPress={doRegister} />
                    </>
                ) : (
                    <>
                        <Field label="Email">
                            <Input value={loginUsername} onChangeText={setLoginUsername} placeholder="you@nmsu.edu" keyboardType="email-address" />
                        </Field>
                        <Field label="Password">
                            <Input value={loginPassword} onChangeText={setLoginPassword} placeholder="password" secureTextEntry />
                        </Field>
                        <View style={{ height: 8 }} />
                        <Button title="Login" onPress={doLogin} />
                    </>
                )}

                <Text style={{ color: SUB, marginTop: 8, fontSize: 13 }}>
                    Use Register to create an account, then Login to enter the app. Tip: click the "Register" tab above to fill the registration form.
                </Text>
            </View>
        </SafeAreaView>
    );
}

import AntDesign from '@expo/vector-icons/AntDesign';
import Foundation from '@expo/vector-icons/Foundation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

export default function TabsLayout() {
    const router = useRouter();

    useEffect(() => {
        if (Platform.OS == 'web') {
            const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('aggiefind_token') : null;
            if (!token) {
                router.replace('/');
            }
        }
    }, []);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#882345',
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 84 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                }
            }}
        >
            <Tabs.Screen name="index" options={{
                title: 'Home', tabBarIcon: ({ color }) => (
                    <AntDesign name="home" size={20} color={color} />
                )
            }} />
            <Tabs.Screen name="post" options={{
                title: 'Post', tabBarIcon: ({ color }) => (
                    <MaterialIcons name="add-box" size={20} color={color} />
                )
            }} />
            <Tabs.Screen name="lost" options={{
                title: 'My Items', tabBarIcon: ({ color }) => (
                    <Foundation name="alert" size={20} color={color} />
                )
            }} />
        </Tabs>
    );
}
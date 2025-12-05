// app/tabs/_layout.js
import AntDesign from '@expo/vector-icons/AntDesign';
import Foundation from '@expo/vector-icons/Foundation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabsLayout() {
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

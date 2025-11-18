// app/tabs/_layout.js
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Foundation from '@expo/vector-icons/Foundation';

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
                title: 'Lost', tabBarIcon: ({ color }) => (
                    <Foundation name="alert" size={20} color={color} />
                )
            }} />
        </Tabs>
    );
}

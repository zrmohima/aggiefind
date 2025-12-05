import { Pressable, Text } from "react-native";
import { ACCENT_ADD, ACCENT_ADD_P, BORDER, INV_TEXT, TEXT } from "../constants/color";

export default function Button({
    title, onPress, kind = 'primary',
    bg = ACCENT_ADD, bgPressed = ACCENT_ADD_P, style
}: {
    title: string;
    onPress: () => void;
    kind?: 'primary' | 'ghost';
    bg?: string;
    bgPressed?: string;
    style?: any
}) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: kind === 'ghost' ? (pressed ? '#F3F4F6' : 'transparent') : (pressed ? bgPressed : bg),
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 5,
                alignItems: 'center',
                borderWidth: kind === 'ghost' ? 1 : 0,
                borderColor: kind === 'ghost' ? BORDER : 'transparent',
                width: '100%',
                ...style
            })}
        >
            <Text style={{ color: kind === 'ghost' ? TEXT : INV_TEXT, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        </Pressable>
    );
}
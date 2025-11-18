import { TextInput } from "react-native";
import { CARD, BORDER, INV_TEXT } from "../constants/color";

export default function Input(props: any) {
    return (
        <TextInput
            {...props}
            placeholderTextColor="#9CA3AF"
            style={[{
                backgroundColor: CARD,
                color: INV_TEXT,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BORDER
            }, props.style]}
        />
    );
}
import { TextInput } from "react-native";
import { BG, BORDER, TEXT } from "../constants/color";

export default function Input(props: any) {
    return (
        <TextInput
            {...props}
            placeholderTextColor="#9CA3AF"
            style={[{
                backgroundColor: BG,
                color: TEXT,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: BORDER
            }, props.style]}
        />
    );
}
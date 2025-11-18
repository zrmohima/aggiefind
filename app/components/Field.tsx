import { Text, View } from "react-native";
import { TEXT } from "../constants/color";

export default function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: 8 }}>
            <Text style={{ color: TEXT, fontSize: 14 }}>{label}</Text>
            {children}
        </View>
    );
}
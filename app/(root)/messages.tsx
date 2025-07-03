import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";

const Messages = () => {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold">Messages for Chat ID: {id}</Text>
      {/* Message list and send box will go here */}
    </View>
  );
};

export default Messages;

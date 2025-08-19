import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import icons from "@/constants/icons";

export default function Security() {
  return (
    <View className="flex-1 bg-white">
      
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Image source={icons.backArrow} className="w-6 h-6" tintColor="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-rubik-bold">Security</Text>
      </View>

      {/* Content */}
      <ScrollView className="p-5">
        <Text className="text-lg font-rubik-bold mb-3">Your Security Matters</Text>
        <Text className="text-base text-black-200 mb-4">
          We take your privacy and data security seriously. 
          Our platform uses secure authentication, encrypted communication, 
          and follows industry best practices to safeguard your information.
        </Text>

        <Text className="text-lg font-rubik-bold mb-3">Tips</Text>
        <Text className="text-base text-black-200 mb-2">• Use a strong password</Text>
        <Text className="text-base text-black-200 mb-2">• Don not share login details</Text>
        <Text className="text-base text-black-200 mb-2">• Keep your app updated</Text>
      </ScrollView>
    </View>
  );
}

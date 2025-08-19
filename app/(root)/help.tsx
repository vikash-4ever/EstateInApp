import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import icons from "@/constants/icons";

export default function Help() {
  return (
    <View className="flex-1 bg-white">

      {/* Header */}
      <View className="flex-row items-center p-4 bg-black">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Image source={icons.backArrow} className="w-6 h-6" tintColor="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-rubik-bold">Help</Text>
      </View>

      {/* Content */}
      <ScrollView className="p-5">
        <Text className="text-lg font-rubik-bold mb-3">Need Assistance?</Text>
        <Text className="text-base text-black-200 mb-4">
          We’re here to help! If you face any issues while using the app, 
          please reach out to our support team.
        </Text>

        <Text className="text-lg font-rubik-bold mb-3">Contact Us</Text>
        <Text className="text-base text-black-200 mb-2">📧 vishwakarmavikash673@gmail.com</Text>
        <Text className="text-base text-black-200 mb-2">📞 +91-9644687080</Text>
      </ScrollView>
    </View>
  );
}

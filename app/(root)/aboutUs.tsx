import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import icons from "@/constants/icons";

export default function AboutUs() {
  return (
    <View className="flex-1 bg-white">

      {/* Header */}
      <View className="flex-row items-center p-4 bg-black">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Image source={icons.backArrow} className="w-6 h-6" tintColor="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-rubik-bold">About Us</Text>
      </View>

      {/* Content */}
      <ScrollView className="p-5">
        <Text className="text-lg font-rubik-bold mb-3">Welcome to EstateIn</Text>
        <Text className="text-base text-black-200 mb-4">
          EstateIn is a modern real estate platform designed to make property 
          discovery, booking, and communication simple and secure.
        </Text>

        <Text className="text-lg font-rubik-bold mb-3">Our Mission</Text>
        <Text className="text-base text-black-200 mb-4">
          We aim to connect buyers and sellers seamlessly with trusted tools, 
          transparent communication, and an easy-to-use interface.
        </Text>

        <Text className="text-lg font-rubik-bold mb-3">Our Values</Text>
        <Text className="text-base text-black-200 mb-2">• Trust</Text>
        <Text className="text-base text-black-200 mb-2">• Transparency</Text>
        <Text className="text-base text-black-200 mb-2">• Simplicity</Text>
      </ScrollView>
    </View>
  );
}

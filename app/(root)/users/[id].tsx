import { getUserPosts, getUserProfile } from "@/lib/appwrite";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Card } from "@/components/Cards";  // Card is imported here
import NoResults from "@/components/NoResults";
import { Models } from "react-native-appwrite";
import icons from "@/constants/icons";

// Define the Post type according to the properties you need
type Post = {
  $id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  rating: string;
  address: string;
};

const User = () => {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Models.Document[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userProfile = await getUserProfile(id as string);
        console.log("Fetched user profile:", userProfile);
        setUser(userProfile);
        setLoadingUser(false);

        const userPosts = await getUserPosts(id as string);
        setPosts(userPosts);
        setLoadingPosts(false);
      } catch (error) {
        console.error("Error fetching user or posts:", error);
        setLoadingUser(false);
        setLoadingPosts(false);
      }
    };

    if (id) fetchUserData();
  }, [id]);

  const openDial = () => {
    if (user?.phone) Linking.openURL(`tel:${user.phone}`);
  };

  const openEmail = () => {
    if (user?.email) Linking.openURL(`mailto:${user.email}`);
  };

  return (
    <SafeAreaView className="bg-white h-full">
      {/* Back Button */}
      <View className="p-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-200 rounded-full size-11 items-center justify-center"
        >
          <Image source={icons.backArrow} className="size-5" />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View>
        <Text className="ml-4 mt-5 text-black-300 font-rubik-medium">
          User Profile
        </Text>
      </View>
      
      <View className="flex-row items-center justify-between mt-4 mx-4">
        <View className="flex-row items-center">
          <Image
            source={{ uri: user?.avatar || "https://via.placeholder.com/150" }}
            className="size-14 rounded-full"
            resizeMode="cover"
          />
        </View>

        <View className="flex-1 mx-3">
          <Text className="text-lg text-black-300 font-rubik-bold">
            {user?.name || "User Name"}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-sm text-black-200 font-rubik-medium"
          >
            {user?.email}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity onPress={openEmail}>
            <Image source={icons.chat} className="size-7" tintColor="#dfb6b2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openDial}>
            <Image source={icons.phone} className="size-7" tintColor="#dfb6b2" />
          </TouchableOpacity>
        </View>
      </View>


      {/* User's Posts */}
      <View>
        <Text className="ml-4 mt-5 text-black-300 font-rubik-medium ">
          User's Properties
        </Text>
      </View>
      <FlatList
        data={posts}
        renderItem={({ item }) => <Card item={item} userId={item?.userProfile?.$id || ""} onPress={() => router.push(`/properties/${item.$id}`)}/>}
        keyExtractor={(item) => item.$id}
        numColumns={2}
        contentContainerClassName="gap-4 px-5 pb-32"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loadingPosts ? (
            <ActivityIndicator size="large" className="text-primary-300 mt-5" />
          ) : (
            <NoResults />
          )
        }
      />
    </SafeAreaView>
  );
};

export default User;

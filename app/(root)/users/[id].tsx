import { getUserProperties, getUserProfile, getOrCreateChat } from "@/lib/appwrite";
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
  ScrollView,
} from "react-native";
import { Card } from "@/components/Cards";  // Card is imported here
import NoResults from "@/components/NoResults";
import { Models } from "react-native-appwrite";
import icons from "@/constants/icons";
import NotificationIcon from "@/components/NotificationIcon";

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

        const userPosts = await getUserProperties(id as string);
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

  // const openDial = () => {
  //   if (user?.phone) Linking.openURL(`tel:${user.phone}`);
  // };

  const openEmail = () => {
    if (user?.email) Linking.openURL(`mailto:${user.email}`);
  };

  const handleChatPress = async() => {
    try{
      const chat = await getOrCreateChat(user.$id, user.userId);

      router.push({
        pathname: "/(root)/chats/[id]",
        params: {
          id: chat.$id,
          userId: user.userId,
        },
      });
    } catch (error) {
      console.error("Failed to initiate chat:", error);
    }
  };

  return (
    <View className="bg-white h-full">
      {/* Back Button */}
      <View className="flex-row mt-4 mx-6 items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-200 rounded-full size-11 items-center justify-center"
        >
          <Image source={icons.backArrow} className="size-5" />
        </TouchableOpacity>
        <NotificationIcon/>
      </View>

      {/* Profile Section */}
      <View className="items-center justify-between">
        <View className="items-center">
          <Image
            source={{ uri: user?.avatar || "https://via.placeholder.com/150" }}
            className="size-32 rounded-full"
            resizeMode="cover"
          />
        </View>

        <View className="mx-3 items-center mt-3">
          <Text className="text-lg text-black-300 font-rubik-bold">
            {user?.name || "User Name"}
          </Text>
          <TouchableOpacity onPress={openEmail}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="text-sm text-black-200 font-rubik-medium"
            >
              {user?.email}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row mt-3 gap-5">
          <TouchableOpacity onPress={handleChatPress}>
            <Image source={icons.phone} className="size-7" tintColor="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChatPress}>
            <Image source={icons.send} className="size-7" tintColor="black" />
          </TouchableOpacity>
        </View>
      </View>


      {/* User's Posts */}
      <View className="items-center mx-2">
        <Text className="ml-4 mt-5 text-lg text-black-300 font-rubik-medium ">
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
    </View>
  );
};

export default User;

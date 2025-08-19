import { Card, FeaturedCard } from "@/components/Cards";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import NotificationIcon from "@/components/NotificationIcon";
import Search from "@/components/Search";
import icons from "@/constants/icons";
import { getLatestProperties, getProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { user, userProfile } = useGlobalContext();
  const params = useLocalSearchParams<{query?: string; filter?: string;}>();

  const { data: latestProperties, loading: latestPropertiesLoading } = useAppwrite({
    fn: getLatestProperties,
    params: { userId: user?.$id }
  });

  const { data: properties, loading, refetch } = useAppwrite({
    fn: getProperties,
    params: {
      filter: params.filter!,
      query: params.query!,
      limit: 10,
    },
    skip: true,
  });

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);

  useEffect(() => {
    refetch({
      filter: params.filter!,
      query: params.query!,
      limit: 10,
    });
  }, [params.filter, params.query]);

  const getGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return "Good Morning ☀️";
    if (hour < 17) return "Good Afternoon 🌞";
    return "Good Evening 🌙";
  };

  return (
    <View className="bg-white flex-1">
      {userProfile && (
        <View className="flex-1">

          <View className="px-5">
            <View className="flex flex-row items-center justify-between mt-4">
              <TouchableOpacity className="flex flex-row items-center" onPress={() => router.push('/profile')}>
                <Image source={{uri: userProfile?.avatar}} className="size-12 rounded-full" />
                <View className="flex flex-col items-start ml-2 justify-center">
                  <Text className="text-xs font-rubik text-black-100">{getGreeting()}</Text>
                  <Text className="text-base font-rubik-medium text-black-300">{userProfile?.name}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push("/(root)/map")} 
                className="flex flex-row items-center bg-primary-100 p-2 rounded-[20px]"
              >
                <Text className="text-xs font-rubik text-black-200 ml-2 mr-1">View Map</Text>
                <Image source={icons.location} className="size-6 mr-1" />
              </TouchableOpacity>

              <View className="mr-1 mt-1">
                <NotificationIcon />
              </View>
            </View>
            <View className="mb-2">
              <Search />
            </View>
            
          </View>

          <FlatList
            data={properties}
            renderItem={({ item }) => (
              <Card item={item} userId={user!.$id} onPress={() => handleCardPress(item.$id)} />
            )}
            keyExtractor={(item) => item.$id}
            numColumns={2}
            contentContainerClassName="pb-32"
            columnWrapperClassName="flex gap-4 px-5"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator size="large" className="text-primary-300 mt-5"/>
              ) : (
                <NoResults />
              )
            }
            ListHeaderComponent={
              <View className="px-5">
                {/* Featured Section */}
                <View className="mb-5 mt-2">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-xl font-rubik-bold text-black-300">Featured</Text>
                    <TouchableOpacity onPress={()=> router.push('/(root)/latestProperties')}>
                      <Text className="text-base font-rubik-medium text-blue-200">See All</Text>
                    </TouchableOpacity>
                  </View>

                  {latestPropertiesLoading ? (
                    <ActivityIndicator size="large" className="text-primary-300"/>
                  ) : !latestProperties || latestProperties.length === 0 ? (
                    <NoResults />
                  ) : (
                    <FlatList
                      data={latestProperties}
                      renderItem={({item}) => (
                        <FeaturedCard item={item} userId={user!.$id} onPress={() => handleCardPress(item.$id)} />
                      )}
                      keyExtractor={(item)=> item.$id}
                      horizontal
                      bounces={false}
                      showsHorizontalScrollIndicator={false}
                      contentContainerClassName="flex gap-5 mt-4"
                    />
                  )}
                </View>

                {/* Recommendations */}
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-xl font-rubik-bold text-black-300">Our Recommendations</Text>
                  <TouchableOpacity onPress={()=> router.push('/(root)/latestProperties')}>
                    <Text className="text-base font-rubik-medium text-blue-200">See All</Text>
                  </TouchableOpacity>
                </View>

                <Filters />
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

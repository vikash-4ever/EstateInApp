import { Card } from "@/components/Cards";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import Search from "@/components/Search";
import icons from "@/constants/icons";
import { getProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View, Image, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Explore() {
  const {user} = useGlobalContext();
  const userId = user?.$id;
  const params = useLocalSearchParams<{query?: string; filter?: string;}>();

  const {data: properties, loading, refetch } = useAppwrite({
    fn: getProperties,
    params: {
      filter: params.filter!,
      query: params.query!,
      limit: 6,
    },
    skip: true,
  });

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);


  useEffect(() => {
    refetch({
      filter: params.filter!,
      query: params.query!,
      limit: 20,
    })
  }, [params.filter, params.query]);


  return (
    <View className="bg-white flex-1">
      <FlatList
        data={properties}
        renderItem={({item}) => {
          if(!userId) return null;
          return(
            <Card 
              item = {item} 
              userId={userId} 
              onPress={() => handleCardPress(item.$id)}
            />
          )
        }}
        keyExtractor={(item) => item.$id}
        numColumns={2}
        contentContainerClassName="pb-32"
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" className="text-primary-300 mt-5"/> 
          ) : <NoResults/>
        }

        ListHeaderComponent={
            <View className="px-5">
                <View className="flex flex-row items-center justify-between mt-5">
                    <TouchableOpacity onPress={() => router.back()} className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center">
                        <Image source={icons.backArrow} className="size-5"/>
                    </TouchableOpacity>
                    <Text className="text-base mr-2 text-center font-rubik-medium text-black-300">
                        Search for Your Ideal Home
                    </Text>
                    <Image source={icons.bell} className="w-6 h-6"/>
                </View>
                <Search/>
                <View className="mt-5">
                    <Filters/>
                    <Text className="text-xl font-rubik-bold text-black-300 mt-5">Found {properties?.length} Properites</Text>
                </View>
            </View>
        }
      />
    </View>
  );
}

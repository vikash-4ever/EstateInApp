import { Card, FeaturedCard } from "@/components/Cards";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import Search from "@/components/Search";
import icons from "@/constants/icons";
import { getLatestProperties, getProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, FlatList, Image, SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function Index() {

  const { userProfile } = useGlobalContext();
  const params = useLocalSearchParams<{query?: string; filter?: string;}>();
  const { data: latestProperties, loading: latestPropertiesLoading } = useAppwrite({fn: getLatestProperties});

  const getGreeting = () => {
    const date = new Date();
    const indiaTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = indiaTime.getHours();
  
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const {data: properties, loading, refetch } = useAppwrite({
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
    })
  }, [params.filter, params.query]);

  return (
    <SafeAreaView className="bg-white h-full">
      {userProfile && (

      <FlatList
        data={properties}
        renderItem={({item}) => <Card item={item} userId={userProfile!.$id} onPress={() => handleCardPress(item.$id)}/>}
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
          <View className="px-5 ">
            <View className="flex flex-row items-center justify-between mt-5">
              <View className="flex flex-row items-center">
                <Image source={{uri: userProfile ?.avatar}} className="size-12 rounded-full "/>
                <View className="flex flex-col items-start ml-2 justify-center">
                  <Text className="text-xs font-rubik text-black-100">{getGreeting()}</Text>
                  <Text className="text-base font-rubik-medium text-black-300">{userProfile?.name}</Text>
                </View>
              </View>
              <View>
                <TouchableOpacity 
                  onPress={() => router.push("/(root)/map")} 
                  className="flex flex-row items-center bg-primary-100 p-2 rounded-[20px]"
                  >
                  <Text className="text-xs font-rubik text-black-200 ml-2 mr-1">View Map</Text>
                  <Image source={icons.location} className="size-6 mr-1" />
                </TouchableOpacity>
              </View>
              <Image source={icons.bell} className="size-6"/>
            </View>
            <Search/>
                <View className="my-5">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-xl font-rubik-bold text-black-300 ">Featured</Text>
                    <TouchableOpacity onPress={()=> router.push('/(root)/latestProperties')}>
                      <Text className="text-base font-rubik-bold text-primary-300">See All</Text>
                    </TouchableOpacity>
                  </View>

                  {latestPropertiesLoading ? (<ActivityIndicator size="large" className="text-primary-300"/>) : !latestProperties || latestProperties.length=== 0 ? <NoResults/> : 
                    <FlatList 
                    data={latestProperties} 
                    renderItem={({item})=> <FeaturedCard item={item} userId={userProfile!.$id} onPress={() => handleCardPress(item.$id)}/>}
                    keyExtractor={(item)=> item.$id}
                    horizontal
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="flex gap-5 mt-5"
                  />
                  }
                
                </View>
                <View className="flex flex-row items-center justify-between">
                    <Text className="text-xl font-rubik-bold text-black-300 ">Our Recommendations</Text>
                    <TouchableOpacity onPress={()=> router.push('/(root)/latestProperties')}>
                      <Text className="text-base font-rubik-bold text-primary-300">See All</Text>
                    </TouchableOpacity>
                </View>

                <Filters/>
          </View>
        }
      />
      )}
      
    </SafeAreaView>
  );
}

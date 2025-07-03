import { View, Text, Image, TextInput, TouchableOpacity, FlatList, Modal, TouchableWithoutFeedback } from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import icons from "@/constants/icons";
import { useDebouncedCallback } from 'use-debounce';
import { searchUniversal } from "@/lib/appwrite";

const Search = () => {
  const path = usePathname();
  const params = useLocalSearchParams<{ query?: string }>();
  const [search, setSearch] = useState(params.query || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const debouncedSearch = useDebouncedCallback(async (text: string) => {
    if (!text.trim()) return setResults([]);

    setLoading(true);
    const res = await searchUniversal(text, selectedMode, selectedType);
    setResults(res);
    setLoading(false);
  }, 500);

  const handleSearch = (text: string) => {
    setSearch(text);
    debouncedSearch(text);
  };

  const handleResultPress = (item: any) => {
    if (item.type === "user") {
      router.push(`/users/${item.$id}`);
    } else if (item.type === "property") {
      router.push(`/properties/${item.$id}`);
    }
  };

  const applyFilters = () => {
    debouncedSearch(search); // Re-run search with selected filters
    setShowFilterModal(false); // Close modal after applying
  };

  const closeModal = () => setShowFilterModal(false); // Close modal on outside touch

  return (
    <View className="relative mt-5">
      {/* Search Bar */}
      <View className="flex flex-row items-center justify-between w-full px-4 rounded-lg bg-accent-100 border border-primary-100 py-2 z-10">
        <View className="flex-1 flex flex-row items-center justify-start">
          <Image source={icons.search} className="size-5" />
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder="Search for anything"
            className="text-sm font-rubik text-black-300 ml-2 flex-1"
          />
        </View>
        {/* Filter Icon */}
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <Image source={icons.filter} className="size-5" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        {/* Background Overlay - Just for closing the modal on touch */}
        <TouchableWithoutFeedback onPress={closeModal}>
          <View className="absolute top-0 left-0 right-0 bottom-0 bg-transparent" />
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 border border-primary-300">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-2xl p-4">
              {/* Mode Dropdown */}
              <Text className="font-rubik-bold text-lg mb-1">Mode</Text>
              <Picker
                selectedValue={selectedMode}
                onValueChange={(itemValue: string) => setSelectedMode(itemValue)} // Explicitly define the type as string
              >
                <Picker.Item label="Any" value="" />
                <Picker.Item label="Buy" value="Sell" />
                <Picker.Item label="Rent" value="Rent" />
              </Picker>

              {/* Type Dropdown */}
              <Text className="font-rubik-bold text-lg mb-1 mt-3">Type</Text>
              <Picker
                selectedValue={selectedType}
                onValueChange={(itemValue: string) => setSelectedType(itemValue)} // Explicitly define the type as string
              >
                <Picker.Item label="Any" value="" />
                <Picker.Item label="House" value="House" />
                <Picker.Item label="Apartment" value="Apartment" />
                <Picker.Item label="Hall" value="Hall" />
                <Picker.Item label="Room" value="Room" />
                <Picker.Item label="Shop" value="Shop" />
                <Picker.Item label="Plot" value="Plot" />
                <Picker.Item label="Others" value="Others" />
              </Picker>

              {/* Apply Button */}
              <TouchableOpacity
                onPress={applyFilters}
                className="mt-5 bg-primary-300 rounded-lg p-3"
              >
                <Text className="text-center text-white font-rubik-semibold">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* Results */}
      {results.length > 0 && (
        <View className="absolute top-14 left-0 right-0 bg-white z-20 border border-gray-200 rounded-lg shadow-lg">
          <FlatList
            data={results}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleResultPress(item)} className="px-4 py-3 border-b border-gray-100">
                <Text className="text-sm font-rubik text-black-300">
                  {item.type === "user"
                    ? `${item.name} (${item.email})`
                    : `${item.name} - ${item.address || "No address"}`}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default Search;

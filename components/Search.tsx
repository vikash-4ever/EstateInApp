import { 
  View, 
  Text, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TouchableWithoutFeedback, 
  ActivityIndicator 
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import icons from "@/constants/icons";
import { useDebouncedCallback } from 'use-debounce';
import { searchUniversal } from "@/lib/appwrite";

const FACILITY_OPTIONS = ["Parking","WiFi","Food","Pet-Friendly","Gym"];

const Search = () => {
  const path = usePathname();
  const params = useLocalSearchParams<{ query?: string }>();
  const [search, setSearch] = useState(params.query || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showFilterModal, setShowFilterModal] = useState(false);

  // BASIC FILTERS
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // ADVANCED FILTERS
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const [bedrooms, setBedrooms] = useState<string>("");   // treat as "min bedrooms"
  const [bathrooms, setBathrooms] = useState<string>(""); // treat as "min bathrooms"

  const [minArea, setMinArea] = useState<string>("");
  const [maxArea, setMaxArea] = useState<string>("");

  const [facilities, setFacilities] = useState<string[]>([]);

  const debouncedSearch = useDebouncedCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);

    const filters = {
      mode: selectedMode || undefined,
      type: selectedType || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minBedrooms: bedrooms ? Number(bedrooms) : undefined,
      minBathrooms: bathrooms ? Number(bathrooms) : undefined,
      minArea: minArea ? Number(minArea) : undefined,
      maxArea: maxArea ? Number(maxArea) : undefined,
      facilities: facilities.length ? facilities : undefined,
      limit: 50,
    };

    const res = await searchUniversal(text, filters);
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
    setShowFilterModal(false);
  };

  const toggleFacility = (fac: string) => {
    setFacilities(prev =>
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  const closeModal = () => setShowFilterModal(false);

  return (
    <View className="relative mt-5">
      {/* Search Bar */}
      <View className="flex flex-row items-center justify-between w-full px-4 rounded-full bg-accent-100 border border-primary-100 py-2 z-10">
        <View className="flex-1 flex flex-row items-center justify-start">
          <Image source={icons.search} className="size-6" />
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder="Search for anything"
            placeholderTextColor="#666876"
            className="text-sm font-rubik text-black-300 ml-4 flex-1"
          />
        </View>
        {/* Filter Icon */}
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <Image source={icons.filter} className="size-6" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal (centered window) */}
      <Modal 
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
        >
        {/* Dimmed background */}
        <TouchableWithoutFeedback onPress={closeModal}>
          <View className="flex-1 bg-black/50" />
        </TouchableWithoutFeedback>

        {/* Window content */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-11/12 max-w-md bg-white rounded-2xl p-5 shadow-lg">
            <Text className="font-rubik-bold text-lg mb-3 text-center">Filters</Text>

            {/* Mode */}
            <Text className="font-rubik-medium text-base mb-1">Mode</Text>
            <Picker
              selectedValue={selectedMode}
              onValueChange={(v: string) => setSelectedMode(v)}
              style={{ color: "black", backgroundColor: "white" }}
              dropdownIconColor="black"
            >
              <Picker.Item label="Any" value="" color="black" />
              <Picker.Item label="Buy" value="Sell" color="black" />
              <Picker.Item label="Rent" value="Rent" color="black" />
            </Picker>

            {/* Type */}
            <Text className="font-rubik-medium text-base mb-1 mt-3">Type</Text>
            <Picker
              selectedValue={selectedType}
              onValueChange={(v: string) => setSelectedType(v)}
              style={{ color: "black", backgroundColor: "white" }}
              dropdownIconColor="black"
            >
              <Picker.Item label="Any" value="" color="black" />
              <Picker.Item label="House" value="House" color="black" />
              <Picker.Item label="Apartment" value="Apartment" color="black" />
              <Picker.Item label="Hall" value="Hall" color="black" />
              <Picker.Item label="Room" value="Room" color="black" />
              <Picker.Item label="Shop" value="Shop" color="black" />
              <Picker.Item label="Plot" value="Plot" color="black" />
              <Picker.Item label="Others" value="Others" color="black" />
            </Picker>

            {/* Price Range */}
            <Text className="font-rubik-medium text-base mt-4">Price Range</Text>
            <View className="flex-row gap-2 mt-2">
              <TextInput
                placeholder="Min"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
                className="flex-1 border rounded-lg p-2"
              />
              <TextInput
                placeholder="Max"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
                className="flex-1 border rounded-lg p-2"
              />
            </View>

            {/* Bedrooms */}
            <Text className="font-rubik-medium text-base mt-4">Bedrooms</Text>
            <Picker selectedValue={bedrooms} onValueChange={(v: string) => setBedrooms(v)}>
              <Picker.Item label="Any" value="" />
              {[1,2,3,4,5].map(num => (
                <Picker.Item key={num} label={`${num}+`} value={num.toString()} />
              ))}
            </Picker>

            {/* Bathrooms */}
            <Text className="font-rubik-medium text-base mt-4">Bathrooms</Text>
            <Picker selectedValue={bathrooms} onValueChange={(v: string) => setBathrooms(v)}>
              <Picker.Item label="Any" value="" />
              {[1,2,3,4].map(num => (
                <Picker.Item key={num} label={`${num}+`} value={num.toString()} />
              ))}
            </Picker>

            {/* Area */}
            <Text className="font-rubik-medium text-base mt-4">Area (sqft)</Text>
            <View className="flex-row gap-2 mt-2">
              <TextInput
                placeholder="Min"
                keyboardType="numeric"
                value={minArea}
                onChangeText={setMinArea}
                className="flex-1 border rounded-lg p-2"
              />
              <TextInput
                placeholder="Max"
                keyboardType="numeric"
                value={maxArea}
                onChangeText={setMaxArea}
                className="flex-1 border rounded-lg p-2"
              />
            </View>

            {/* Facilities */}
            <Text className="font-rubik-medium text-base mt-4 mb-2">Facilities</Text>
            <View className="flex-row flex-wrap gap-2">
              {FACILITY_OPTIONS.map(fac => {
                const selected = facilities.includes(fac);
                return (
                  <TouchableOpacity
                    key={fac}
                    onPress={() => toggleFacility(fac)}
                    className={`px-3 py-2 rounded-full border ${
                      selected ? "bg-primary-300 border-primary-300" : "bg-white border-gray-300"
                    }`}
                  >
                    <Text className={selected ? "text-white" : "text-black"}>{fac}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buttons */}
            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                onPress={closeModal}
                className="flex-1 mr-2 bg-gray-200 rounded-lg py-3"
              >
                <Text className="text-center text-black font-rubik">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyFilters}
                className="flex-1 ml-2 bg-primary-300 rounded-lg py-3"
              >
                <Text className="text-center text-white font-rubik-semibold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Indicator */}
      {loading && (
        <View className="absolute top-14 left-0 right-0 bg-white z-50 border border-gray-200 rounded-lg shadow-lg p-4 items-center justify-center">
          <ActivityIndicator size="small" color="#000" />
          <Text className="mt-2 text-sm text-gray-500">Searching...</Text>
        </View>
      )}

      {/* No Results */}
      {!loading && search.trim() !== "" && results.length === 0 && (
        <View className="absolute top-14 left-0 right-0 bg-white z-50 border border-gray-200 rounded-lg shadow-lg p-4 items-center justify-center">
          <Text className="text-sm font-rubik text-gray-500">No results found</Text>
        </View>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <View 
          className="absolute top-14 left-0 right-0 mt-3 bg-white z-50 border border-gray-200 rounded-lg shadow-lg"
          style={{maxHeight: 350, elevation: 20}}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.$id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            bounces={true}
            style={{maxHeight: 350}}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => handleResultPress(item)} 
                className="px-4 py-3 border-b border-gray-100 active:bg-gray-100"
              >
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

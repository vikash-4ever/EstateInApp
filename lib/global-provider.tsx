import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useAppwrite } from "@/lib/useAppwrite";
import { getCurrentUser, databases } from "./appwrite";
import { Query, Models } from "react-native-appwrite";

interface User {
  $id: string;
  name: string;
  email: string;
  avatar: string;
}

interface GlobalContextType {
  isLoggedIn: boolean;
  user: User | null;
  userProfile: Models.Document | null;
  loading: boolean;
  refetch: (newParams?: Record<string, string | number>) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: user,
    loading,
    refetch: refetchUser,
  } = useAppwrite({ fn: getCurrentUser });

  const [userProfile, setUserProfile] = useState<Models.Document | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const res = await databases.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_USERPROFILES_COLLECTION_ID!,
        [Query.equal("userId", userId)]
      );

      if (res.documents.length > 0) {
        setUserProfile(res.documents[0]);
      } else {
        console.warn("No userProfile found for this user");
      }
    } catch (err) {
      console.error("Error fetching userProfile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (user?.$id) {
      fetchUserProfile(user.$id);
    } else {
      setUserProfile(null);
      setProfileLoading(false);
    }
  }, [user]);

  const isLoggedIn = !!user;

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        user,
        userProfile,
        loading: loading || profileLoading,
        refetch: refetchUser,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);

  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }

  return context;
};

export default GlobalProvider;

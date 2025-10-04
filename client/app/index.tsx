import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/authContext";


export default function Index() {
  
  const { user } = useAuth();
  // Cold start: go Home if logged in, Welcome if not
  return <Redirect href={user ? "/(main)/(tabs)/home" : "/(auth)/welcome"} />;
}

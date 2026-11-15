import { useSyncExternalStore } from "react";
import { readHistory, subscribeHistory } from "@/lib/history";

export const useHistory = () => useSyncExternalStore(subscribeHistory, readHistory, readHistory);

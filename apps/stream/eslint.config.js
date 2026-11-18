import { react } from "@empire/config/eslint/react";
import { globalIgnores } from "eslint/config";

export default [...react(import.meta.dirname), globalIgnores(["dist/**"])];

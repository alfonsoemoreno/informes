import { cache } from "react";
import { getAuthServer } from "@/lib/auth/server";

export const getCurrentSession = cache(async () => {
  const authServer = await getAuthServer();
  return authServer.getSession();
});

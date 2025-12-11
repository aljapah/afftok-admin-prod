import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../routers";
import { createContext } from "../_core/context";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req } as any),
  });
}

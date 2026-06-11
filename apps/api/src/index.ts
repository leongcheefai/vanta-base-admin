import "./load-env";
import { serve } from "@hono/node-server";
import { serverEnv } from "@vanta-base-admin/env";
import { app } from "./lib/app";

serve({ fetch: app.fetch, port: serverEnv.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

import { redirect } from "next/navigation";
import { runtimeConfig } from "@/config/runtime";
import { isSetupRequired } from "@/lib/server/setup";
import HomePageClient from "./HomePageClient";

export default async function Page() {
  if (await isSetupRequired()) {
    redirect("/setup");
  }

  if (!runtimeConfig.features.jobSearch) {
    redirect("/applications");
  }

  return <HomePageClient />;
}

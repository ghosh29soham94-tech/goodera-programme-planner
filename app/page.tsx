import { getRole } from "@/lib/session";
import { remainingFor } from "@/lib/limits";
import AccessScreen from "@/components/AccessScreen";
import Planner from "@/components/Planner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const role = await getRole();
  if (!role) return <AccessScreen />;
  return <Planner role={role} initialRemaining={remainingFor(role)} />;
}

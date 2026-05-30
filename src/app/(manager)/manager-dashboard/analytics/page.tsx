import { getAnalyticsData } from "./actions";
import { AnalyticsClientPage } from "./client-page";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <AnalyticsClientPage 
      initialData={data}
    />
  );
}

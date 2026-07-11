import { RecommendedList } from "@/components/recommended/recommended-list";
import { getCurrentUser } from "@/lib/auth";

export default async function RecommendedPage() {
  const user = await getCurrentUser();
  const lockedCityId =
    user?.cities && user.cities.length > 0
      ? String(user.cities[0])
      : undefined;

  return <RecommendedList lockedCityId={lockedCityId} />;
}

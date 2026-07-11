import { ROUTES } from "@/config/routes";
import { redirect } from "next/navigation";

export default function Home() {
  redirect(ROUTES.LOGIN);
}

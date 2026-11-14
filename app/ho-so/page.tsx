import { PageHeader } from "@/components/shell/PageHeader";
import { ProfileView } from "@/components/profile/ProfileView";

export default function HoSoPage() {
  return (
    <main className="space-y-4 pb-4">
      <PageHeader
        title="Hồ sơ người chơi"
        backHref="/ho-chieu"
        backLabel="Hộ chiếu"
      />

      <ProfileView />
    </main>
  );
}

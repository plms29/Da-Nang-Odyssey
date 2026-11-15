import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PageHeader } from "@/components/shell/PageHeader";

export default function CommunityPage() {
  return (
    <main className="space-y-4 pb-6 lg:space-y-8 lg:pb-12">
      <PageHeader title="Cộng đồng" subtitle="Ảnh check-in mọi người đã chia sẻ" backHref="/" />
      <CommunityFeed />
    </main>
  );
}

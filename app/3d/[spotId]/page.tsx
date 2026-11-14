import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSpot } from "@/lib/content";
import { getMuseum3D } from "@/lib/museum3d/data";
import { MuseumClient } from "./MuseumClient";

export default async function Museum3DSpotPage({
  params,
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;
  const museum = getMuseum3D(spotId);

  if (!museum) {
    notFound();
  }

  const spot = getSpot(spotId);
  const title = spot?.name ?? museum.spotId;

  return (
    <main className="space-y-4 pb-6">
      <PageHeader
        title={title}
        subtitle="Dạo bảo tàng góc nhìn thứ nhất"
        backHref="/3d"
        backLabel="Danh sách 3D"
      />
      <MuseumClient museum={museum} />
    </main>
  );
}

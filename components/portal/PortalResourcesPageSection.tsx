import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";

type ResourceItem = {
  type: string;
  title: string;
  desc: string;
  filePath: string | null;
  fileUrl: string | null;
};

type PortalResourcesPageSectionProps = {
  resources: ResourceItem[];
  onOpenResource: (filePath: string | null, fileUrl: string | null) => void;
};

export default function PortalResourcesPageSection({
  resources,
  onOpenResource,
}: PortalResourcesPageSectionProps) {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {resources.map((item) => (
        <Card key={item.title}>
          <div className="p-6">
            <Tag>{item.type}</Tag>
            <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {item.desc}
            </p>

            <button
              onClick={() => onOpenResource(item.filePath, item.fileUrl)}
              className="mt-6 rounded-full bg-[#6F98BE] px-4 py-2 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#1E5A85]"
            >
              Abrir recurso
            </button>
          </div>
        </Card>
      ))}
    </section>
  );
}

import SlideList from "@/components/slides/SlideList";

export default function Sidebar() {
  return (
    <aside className="w-60 bg-gray-50/50 border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <SlideList />
      </div>
    </aside>
  );
}

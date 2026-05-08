import { useSlideStore } from "@/stores/slideStore";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";
import StylePickerModal from "@/components/style/StylePickerModal";
import FullscreenPlayer from "@/components/player/FullscreenPlayer";
import ProjectList from "@/components/home/ProjectList";

export default function App() {
  const slug = useSlideStore((s) => s.slug);
  const isLoading = useSlideStore((s) => s.isLoading);

  if (!slug) {
    return <ProjectList />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <StylePickerModal />
      <FullscreenPlayer />
    </div>
  );
}

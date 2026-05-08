import { useSlideStore } from "@/stores/slideStore";
import ImagePreview from "@/components/preview/ImagePreview";
import EditSlideModal from "@/components/slides/EditSlideModal";
import Modal from "@/components/common/Modal";

export default function MainContent() {
  const editingSlideId = useSlideStore((s) => s.editingSlideId);
  const closeEditModal = useSlideStore((s) => s.closeEditModal);

  return (
    <main className="flex-1 overflow-auto bg-gray-100 p-6">
      <ImagePreview />
      <Modal
        isOpen={!!editingSlideId}
        onClose={closeEditModal}
        title=""
        maxWidth="max-w-4xl"
        className="h-[85vh]"
        contentClassName="!p-0"
      >
        <EditSlideModal />
      </Modal>
    </main>
  );
}

import { useState } from "react";
import { Plus, Camera } from "lucide-react";
import UploadModal from "./UploadModal";

export default function FloatingUploadButton() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleOpenUpload = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUpload = () => {
    setIsUploadModalOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpenUpload}
        className="
          fixed z-50
          w-16 h-16 
          bg-primary hover:bg-primary/90 
          text-primary-foreground 
          rounded-full 
          shadow-lg hover:shadow-xl 
          transition-all duration-200 ease-in-out
          flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
          active:scale-95
          md:w-14 md:h-14
          bottom-6 right-6
        "
        data-testid="floating-upload-button"
        aria-label="Foto hochladen"
      >
        <div className="relative">
          {/* Plus icon for general upload */}
          <Plus 
            className="w-6 h-6 md:w-5 md:h-5 transition-transform duration-200" 
            strokeWidth={2.5}
          />
          {/* Small camera icon overlay */}
          <Camera 
            className="absolute -bottom-1 -right-1 w-3 h-3 md:w-2.5 md:h-2.5 opacity-80" 
            strokeWidth={2}
          />
        </div>
      </button>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUpload}
      />
    </>
  );
}
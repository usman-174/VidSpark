import { useState } from "react";
import IdeasOfTheDay from "@/components/home/IdeasOfTheDay";
import TitleGeneratorCard from "@/components/titlegeneration/TitleGeneratorCard";
import FavoriteTitlesModal from "@/components/titlegeneration/FavouriteTitlesModal";


const TitleGeneration = () => {
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  const handleFavoritesClick = () => {
    setIsFavoritesModalOpen(true);
  };

  const handleCloseFavorites = () => {
    setIsFavoritesModalOpen(false);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Generator Card - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <TitleGeneratorCard onFavoritesClick={handleFavoritesClick} />
          </div>

          {/* Ideas Sidebar - Takes up 2 columns for more space */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <IdeasOfTheDay />
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Titles Modal */}
      <FavoriteTitlesModal
        isOpen={isFavoritesModalOpen}
        onClose={handleCloseFavorites}
      />
    </>
  );
};

export default TitleGeneration;

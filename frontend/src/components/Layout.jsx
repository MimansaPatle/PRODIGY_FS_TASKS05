import { useState } from 'react';
import GlassDock from './GlassDock';
import CreateOverlay from './CreateOverlay';

const Layout = ({ children }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateClick = () => {
    setIsCreateOpen(true);
  };

  const handleCreateClose = () => {
    setIsCreateOpen(false);
  };

  const handleCreatePost = async (postData) => {
    // This will be handled by the individual pages
    // For now, just close the overlay
    setIsCreateOpen(false);
  };

  return (
    <>
      {children}
      <GlassDock onCreateClick={handleCreateClick} />
      {isCreateOpen && (
        <CreateOverlay 
          onClose={handleCreateClose} 
          onPost={handleCreatePost}
        />
      )}
    </>
  );
};

export default Layout;
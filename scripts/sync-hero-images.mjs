import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// External hero images data from the site
const externalHeroImages = [
  {
    "imageUrl": "https://images.unsplash.com/photo-1512688553530-9d6e0894b89e?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "title": "Penticton Wine Countrydfdfd",
    "description": "dfsdfdfdfds",
    "sortOrder": 0
  },
  {
    "imageUrl": "https://images.unsplash.com/photo-1671931637569-f4d592833592?q=80&w=1711&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "title": "bear",
    "description": "in water",
    "sortOrder": 1
  },
  {
    "imageUrl": "https://images.unsplash.com/photo-1709773050323-937251914995?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "title": "Gebirge und straße",
    "description": "Yoho National Park",
    "sortOrder": 2
  },
  {
    "imageUrl": "https://images.unsplash.com/photo-1754534599841-aab1e476c2d6?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "title": "Lower Arrow Lake",
    "description": "faehre",
    "sortOrder": 3
  }
];

async function syncHeroImages() {
  console.log('🖼️ Syncing hero images to match external site...');
  
  try {
    // Get current hero images
    const currentResponse = await fetch(`${API_BASE}/api/hero-images`);
    const currentImages = await currentResponse.json();
    
    // Delete all current hero images first
    for (const image of currentImages) {
      try {
        await fetch(`${API_BASE}/api/hero-images/${image.id}`, {
          method: 'DELETE'
        });
        console.log(`  🗑️ Deleted: ${image.title}`);
      } catch (error) {
        console.log(`  ❌ Failed to delete ${image.title}: ${error.message}`);
      }
    }
    
    // Add external hero images
    for (const image of externalHeroImages) {
      try {
        const response = await fetch(`${API_BASE}/api/hero-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(image)
        });
        
        if (response.ok) {
          console.log(`  ✅ Added: ${image.title}`);
        } else {
          const error = await response.text();
          console.log(`  ❌ Failed to add ${image.title}: ${error}`);
        }
      } catch (error) {
        console.log(`  ❌ Error adding ${image.title}: ${error.message}`);
      }
    }
    
    console.log('🎉 Hero images sync completed!');
    
  } catch (error) {
    console.error('💥 Hero images sync failed:', error);
  }
}

syncHeroImages().catch(console.error);
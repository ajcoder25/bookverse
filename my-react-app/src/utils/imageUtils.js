// Constants for fallback images
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e",
  "https://images.unsplash.com/photo-1532012197267-da84d127e765",
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570",
];

// Get a random fallback image from the collection
const getRandomFallbackImage = () => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
  return `${FALLBACK_IMAGES[randomIndex]}?auto=format&fit=crop&w=400&h=600&q=80`;
};

// Get book cover image with proper fallback handling
export const getBookCoverImage = (imageLinks) => {
  if (imageLinks?.thumbnail) {
    return imageLinks.thumbnail.replace("http:", "https:");
  }
  if (imageLinks?.smallThumbnail) {
    return imageLinks.smallThumbnail.replace("http:", "https:");
  }
  return getRandomFallbackImage();
};

export default {
  getBookCoverImage,
  getRandomFallbackImage,
};

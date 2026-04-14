import { API_URL } from '../api/axios';

/**
 * Returns the correct URL for an uploaded file.
 * - Cloudinary URLs (start with https://) → used directly
 * - Local filenames → prepended with API_URL/uploads/
 */
export function fileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}/uploads/${path}`;
}

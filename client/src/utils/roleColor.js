const PALETTE = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-gray-100 text-gray-600',
];

// Roles are created dynamically, so colors are derived from the name
// instead of a hardcoded map, while staying stable across renders.
export const getRoleColor = (roleName = '') => {
  let hash = 0;
  for (let i = 0; i < roleName.length; i += 1) {
    hash = (hash * 31 + roleName.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
};

// SGP40 VOC index scale (1-500, 100 = clean-air baseline) — mirrors the web client's quality bands.
export function getVocQuality(voc) {
  if (voc == null) return { label: '--', color: '#94A3B8' };
  if (voc <= 100) return { label: 'Excellent', color: '#16A34A' };
  if (voc <= 200) return { label: 'Good', color: '#84CC16' };
  if (voc <= 300) return { label: 'Moderate', color: '#EAB308' };
  if (voc <= 400) return { label: 'Poor', color: '#F97316' };
  return { label: 'Very Poor', color: '#DC2626' };
}

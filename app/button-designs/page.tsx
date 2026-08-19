import type { Metadata } from 'next';
import ButtonDesignGallery from './ButtonDesignGallery';

export const metadata: Metadata = {
  title: 'Button-Designs',
  description: 'Interaktive Auswahl möglicher Button-Designs für marcelspahr.ch.',
  robots: { index: false, follow: false },
};

export default function ButtonDesignsPage() {
  return <ButtonDesignGallery />;
}

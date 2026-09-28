import React from 'react';
import CREDITS_CSS from './vanilla/credits.css?raw';
import CREDITS_MARKUP from './vanilla/credits.html?raw';
import CREDITS_SCRIPT from './vanilla/credits.js?raw';
import { useVanillaPage } from './vanilla/useVanillaPage';
import { installAnime } from '../lib/anime';

export default function CreditsPage() {
  useVanillaPage({
    title: 'Digital Arts · Credits · 제작진',
    css: CREDITS_CSS,
    script: CREDITS_SCRIPT,
    setup: installAnime
  });
  return <div className="credits-vanilla-wrapper" dangerouslySetInnerHTML={{ __html: CREDITS_MARKUP }} />;
}

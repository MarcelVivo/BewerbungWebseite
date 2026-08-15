'use client';

import { useEffect, useRef } from 'react';
import styles from './experience.module.css';

const TEXT_STYLE_PROPERTIES = [
  'background',
  'backgroundClip',
  'backgroundColor',
  'backgroundImage',
  'backgroundPosition',
  'backgroundSize',
  'color',
  'display',
  'filter',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textShadow',
  'textTransform',
  'whiteSpace',
  'webkitBackgroundClip',
  'webkitTextFillColor',
] as const;

function copyTextAppearance(source: HTMLElement, clone: HTMLElement) {
  const computed = window.getComputedStyle(source);
  TEXT_STYLE_PROPERTIES.forEach((property) => {
    const value = computed[property as keyof CSSStyleDeclaration];
    if (typeof value === 'string') clone.style.setProperty(property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), value);
  });
  Array.from(source.children).forEach((child, index) => {
    const cloneChild = clone.children[index];
    if (child instanceof HTMLElement && cloneChild instanceof HTMLElement) copyTextAppearance(child, cloneChild);
  });
}

export default function TitleDepthLayer() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const experience = layer?.closest<HTMLElement>('.experience-root');
    const main = experience?.querySelector('main');
    if (!layer || !experience || !main) return;

    const nativeAnchors = CSS.supports('anchor-name: --title-depth-anchor') && CSS.supports('top: anchor(top)');
    let pairs: Array<{
      source: HTMLElement;
      clone: HTMLElement;
      anchorName: string;
      previousAnchorName: string;
    }> = [];
    let frame = 0;
    let rebuildQueued = false;

    const rebuild = () => {
      rebuildQueued = false;
      pairs.forEach(({ source, previousAnchorName }) => {
        source.classList.remove(styles.titleDepthSource);
        if (previousAnchorName) source.style.setProperty('anchor-name', previousAnchorName);
        else source.style.removeProperty('anchor-name');
      });
      layer.replaceChildren();
      pairs = Array.from(main.querySelectorAll<HTMLElement>('h1, section h2'))
        .filter((source) => !source.closest(`.${styles.pauseFit}`))
        .map((source, index) => {
        const clone = document.createElement('div');
        const anchorName = `--title-depth-${index + 1}`;
        const previousAnchorName = source.style.getPropertyValue('anchor-name');
        clone.className = source.className;
        clone.innerHTML = source.innerHTML;
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('role', 'presentation');
        clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
        clone.classList.add(styles.titleDepthClone);
        copyTextAppearance(source, clone);
        if (nativeAnchors) {
          source.style.setProperty('anchor-name', anchorName);
          clone.style.setProperty('position-anchor', anchorName);
          clone.style.setProperty('left', 'anchor(left)');
          clone.style.setProperty('top', 'anchor(top)');
          clone.style.setProperty('width', 'anchor-size(width)');
          clone.style.setProperty('height', 'anchor-size(height)');
        }
        source.classList.add(styles.titleDepthSource);
        layer.append(clone);
        return { source, clone, anchorName, previousAnchorName };
      });
    };

    const render = () => {
      pairs.forEach(({ source, clone }) => {
        const rect = source.getBoundingClientRect();
        const revealParent = source.closest<HTMLElement>('[data-reveal]') ?? source.closest<HTMLElement>(`.${styles.heroCopy}`);
        const revealStyle = revealParent ? window.getComputedStyle(revealParent) : null;
        if (!nativeAnchors) {
          clone.style.left = `${rect.left}px`;
          clone.style.top = `${rect.top}px`;
          clone.style.width = `${rect.width}px`;
          clone.style.height = `${rect.height}px`;
        }
        clone.style.opacity = revealStyle?.opacity ?? window.getComputedStyle(source).opacity;
        clone.style.visibility = rect.bottom < -40 || rect.top > window.innerHeight + 40 ? 'hidden' : 'visible';
      });
      frame = window.requestAnimationFrame(render);
    };

    const queueRebuild = () => {
      if (rebuildQueued) return;
      rebuildQueued = true;
      window.requestAnimationFrame(rebuild);
    };
    const observer = new MutationObserver(queueRebuild);
    observer.observe(main, { childList: true, subtree: true, characterData: true });
    rebuild();
    frame = window.requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      pairs.forEach(({ source, previousAnchorName }) => {
        source.classList.remove(styles.titleDepthSource);
        if (previousAnchorName) source.style.setProperty('anchor-name', previousAnchorName);
        else source.style.removeProperty('anchor-name');
      });
      layer.replaceChildren();
    };
  }, []);

  return <div ref={layerRef} className={styles.titleDepthLayer} aria-hidden="true" />;
}

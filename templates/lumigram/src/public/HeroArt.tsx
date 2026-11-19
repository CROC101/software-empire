// Drawn stand-in for the login page's collage: three story cards with stickers.
import { Art } from '../components/Art';

export function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-card left"><Art seed={6} /><i className="bar" /><i className="reply" /></div>
      <div className="hero-card right"><Art seed={16} /><i className="bar" /><i className="reply" /></div>
      <div className="hero-card center"><Art seed={25} /><i className="bar" /><i className="reply" /><i className="heart-outline" /></div>
      <div className="sticker heart" />
      <div className="sticker badge">★ ✓</div>
      <div className="sticker bubble">🔮👀🤯</div>
      <div className="sticker face"><Art seed={41} variant="portrait" /></div>
    </div>
  );
}

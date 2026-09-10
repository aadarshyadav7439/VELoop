import iphone from "../assets/iphone-15-pro.png";
import watch from "../assets/apple-watch.png";
import airpods from "../assets/airpods-pro.png";
import amazon2000 from "../assets/amazon-gift-card-2000.png";
import amazon500 from "../assets/amazon-gift-card-500.png";
import amazon20 from "../assets/amazon-gift-card-20.png";
import giftBox from "../assets/giveaway-gift-box.png";
import giftGlow from "../assets/giveaway-gift-glow.png";
import ticket from "../assets/giveaway-ticket.png";

// The backend only ever returns an image *path* (e.g. "/assets/iphone-15-pro.png")
// — it has no business bundling binary assets. This maps that path/slug back
// to the actual Vite-bundled asset so the same image files ship either way.
const BY_SLUG = {
  "iphone-15-pro": iphone,
  "apple-watch": watch,
  "airpods-pro": airpods,
  "amazon-2000": amazon2000,
  "amazon-500": amazon500,
  "amazon-20": amazon20,
  "august-iphone-15-pro": iphone
};

export function resolvePrizeImage(prize) {
  if (!prize) return giftBox;
  return BY_SLUG[prize.slug] || giftBox;
}

export const heroIllustrations = { giftBox, giftGlow, ticket };

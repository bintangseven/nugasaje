import Badboy from "@/assets/avatars/Badboy.png.asset.json";
import Beutiful from "@/assets/avatars/Beutiful.png.asset.json";
import Cool from "@/assets/avatars/Cool.png.asset.json";
import Cubby from "@/assets/avatars/Cubby.png.asset.json";
import Diliggent from "@/assets/avatars/Diliggent.png.asset.json";
import Hijab from "@/assets/avatars/Hijab.png.asset.json";

export type DummyAvatar = { id: string; label: string; url: string };

export const dummyAvatars: DummyAvatar[] = [
  { id: "cool", label: "Cool", url: Cool.url },
  { id: "diliggent", label: "Rajin", url: Diliggent.url },
  { id: "badboy", label: "Cuek", url: Badboy.url },
  { id: "beutiful", label: "Ceria", url: Beutiful.url },
  { id: "cubby", label: "Kalem", url: Cubby.url },
  { id: "hijab", label: "Hijab", url: Hijab.url },
];

export const MAX_PROJECTS = 15;
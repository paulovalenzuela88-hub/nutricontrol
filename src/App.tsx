import { useEffect, useMemo, useState } from 'react';
import { api, image } from './appdeployClient';

type Micros = {
  fiber: number;
  sugar: number;
  sodium: number;
  calcium: number;
  iron: number;
  potassium: number;
  magnesium: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
};
type Food = {
  name: string;
  grams: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  confidence?: number;
  micros?: Partial<Micros>;
};
type Exercise = {
  id: string;
  type: string;
  duration: number;
  kcal: number;
  image?: string;
};
type Supplement = {
  id: string;
  name: string;
  brand?: string;
  serving?: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  micros: Partial<Micros>;
  image?: string;
};
type Day = {
  meals: Record<string, Food[]>;
  water: number;
  sleep: number;
  weight: number;
  exercises: Exercise[];
  supplements: Supplement[];
};
type Targets = {
  calories: number;
  p: number;
  c: number;
  f: number;
  water: number;
  sleep: number;
  micros: Micros;
};
type UserProfile = {
  id: string;
  name: string;
  age: number;
  sex: 'hombre' | 'mujer';
  height: number;
  weight: number;
  goal: 'perder' | 'mantener' | 'ganar';
  activity: 'sedentario' | 'ligero' | 'moderado' | 'alto';
  targets: Targets;
  setupComplete: boolean;
  animeTheme: string;
  animeCharacter: string;
  seasonStartedAt?: string;
  days: Record<string, Day>;
};
type AppState = {
  profiles: UserProfile[];
  activeProfileId: string;
};

const meals = ['Desayuno', 'Almuerzo', 'Once', 'Cena', 'Snacks'];
const key = 'nutricontrol-v3';

const animeThemes = [
  ['attackontitan', 'Attack on Titan', 'Supervivencia y determinación'],
  ['myhero', 'My Hero Academia', 'Héroe y progreso'],
  ['chainsaw', 'Chainsaw Man', 'Caos, fuerza y supervivencia'],
  ['sololeveling', 'Solo Leveling', 'Subir de nivel y superar límites'],
  ['demonslayer', 'Demon Slayer', 'Respiración y concentración'],
  ['jujutsu', 'Jujutsu Kaisen', 'Energía y combate'],
  ['hajime', 'Hajime no Ippo', 'Boxeo y disciplina'],
  ['dragonball', 'Dragon Ball Z', 'Entrenamiento y superación'],
  ['dandadan', 'Dandadan', 'Energía paranormal y aventura'],
  ['haikyuu', 'Haikyuu!!', 'Equipo y rendimiento'],
] as const;

const animeCharacters: Record<string, Array<[string, string]>> = {
  attackontitan: [['eren', 'Eren Yeager'], ['mikasa', 'Mikasa Ackerman'], ['levi', 'Levi Ackerman'], ['armin', 'Armin Arlert'], ['erwin', 'Erwin Smith'], ['hange', 'Hange Zoe']],
  myhero: [['deku', 'Izuku Midoriya'], ['bakugo', 'Katsuki Bakugo'], ['todoroki', 'Shoto Todoroki'], ['allmight', 'All Might']],
  chainsaw: [['denji', 'Denji'], ['power', 'Power'], ['aki', 'Aki Hayakawa'], ['makima', 'Makima'], ['reze', 'Reze']],
  sololeveling: [['jinwoo', 'Sung Jin-Woo'], ['chae', 'Cha Hae-In'], ['igris', 'Igris'], ['beru', 'Beru'], ['ashborn', 'Ashborn']],
  demonslayer: [['tanjiro', 'Tanjiro Kamado'], ['nezuko', 'Nezuko Kamado'], ['zenitsu', 'Zenitsu Agatsuma'], ['inosuke', 'Inosuke Hashibira']],
  jujutsu: [['yuji', 'Yuji Itadori'], ['megumi', 'Megumi Fushiguro'], ['nobara', 'Nobara Kugisaki'], ['gojo', 'Satoru Gojo'], ['yuta', 'Yuta Okkotsu'], ['maki', 'Maki Zenin'], ['toji', 'Toji Fushiguro'], ['sukuna', 'Ryomen Sukuna']],
  hajime: [['ippo', 'Ippo Makunouchi'], ['takamura', 'Mamoru Takamura'], ['miyata', 'Ichiro Miyata']],
  dragonball: [['goku', 'Goku'], ['vegeta', 'Vegeta'], ['gohan', 'Gohan'], ['piccolo', 'Piccolo']],
  dandadan: [['okarun', 'Okarun'], ['momo', 'Momo Ayase'], ['aira', 'Aira Shiratori'], ['jiji', 'Jiji Enjoji']],
  haikyuu: [['hinata', 'Shoyo Hinata'], ['kageyama', 'Tobio Kageyama'], ['oikawa', 'Toru Oikawa'], ['bokuto', 'Kotaro Bokuto']],
};

function defaultAnimeCharacter(theme: string) {
  return animeCharacters[theme]?.[0]?.[0] || 'ippo';
}

function animeCharacterName(theme: string, character: string) {
  return animeCharacters[theme]?.find(([id]) => id === character)?.[1] || animeCharacters[theme]?.[0]?.[1] || 'Ippo Makunouchi';
}

const characterIcons: Record<string, string> = {
  eren: '🪽', mikasa: '⚔️', levi: '⚔️', armin: '🔥', erwin: '🫡', hange: '🔬',
  deku: '💚', bakugo: '💥', todoroki: '❄️', allmight: '💪',
  denji: '🪚', power: '🩸', aki: '⚔️', makima: '👁️', reze: '💣',
  jinwoo: '🖤', chae: '⚔️', igris: '🛡️', beru: '🦋', ashborn: '👑',
  tanjiro: '🌊', nezuko: '🎋', zenitsu: '⚡', inosuke: '🐗',
  yuji: '👊', megumi: '🐺', nobara: '🔨', gojo: '🔵', yuta: '⚔️', maki: '🗡️', toji: '🗡️', sukuna: '👹',
  ippo: '🥊', takamura: '💥', miyata: '⚡',
  goku: '⚡', vegeta: '👑', gohan: '🔥', piccolo: '🟢',
  okarun: '👽', momo: '🔮', aira: '✨', jiji: '🔥',
  hinata: '🏐', kageyama: '👑', oikawa: '🏐', bokuto: '🦉',
};

const characterStyles: Record<string, string> = {
  eren: 'green-black', mikasa: 'blue-red', levi: 'silver-blue', armin: 'gold-blue', erwin: 'green-black', hange: 'orange-black',
  deku: 'green-black', bakugo: 'orange-black', todoroki: 'red-white', allmight: 'blue-red',
  denji: 'orange-black', power: 'red-black', aki: 'blue-gray', makima: 'red-black', reze: 'blue-red',
  jinwoo: 'black-blue', chae: 'white-blue', igris: 'red-black', beru: 'purple-black', ashborn: 'black-purple',
  tanjiro: 'green-check', nezuko: 'pink-green', zenitsu: 'yellow-orange', inosuke: 'blue-gray',
  yuji: 'red-black', megumi: 'navy-blue', nobara: 'brown-red', gojo: 'white-blue', yuta: 'blue-white', maki: 'green-black', toji: 'black-red', sukuna: 'red-black',
  ippo: 'black-red', takamura: 'gold-black', miyata: 'blue-white',
  goku: 'orange-blue', vegeta: 'blue-white', gohan: 'purple-gold', piccolo: 'green-purple',
  okarun: 'blue-purple', momo: 'pink-blue', aira: 'pink-red', jiji: 'orange-black',
  hinata: 'orange-black', kageyama: 'navy-blue', oikawa: 'teal-white', bokuto: 'black-gold',
};

const themeAssets: Record<string, { logo: string; alt: string; credit: string }> = {
  attackontitan: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Attack_on_Titan_logo.svg', alt: 'Logo Attack on Titan', credit: 'Wikimedia Commons · Attack on Titan' },
  myhero: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/My_Hero_Academia_-_international_logo.png', alt: 'Logo My Hero Academia', credit: 'Wikimedia Commons · My Hero Academia' },
  chainsaw: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chainsaw_Man_English_anime_logo.svg', alt: 'Logo Chainsaw Man', credit: 'Wikimedia Commons · Chainsaw Man' },
  sololeveling: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Solo_Leveling_anime_logo.svg', alt: 'Logo Solo Leveling', credit: 'Wikimedia Commons · Solo Leveling' },
  demonslayer: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Demon_Slayer_logo.svg', alt: 'Logo Demon Slayer', credit: 'Wikimedia Commons · Demon Slayer' },
  jujutsu: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Jujutsu_Kaisen_logo.svg', alt: 'Logo Jujutsu Kaisen', credit: 'Wikimedia Commons · Jujutsu Kaisen' },
  hajime: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hajime_no_Ippo.png', alt: 'Logo Hajime no Ippo', credit: 'Wikimedia Commons · Hajime no Ippo' },
  dragonball: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dragon_Ball_Z_logo.svg', alt: 'Logo Dragon Ball Z', credit: 'Wikimedia Commons · Dragon Ball Z' },
  dandadan: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dandadan_icon_logo.svg', alt: 'Logo Dandadan', credit: 'Wikimedia Commons · Dandadan' },
  haikyuu: { logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Haikyuu!!_Logo.png', alt: 'Logo Haikyuu!!', credit: 'Wikimedia Commons · Haikyuu!!' },
};

const themeBanners: Record<string, string> = {
  attackontitan: 'https://wallpapers.com/images/hd/aesthetic-levi-and-eren-4k-n0va5oqrpe5sbkz0.jpg',
  myhero: 'https://4kwallpapers.com/images/walls/thumbs_2t/9151.png',
  chainsaw: 'https://images8.alphacoders.com/115/thumb-1920-1159925.jpg',
  sololeveling: 'https://images2.alphacoders.com/139/thumb-1920-1394671.png',
  demonslayer: 'https://4kwallpapers.com/images/wallpapers/tanjiro-kamado-1920x1080-9322.jpg',
  jujutsu: 'https://images4.alphacoders.com/114/thumb-1920-1141582.jpg',
  hajime: 'https://images5.alphacoders.com/332/thumb-1920-332648.jpg',
  dragonball: 'https://images.hdqwalls.com/download/dragon-ball-z-super-saiyan-blue-5k-gc-1920x1080.jpg?dl=1',
  dandadan: 'https://images8.alphacoders.com/137/thumb-1920-1379351.png',
  haikyuu: 'https://cdn.theanimegallery.com/theanimegallery/7e180d2a-688c-4a29-a80e-f4bdb57dce28-haikyuu-wallpaper.webp',
};

const proxiedImage = (url: string) => url ? `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1600&fit=inside&q=88` : '';
const characterProxy = (url: string) => url ? `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=180&h=180&fit=cover&q=82` : '';
const characterDisplayImage = (url: string) => url ? characterProxy(url) : '';

const characterImageCacheKey = 'nutricontrol-character-images-v1';

const readCharacterImageCache = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(characterImageCacheKey) || '{}');
  } catch {
    return {};
  }
};

const characterImageCache: Record<string, string> = readCharacterImageCache();
const characterImagePromises: Record<string, Promise<string>> = {};
let characterRequestQueue: Promise<void> = Promise.resolve();

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const persistCharacterImage = (characterId: string, imageUrl: string) => {
  characterImageCache[characterId] = imageUrl;
  try {
    localStorage.setItem(characterImageCacheKey, JSON.stringify(characterImageCache));
  } catch {
    // El caché es opcional.
  }
};

const fetchRealCharacterImage = (characterId: string, name: string): Promise<string> => {
  const cached = characterImageCache[characterId];
  if (cached) return Promise.resolve(cached);
  if (characterImagePromises[characterId]) return characterImagePromises[characterId];

  const task = characterRequestQueue.then(async () => {
    const existing = characterImageCache[characterId];
    if (existing) return existing;

    const query = encodeURIComponent(name);
    const response = await fetch(`https://api.jikan.moe/v4/characters?q=${query}&limit=5`);
    if (!response.ok) throw new Error(`Jikan character lookup failed: ${response.status}`);

    const data = await response.json();
    const results = Array.isArray(data?.data) ? data.data : [];
    const normalized = name.trim().toLowerCase();
    const exact = results.find((item: any) => String(item?.name || '').trim().toLowerCase() === normalized);
    const character = exact || results[0];
    const imageUrl =
      character?.images?.webp?.image_url ||
      character?.images?.jpg?.image_url ||
      character?.images?.webp?.large_image_url ||
      character?.images?.jpg?.large_image_url;

    if (!imageUrl) throw new Error('No real character image returned by Jikan');
    persistCharacterImage(characterId, imageUrl);
    return imageUrl;
  });

  characterRequestQueue = task.then(() => wait(1100), () => wait(1100));
  characterImagePromises[characterId] = task;
  return task;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const original = img.dataset.originalSrc || img.src;
  const stage = Number(img.dataset.imageStage || '0');
  if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src;
  if (stage === 0) { img.dataset.imageStage = '1'; img.src = characterProxy(original); return; }
  if (stage === 1) { img.dataset.imageStage = '2'; img.src = proxiedImage(original); return; }
  if (stage === 2) { img.dataset.imageStage = '3'; img.src = original; return; }
  img.style.opacity = '0';
};

const themeCharacterImages: Record<string, string> = {
  attackontitan: 'https://attackontitan.fandom.com/wiki/Special:FilePath/Eren%20profile%20image.png',
  myhero: 'https://myheroacademia.fandom.com/wiki/Special:FilePath/Izuku%20Midoriya%20First%20Hero%20Costume%20Full%20Body%20Anime.png',
  chainsaw: 'https://images8.alphacoders.com/115/thumb-1920-1159925.jpg',
  sololeveling: 'https://images2.alphacoders.com/139/thumb-1920-1394671.png',
  demonslayer: 'https://kimetsu-no-yaiba.fandom.com/wiki/Special:FilePath/Tanjiro%20colored%20profile.png',
  jujutsu: 'https://jujutsu-kaisen.fandom.com/wiki/Special:FilePath/Satoru%20Gojo%20%28Anime%29.png',
  hajime: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hajime_no_Ippo.png',
  dragonball: 'https://dragonball.fandom.com/wiki/Special:FilePath/Goku.png',
  dandadan: 'https://images8.alphacoders.com/137/thumb-1920-1379351.png',
  haikyuu: 'https://haikyuu.fandom.com/wiki/Special:FilePath/101ShoyoJump.png',
};

const characterImages: Record<string, string> = {
  eren: 'https://attackontitan.fandom.com/wiki/Special:FilePath/Eren%20profile%20image.png',
  mikasa: 'https://attackontitan.fandom.com/wiki/Special:FilePath/Mikasa%20Ackermann%20%28Anime%29%20character%20image.png',
  levi: 'https://attackontitan.fandom.com/wiki/Special:FilePath/Levi%20Ackermann%20%28Anime%29%20character%20image%20%28854%29.png',
  armin: 'https://attackontitan.fandom.com/wiki/Special:FilePath/Armin%20Arlelt%20%28Anime%29%20character%20image%20%28854%29.png',
  erwin: 'https://attackontitan.fandom.com/wiki/Special:FilePath/Erwin%20Smith%20character%20image.png',
  hange: 'https://attackontitan.fandom.com/wiki/Special:FilePath/Hange%20Zoe%20character%20image.png',
  deku: 'https://myheroacademia.fandom.com/wiki/Special:FilePath/Izuku%20Midoriya%20First%20Hero%20Costume%20Alt%20Anime.png',
  bakugo: 'https://myheroacademia.fandom.com/wiki/Special:FilePath/Katsuki%20Bakugo%20Hero%20Costume%20Profile.png',
  todoroki: 'https://myheroacademia.fandom.com/wiki/Special:FilePath/Shoto%20Todoroki%20Hero%20Costume%20Profile.png',
  allmight: 'https://myheroacademia.fandom.com/wiki/Special:FilePath/All%20Might%20Hero%20Costume%20Profile.png',
  denji: 'https://images8.alphacoders.com/115/thumb-1920-1159925.jpg',
  power: 'https://images2.alphacoders.com/128/thumb-1920-1286296.jpg',
  aki: 'https://images8.alphacoders.com/129/thumb-1920-1294192.png',
  makima: 'https://chainsaw-man.fandom.com/wiki/Special:FilePath/Makima%20%28Anime%29.png',
  reze: 'https://chainsaw-man.fandom.com/wiki/Special:FilePath/Reze%20%28Anime%29.png',
  jinwoo: 'https://images2.alphacoders.com/139/thumb-1920-1394671.png',
  chae: 'https://solo-leveling.fandom.com/wiki/Special:FilePath/Cha%20Hae-In%20%28Anime%29.png',
  igris: 'https://solo-leveling.fandom.com/wiki/Special:FilePath/Anime%20Episode%2011%20Igris%20Picture%201.jpeg',
  beru: 'https://solo-leveling.fandom.com/wiki/Special:FilePath/Beru%20%28Anime%29.png',
  ashborn: 'https://solo-leveling.fandom.com/wiki/Special:FilePath/Ashborn%20%28Anime%29.png',
  tanjiro: 'https://kimetsu-no-yaiba.fandom.com/wiki/Special:FilePath/Tanjiro%20colored%20profile.png',
  nezuko: 'https://kimetsu-no-yaiba.fandom.com/wiki/Special:FilePath/Nezuko%20profile%20%28human%29.png',
  zenitsu: 'https://kimetsu-no-yaiba.fandom.com/wiki/Special:FilePath/Zenitsu%20Anime%20Profile.png',
  inosuke: 'https://kimetsu-no-yaiba.fandom.com/wiki/Special:FilePath/Inosuke%20Anime%20Profile.png',
  yuji: 'https://jujutsu-kaisen.fandom.com/wiki/Special:FilePath/Yuji%20Itadori%20%28Anime%29.png',
  megumi: 'https://jujutsu-kaisen.fandom.com/wiki/Special:FilePath/Megumi%20Fushiguro%20%28Anime%29.png',
  nobara: 'https://jujutsu-kaisen.fandom.com/wiki/Special:FilePath/Nobara%20Kugisaki%20%28Anime%29.png',
  gojo: 'https://jujutsu-kaisen.fandom.com/wiki/Special:FilePath/Satoru%20Gojo%20%28Anime%29.png',
  yuta: 'https://jujutsu-kaisen.fandom.com/wiki/Special:FilePath/Yuta%20Okkotsu%20%28Anime%29.png',
  maki: 'https://jujutsu-kaisen.fandom.com/wiki/Special:FilePath/Maki%20Zenin%20%28Anime%29.png',
  toji: 'https://www.citypng.com/public/uploads/preview/jujutsu-kaisen-toji-fushiguro-sticker-character-png-735811696676725ea7lk1vzde.png',
  sukuna: 'https://jujutsu-kaisen.fandom.com/wiki/Special:FilePath/Sukuna%20%28Anime%29.png',
  ippo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hajime_no_Ippo.png',
  takamura: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hajime_no_Ippo.png',
  miyata: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hajime_no_Ippo.png',
  goku: 'https://dragonball.fandom.com/wiki/Special:FilePath/Goku.png',
  vegeta: 'https://dragonball.fandom.com/wiki/Special:FilePath/Vegeta%20in%20his%20original%20color%20scheme%20in%20the%20anime.png',
  gohan: 'https://dragonball.fandom.com/wiki/Special:FilePath/Gohan.png',
  piccolo: 'https://dragonball.fandom.com/wiki/Special:FilePath/Piccolo.png',
  okarun: 'https://dandadan.fandom.com/wiki/Special:FilePath/Okarun%20full%20appearance%20%28Anime%29.png',
  momo: 'https://dandadan.fandom.com/wiki/Special:FilePath/Momo%20Ayase%27s%20full%20appearance%20%28Anime%29.png',
  aira: 'https://dandadan.fandom.com/wiki/Special:FilePath/Aira%20Anime%20Concept%20Art.png',
  jiji: 'https://dandadan.fandom.com/wiki/Special:FilePath/Jiji%20full%20appearance%20%28Anime%29.png',
  hinata: 'https://haikyuu.fandom.com/wiki/Special:FilePath/101ShoyoJump.png',
  kageyama: 'https://haikyuu.fandom.com/wiki/Special:FilePath/102Tobio.png',
  oikawa: 'https://haikyuu.fandom.com/wiki/Special:FilePath/Oikawa.png',
  bokuto: 'https://haikyuu.fandom.com/wiki/Special:FilePath/Bokuto.png',
};

const jikanCharacterCache: Record<string, string> = {};

// Mini avatar: usa directamente la ilustración real configurada, optimizada a 180px.
// No hace búsquedas externas ni dispara decenas de peticiones al cargar el selector.
function CharacterAvatar({ characterId, name, className = '' }: { characterId: string; name: string; className?: string }) {
  const staticImage = characterDisplayImage(characterImages[characterId] || '');
  return <img
    className={className}
    src={staticImage}
    alt={name}
    loading="lazy"
    decoding="async"
    referrerPolicy="no-referrer"
    onError={(e) => {
      const img = e.currentTarget;
      if (img.src) img.style.opacity = '0';
    }}
  />;
}

function dailyCharacterMessage(theme: string, character: string, day: Day, targets: Targets, level: number) {
  const keyName = character || defaultAnimeCharacter(theme);
  const proteinPct = targets.p ? day.meals ? Object.values(day.meals).flat().reduce((s, f) => s + f.p, 0) / targets.p : 0 : 0;  const calories = day.meals ? Object.values(day.meals).flat().reduce((s, f) => s + f.kcal, 0) : 0;
  const exercise = day.exercises.length > 0;
  const dateSeed = Number(dateFromDay(day).replace(/-/g, '')) || 1;
  const lines: Record<string, string[]> = {
    ippo: ['Hoy no necesitas ser perfecto; necesitas dar el siguiente golpe.', 'Cada comida es combustible para tu próximo entrenamiento.', 'Paso a paso. La constancia también se entrena.'],
    takamura: ['¡Nada de excusas! Primero cumple tus objetivos y después celebramos.', 'Quiero ver disciplina: agua, proteína y entrenamiento.', 'Tu nivel sube cuando tus hábitos dejan de depender de las ganas.'],
    miyata: ['Controla el ritmo y mantén la técnica: hoy también cuenta.', 'La precisión en tus hábitos termina marcando la diferencia.', 'No aceleres por ansiedad; avanza con estrategia.'],
    goku: ['¡Vamos! Cada día es una oportunidad para superar tu propio nivel.', 'Come para recuperarte y entrena para hacerte más fuerte.', 'Tu próximo nivel empieza con una pequeña decisión de hoy.'],
    vegeta: ['No mires a los demás. Supera tu propio récord.', 'La disciplina no necesita aplausos. Necesita constancia.', 'Completa tus objetivos de hoy y demuestra de qué estás hecho.'],
    gohan: ['La fuerza también está en aprender a cuidar tu cuerpo.', 'Equilibrio, disciplina y recuperación: ese es tu entrenamiento de hoy.', 'No subestimes una buena rutina repetida durante muchos días.'],
    piccolo: ['Observa tus datos, ajusta tu estrategia y continúa.', 'La paciencia también es una forma de entrenamiento.', 'Primero controla tus hábitos; después ellos trabajarán a tu favor.'],
    naruto: ['¡Hoy tampoco te rindas! Un paso más es un paso hacia tu objetivo.', 'Tu progreso se construye con pequeños hábitos repetidos.', 'Aunque el día sea difícil, todavía puedes completar una misión.'],
    sasuke: ['Mantén el foco. Menos ruido, más disciplina.', 'Analiza tus datos y ejecuta tu plan.', 'No necesitas demostrar nada: necesitas progresar.'],
    sakura: ['Cuidarte también es parte de hacerte más fuerte.', 'Nutrición y recuperación son entrenamiento, no extras.', 'Hoy puedes corregir una pequeña cosa y seguir avanzando.'],
    kakashi: ['Misión de hoy: cumple lo importante, no lo perfecto.', 'La estrategia gana cuando se mantiene durante el tiempo.', 'Revisa tus indicadores y decide tu siguiente movimiento.'],
    luffy: ['¡Aventura del día! Come bien, hidrátate y sigue avanzando.', 'Un capitán también cuida a su tripulación: empieza por tu cuerpo.', '¡Tu objetivo sigue ahí! Vamos por otra jornada.'],
    zoro: ['Tres cosas: disciplina, constancia y volver a intentarlo.', 'No pierdas el rumbo: cada registro te acerca a tu meta.', 'Entrena tu voluntad igual que entrenas tus músculos.'],
    nami: ['Los datos importan: controla tus recursos y no desperdicies energía.', 'Hidrátate y organiza tus comidas como una buena ruta.', 'Un buen plan hace que el viaje sea mucho más fácil.'],
    sanji: ['Alimenta tu cuerpo con intención y dale una buena recuperación.', 'Una comida bien registrada es una decisión bien tomada.', 'Hoy cocina, registra y sigue avanzando.'],
    tanjiro: ['Respira, mantén la concentración y cumple tu misión de hoy.', 'La constancia se construye con acciones pequeñas y honestas.', 'Cuida tu cuerpo con la misma atención que pones en tu objetivo.'],
    nezuko: ['🌸 Hoy también cuenta. Mantén tu ritmo y cuida tu energía.', 'Pequeños pasos, gran progreso.', 'Tu misión de hoy empieza con cuidarte.'],
    zenitsu: ['¡No te asustes por un día imperfecto! Sigue con la siguiente decisión.', 'Respira y haz una cosa bien ahora mismo.', 'La constancia aparece cuando sigues incluso con dudas.'],
    inosuke: ['¡A por todas! Pero registra lo que haces y controla tu recuperación.', 'Fuerza sí, pero también estrategia.', '¡Desafío aceptado! Completa tu misión de hoy.'],
    yuji: ['Tu fuerza también se construye cuidando lo que comes y cómo descansas.', 'Un buen día empieza con una decisión consciente.', 'Sigue avanzando; tu progreso es tuyo.'],
    megumi: ['Planifica, ejecuta y ajusta. No necesitas improvisarlo todo.', 'Los pequeños detalles también suman al resultado.', 'Mantén el foco en lo que sí puedes controlar hoy.'],
    nobara: ['Cuida tu cuerpo y hazlo con carácter.', 'No necesitas aprobación: necesitas hábitos que te funcionen.', 'Hoy toca cumplir tu misión y seguir adelante.'],
    gojo: ['Tu potencial no sirve de nada si no lo conviertes en hábitos.', 'Nivel alto, disciplina alta. Vamos con la misión de hoy.', 'Haz que tus números reflejen el esfuerzo que estás poniendo.'],
    yuta: ['La fuerza también requiere disciplina y recuperación.', 'Mantén la concentración y sigue construyendo tu progreso.', 'Cada pequeño avance cuenta cuando mantienes el rumbo.'],
    maki: ['Entrena con propósito y deja que tus resultados hablen.', 'Fuerza, técnica y constancia: vuelve a intentarlo.', 'Tu progreso se construye con trabajo medible.'],
    toji: ['Haz el trabajo. Sin ruido, sin excusas.', 'La preparación diaria marca la diferencia.', 'Controla tus hábitos y mejora tu rendimiento.'],
    sukuna: ['Hoy también tienes una misión que cumplir.', 'No desperdicies tu energía: úsala con intención.', 'Mantén el control de tus decisiones de hoy.'],
    eren: ['Sigue avanzando aunque el camino sea difícil.', 'Tu objetivo se construye con decisiones de cada día.', 'Mantén la determinación y completa tu misión.'],
    mikasa: ['Mantén el foco y protege tus hábitos importantes.', 'Disciplina primero; el progreso llega después.', 'Haz lo necesario hoy para acercarte a tu objetivo.'],
    levi: ['Limpia el ruido: datos claros y acciones concretas.', 'Haz bien lo básico y mantén la disciplina.', 'Tu rutina también necesita precisión.'],
    armin: ['Piensa la estrategia y después ejecuta.', 'Los datos pueden ayudarte a elegir el siguiente paso.', 'No subestimes una buena planificación.'],
    erwin: ['Avanza con un objetivo claro y mide tu progreso.', 'Una misión se completa con decisiones consistentes.', 'Mantén la disciplina incluso cuando cueste.'],
    hange: ['Observa tus datos, prueba ajustes y aprende.', 'La curiosidad también puede mejorar tus hábitos.', 'Experimenta con inteligencia y registra el resultado.'],
    deku: ['Analiza tu progreso, aprende y vuelve a intentarlo.', 'Cada registro es información para mejorar tu siguiente decisión.', 'No tienes que hacerlo perfecto para avanzar.'],
    bakugo: ['¡Nada de flojear! Cumple tu misión y sube de nivel.', 'Tu objetivo no se completa solo. Haz que pase.', 'Menos excusas, más acciones medibles.'],
    todoroki: ['Equilibrio: entrenamiento, alimentación y recuperación.', 'No necesitas extremos; necesitas consistencia.', 'Mantén la calma y sigue tu plan.'],
    allmight: ['¡Plus Ultra! Un pequeño esfuerzo extra puede marcar tu día.', 'Tu progreso merece constancia. ¡Sigue adelante!', 'La verdadera fuerza también consiste en cuidarte.'],
    hinata: ['¡Un punto más! Cada pequeño hábito suma al marcador.', 'Salta más alto: hidrátate, come bien y recupera.', 'Tu entrenamiento de hoy empieza con energía.'],
    kageyama: ['Precisión en cada registro. La técnica importa.', 'Haz bien lo básico y el resultado llegará con el tiempo.', 'Controla tus variables y mejora tu rendimiento.'],
    oikawa: ['La preparación diaria es lo que hace que el esfuerzo luzca.', 'Cuida los detalles: agua, sueño, comida y entrenamiento.', 'Hoy también puedes mejorar una pequeña parte de tu juego.'],
    bokuto: ['¡HEY HEY HEY! ¡Hoy vamos por otro nivel!', 'Aunque el día empiece bajo, podemos terminarlo arriba.', '¡Registra tu progreso y vamos con todo!'],
  };
  const pool = lines[keyName] || lines.ippo;
  if (day.water >= targets.water && proteinPct >= 1 && exercise) return `¡Misión completada! Nivel ${level}: hoy cumpliste agua, proteína y ejercicio. ${pool[dateSeed % pool.length]}`;
  if (!exercise) return `Misión pendiente: movimiento. ${pool[dateSeed % pool.length]}`;
  if (day.water < targets.water * 0.5) return `Misión pendiente: hidratación. ${pool[(dateSeed + 1) % pool.length]}`;
  if (proteinPct < 0.7) return `Misión pendiente: proteína. ${pool[(dateSeed + 2) % pool.length]}`;
  if (calories > targets.calories * 1.1) return `Revisa tu balance de hoy. ${pool[(dateSeed + 1) % pool.length]}`;
  return pool[dateSeed % pool.length];
}

function dateFromDay(day: Day) {
  return `${day.weight || 0}-${day.water || 0}-${day.sleep || 0}-${day.exercises.length}`;
}

const exerciseTypes = [
  ['Musculación', 5],
  ['Trote / Running', 8],
  ['Caminata', 3.5],
  ['Natación', 7],
  ['Ciclismo', 7],
  ['HIIT', 9],
  ['Elíptica', 5],
  ['Remo', 6],
  ['Fútbol', 8],
  ['Tenis', 7],
  ['Yoga / Flexibilidad', 3],
  ['Otro', 5],
] as const;

const today = () => new Date().toISOString().slice(0, 10);
const id = () => Math.random().toString(36).slice(2, 10);

const emptyMicros = (): Micros => ({
  fiber: 0, sugar: 0, sodium: 0, calcium: 0, iron: 0,
  potassium: 0, magnesium: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0,
});

const blankDay = (): Day => ({
  meals: Object.fromEntries(meals.map(m => [m, []])),
  water: 0,
  sleep: 0,
  weight: 0,
  exercises: [],
  supplements: [],
});

function normalizeFood(f: any): Food {
  return {
    name: String(f?.name || 'Alimento'),
    grams: Number(f?.grams || 0),
    kcal: Number(f?.kcal || 0),
    p: Number(f?.p || 0),
    c: Number(f?.c || 0),
    f: Number(f?.f || 0),
    confidence: f?.confidence == null ? undefined : Number(f.confidence),
    micros: f?.micros ? {
      fiber: Number(f.micros.fiber || 0),
      sugar: Number(f.micros.sugar || 0),
      sodium: Number(f.micros.sodium || 0),
      calcium: Number(f.micros.calcium || 0),
      iron: Number(f.micros.iron || 0),
      potassium: Number(f.micros.potassium || 0),
      magnesium: Number(f.micros.magnesium || 0),
      vitaminC: Number(f.micros.vitaminC || 0),
      vitaminD: Number(f.micros.vitaminD || 0),
      vitaminB12: Number(f.micros.vitaminB12 || 0),
    } : emptyMicros(),
  };
}

function normalizeDay(raw: any): Day {
  const base = blankDay();
  return {
    meals: Object.fromEntries(meals.map(m => [
      m,
      Array.isArray(raw?.meals?.[m]) ? raw.meals[m].map(normalizeFood) : [],
    ])),
    water: Number(raw?.water || 0),
    sleep: Number(raw?.sleep || 0),
    weight: Number(raw?.weight || 0),
    exercises: Array.isArray(raw?.exercises) ? raw.exercises.map((e: any) => ({
      id: String(e.id || id()),
      type: String(e.type || 'Otro'),
      duration: Number(e.duration || 0),
      kcal: Number(e.kcal || 0),
      image: typeof e.image === 'string' ? e.image : undefined,
    })) : base.exercises,
    supplements: Array.isArray(raw?.supplements) ? raw.supplements.map((s: any) => ({
      id: String(s.id || id()),
      name: String(s.name || 'Suplemento'),
      brand: s.brand ? String(s.brand) : undefined,
      serving: s.serving ? String(s.serving) : undefined,
      kcal: Number(s.kcal || 0),
      p: Number(s.p || 0),
      c: Number(s.c || 0),
      f: Number(s.f || 0),
      micros: s.micros || emptyMicros(),
      image: typeof s.image === 'string' ? s.image : undefined,
    })) : base.supplements,
  };
}

function defaultMicros(age: number, sex: 'hombre' | 'mujer', calories: number): Micros {
  const female = sex === 'mujer';
  return {
    fiber: Math.round((calories / 1000) * 14),
    sugar: 25,
    sodium: 2300,
    calcium: age > 50 && female ? 1200 : 1000,
    iron: female && age < 51 ? 18 : 8,
    potassium: female ? 2600 : 3400,
    magnesium: female ? (age >= 51 ? 320 : 320) : (age >= 51 ? 420 : 420),
    vitaminC: female ? 75 : 90,
    vitaminD: 15,
    vitaminB12: 2.4,
  };
}

function calculateTargets(age: number, sex: 'hombre' | 'mujer', weight: number, height: number, goal: UserProfile['goal'], activity: UserProfile['activity']): Targets {
  const bmr = sex === 'hombre'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const activityFactor = { sedentario: 1.2, ligero: 1.35, moderado: 1.55, alto: 1.725 }[activity];
  const tdee = bmr * activityFactor;
  const deficitByActivity = { sedentario: 500, ligero: 600, moderado: 700, alto: 800 }[activity];
  const calories = Math.round(
    goal === 'perder'
      ? Math.max(sex === 'mujer' ? 1300 : 1500, tdee - deficitByActivity)
      : tdee * ({ mantener: 1, ganar: 1.1 }[goal])
  );
  const proteinPerKg = { perder: 1.8, mantener: 1.6, ganar: 1.8 }[goal];
  const p = Math.round(weight * proteinPerKg);
  const f = Math.round((calories * 0.28) / 9);
  const c = Math.max(50, Math.round((calories - p * 4 - f * 9) / 4));
  const water = Math.max(2000, Math.min(3500, Math.round((weight * 30) / 250) * 250));
  return {
    calories,
    p,
    c,
    f,
    water,
    sleep: 8,
    micros: defaultMicros(age, sex, calories),
  };
}

function makeProfile(name: string): UserProfile {
  return {
    id: id(),
    name,
    age: 0,
    sex: 'hombre',
    height: 0,
    weight: 0,
    goal: 'perder',
    activity: 'moderado',
    targets: calculateTargets(30, 'hombre', 80, 175, 'perder', 'moderado'),
    setupComplete: false,
    animeTheme: 'hajime',
    animeCharacter: defaultAnimeCharacter('hajime'),    seasonStartedAt: undefined,
    days: {},
  };
}

const allowedAnimeThemes = new Set(animeThemes.map(([theme]) => theme));
function normalizeAnimeTheme(theme: unknown) {
  return typeof theme === 'string' && allowedAnimeThemes.has(theme) ? theme : 'hajime';
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.profiles)) {
        return {
          profiles: parsed.profiles.map((p: any) => ({
            ...makeProfile(String(p.name || 'Perfil')),
            ...p,
            targets: calculateTargets(
              Number(p.age || 30),
              p.sex === 'mujer' ? 'mujer' : 'hombre',
              Number(p.weight || 80),
              Number(p.height || 175),
              p.goal || 'perder',
              p.activity || 'moderado'
            ),
            animeTheme: normalizeAnimeTheme(p.animeTheme),
            animeCharacter: (() => {
              const theme = normalizeAnimeTheme(p.animeTheme);
              return animeCharacters[theme]?.some(([id]) => id === p.animeCharacter) ? p.animeCharacter : defaultAnimeCharacter(theme);
            })(),
            seasonStartedAt: p.seasonStartedAt,
            days: Object.fromEntries(Object.entries(p.days || {}).map(([d, value]) => [d, normalizeDay(value)])),
          })),
          activeProfileId: parsed.activeProfileId || parsed.profiles[0]?.id,
        };
      }
    }
    const old = JSON.parse(localStorage.getItem('nutricontrol-v2') || 'null');
    const migrated = makeProfile('Yo');
    if (old?.days) {
      migrated.days = Object.fromEntries(Object.entries(old.days).map(([d, value]) => [d, normalizeDay(value)]));
    }
    return { profiles: [migrated], activeProfileId: migrated.id };
  } catch {
    const p = makeProfile('Yo');
    return { profiles: [p], activeProfileId: p.id };
  }
}

function saveState(state: AppState) {
  localStorage.setItem(key, JSON.stringify(state));
}

function seasonNumber(startedAt?: string) {
  if (!startedAt) return 0;
  const start = new Date(startedAt + 'T12:00:00');
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(1, Math.floor(Math.max(0, months) / 3) + 1);
}

function seasonProgress(startedAt?: string) {
  if (!startedAt) return 0;
  const start = new Date(startedAt + 'T12:00:00');
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months % 3) / 3 * 100;
}

const microLabels: Array<[keyof Micros, string, string]> = [
  ['fiber', 'Fibra', 'g'],
  ['sugar', 'Azúcares', 'g'],
  ['sodium', 'Sodio', 'mg'],
  ['calcium', 'Calcio', 'mg'],
  ['iron', 'Hierro', 'mg'],
  ['potassium', 'Potasio', 'mg'],
  ['magnesium', 'Magnesio', 'mg'],
  ['vitaminC', 'Vitamina C', 'mg'],
  ['vitaminD', 'Vitamina D', 'µg'],
  ['vitaminB12', 'Vitamina B12', 'µg'],
];

export default function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [date, setDate] = useState(today());
  const [tab, setTab] = useState<'hoy' | 'semana' | 'perfil'>('hoy');
  const [modal, setModal] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiFoods, setAiFoods] = useState<Food[]>([]);
  const [aiSelected, setAiSelected] = useState<number[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupNewProfile, setSetupNewProfile] = useState(false);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [exerciseType, setExerciseType] = useState('Musculación');
  const [exerciseDuration, setExerciseDuration] = useState(45);
  const [exerciseIntensity, setExerciseIntensity] = useState<'suave' | 'moderada' | 'alta'>('moderada');
  const [exercisePhoto, setExercisePhoto] = useState<File | null>(null);
  const [supplementOpen, setSupplementOpen] = useState(false);
  const [supplementPhoto, setSupplementPhoto] = useState<File | null>(null);
  const [supplementBusy, setSupplementBusy] = useState(false);
  const [supplementError, setSupplementError] = useState('');
  const [supplementResult, setSupplementResult] = useState<Supplement | null>(null);

  const active = state.profiles.find(p => p.id === state.activeProfileId) || state.profiles[0];
  const day = active?.days[date] || blankDay();
  const targets = active?.targets || calculateTargets(30, 'hombre', 80, 175, 'perder', 'moderado');

  const totals = useMemo(() => {
    const foods = Object.values(day.meals).flat();
    return foods.reduce((a, f) => ({
      kcal: a.kcal + f.kcal,
      p: a.p + f.p,
      c: a.c + f.c,
      f: a.f + f.f,
      micros: Object.fromEntries(microLabels.map(([k]) => [k, a.micros[k] + Number(f.micros?.[k] || 0)])) as Micros,
    }), { kcal: 0, p: 0, c: 0, f: 0, micros: emptyMicros() });
  }, [day]);

  const exerciseTotal = day.exercises.reduce((s, e) => s + e.kcal, 0);
  const supplementMicros = day.supplements.reduce((acc, s) => Object.fromEntries(microLabels.map(([k]) => [k, acc[k] + Number(s.micros?.[k] || 0)])) as Micros, emptyMicros());
  const dailyMicros = Object.fromEntries(microLabels.map(([k]) => [k, totals.micros[k] + supplementMicros[k]])) as Micros;
  const kcalPct = Math.min(100, (totals.kcal / targets.calories) * 100);
  const totalXp = Object.values(active?.days || {}).reduce((sum, d) => {
    const kcal = Object.values(d.meals).flat().reduce((s, f) => s + f.kcal, 0);
    const protein = Object.values(d.meals).flat().reduce((s, f) => s + f.p, 0);
    return sum + Math.round(Math.min(kcal / targets.calories, 1) * 35 + Math.min(d.water / targets.water, 1) * 25 + Math.min(d.sleep / targets.sleep, 1) * 20 + (protein >= targets.p ? 20 : 0));
  }, 0);
  const level = Math.max(1, Math.floor(totalXp / 100) + 1);
  const levelXp = totalXp % 100;
  const currentTheme = active?.animeTheme || 'hajime';
  const currentCharacter = active?.animeCharacter || defaultAnimeCharacter(currentTheme);
  const currentCharacterName = animeCharacterName(currentTheme, currentCharacter);
  const currentCharacterIcon = characterIcons[currentCharacter] || '⭐';
  const currentCharacterStyle = characterStyles[currentCharacter] || 'black-red';
  const currentThemeAsset = themeAssets[currentTheme] || themeAssets.hajime;
  const currentCharacterImage = characterImages[currentCharacter] || themeCharacterImages[currentTheme] || themeCharacterImages.hajime;
  const currentThemeBanner = themeBanners[currentTheme] || themeBanners.hajime;
  const missionItems = [
    ['💧', `Beber ${Math.round(targets.water / 1000)} L de agua`, day.water >= targets.water],
    ['🥩', `Alcanzar ${Math.round(targets.p)} g de proteína`, totals.p >= targets.p],
    ['🏋️', 'Registrar entrenamiento', day.exercises.length > 0],
    ['🌙', `Dormir ${targets.sleep} horas`, day.sleep >= targets.sleep],
  ] as const;
  const seasonPct = active?.seasonStartedAt ? Math.round(seasonProgress(active.seasonStartedAt)) : 0;
  const seasonDays = active?.seasonStartedAt ? Math.max(1, Math.floor((Date.now() - new Date(active.seasonStartedAt + 'T12:00:00').getTime()) / 86400000) + 1) : 0;
  const characterMessage = dailyCharacterMessage(currentTheme, currentCharacter, day, targets, level);

  function commit(next: AppState) {
    setState(next);
    saveState(next);
  }

  function updateDay(fn: (d: Day) => void) {
    if (!active) return;
    const next = structuredClone(state);
    const p = next.profiles.find(x => x.id === active.id)!;
    p.days[date] = normalizeDay(p.days[date] || blankDay());
    fn(p.days[date]);
    commit(next);
  }

  function updateActiveProfile(fn: (p: UserProfile) => void) {
    const next = structuredClone(state);
    const p = next.profiles.find(x => x.id === active.id)!;
    fn(p);
    commit(next);
  }

  function openSetup(newProfile: boolean) {
    setSetupNewProfile(newProfile);
    setSetupOpen(true);
  }

  function finishSetup(form: { name: string; age: number; sex: 'hombre' | 'mujer'; height: number; weight: number; goal: UserProfile['goal']; activity: UserProfile['activity'] }) {
    const targets = calculateTargets(form.age, form.sex, form.weight, form.height, form.goal, form.activity);
    const next = structuredClone(state);
    let p: UserProfile;
    if (setupNewProfile) {
      p = makeProfile(form.name || 'Perfil familiar');
      p.id = id();
      next.profiles.push(p);
      next.activeProfileId = p.id;
    } else {
      p = next.profiles.find(x => x.id === active.id)!;
    }
    p.name = form.name || 'Perfil';
    p.age = form.age;
    p.sex = form.sex;
    p.height = form.height;
    p.weight = form.weight;
    p.goal = form.goal;
    p.activity = form.activity;
    p.targets = targets;
    p.setupComplete = true;
    const todayDay = p.days[today()] || blankDay();
    if (!todayDay.weight) todayDay.weight = form.weight;
    p.days[today()] = todayDay;
    commit(next);
    setSetupOpen(false);
  }

  function addProfile() {
    openSetup(true);
  }

  function switchProfile(profileId: string) {
    const next = structuredClone(state);
    next.activeProfileId = profileId;
    commit(next);    setDate(today());
  }

  function removeProfile(profileId: string) {
    if (state.profiles.length <= 1) return;
    if (!confirm('¿Eliminar este perfil familiar y todos sus registros?')) return;
    const next = structuredClone(state);
    next.profiles = next.profiles.filter(p => p.id !== profileId);
    if (!next.profiles.some(p => p.id === next.activeProfileId)) next.activeProfileId = next.profiles[0].id;
    commit(next);
  }

  function addWater(n: number) {
    updateDay(d => { d.water = Math.max(0, Math.min(10000, d.water + n)); });
  }

  function editSleep() {
    const v = Number(prompt('¿Cuántas horas dormiste? (0 a 24)') || 0);
    if (v >= 0 && v <= 24) updateDay(d => { d.sleep = v; });
  }

  function editWeight() {
    const v = Number(prompt('Peso de hoy en kg') || 0);
    if (v > 0 && v < 400) updateDay(d => { d.weight = v; });
  }

  function addFood(meal: string, f: Food) {
    updateDay(d => d.meals[meal].push(normalizeFood(f)));
    setModal(null);
    setPhoto(null);
    setAiFoods([]);
    setAiSelected([]);
  }

  function deleteFood(meal: string, index: number) {
    if (!confirm('¿Eliminar este alimento?')) return;
    updateDay(d => { d.meals[meal].splice(index, 1); });
  }

  function toggleAiFood(index: number) {
    setAiSelected(current => current.includes(index) ? current.filter(i => i !== index) : [...current, index]);
  }

  function addSelectedAiFoods() {
    if (!modal || !aiSelected.length) return;
    const selected = aiSelected.map(i => aiFoods[i]).filter(Boolean);
    updateDay(d => d.meals[modal].push(...selected.map(normalizeFood)));
    setModal(null); setPhoto(null); setAiFoods([]); setAiSelected([]);
  }

  function addAllAiFoods() {
    if (!modal || !aiFoods.length) return;
    updateDay(d => d.meals[modal].push(...aiFoods.map(normalizeFood)));
    setModal(null); setPhoto(null); setAiFoods([]); setAiSelected([]);
  }

  function resetDay() {
    if (!confirm(`¿Borrar todos los datos del día ${date}? Esta acción no se puede deshacer.`)) return;
    const next = structuredClone(state);
    const p = next.profiles.find(x => x.id === active.id)!;
    delete p.days[date];
    commit(next);
  }

  function resetAll() {
    if (!confirm('¿Borrar TODOS los perfiles y datos de NutriControl? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem(key);
    localStorage.removeItem('nutricontrol-v2');
    const fresh = makeProfile('Yo');
    const next = { profiles: [fresh], activeProfileId: fresh.id };
    setState(next);
    setTab('hoy');
    setSetupOpen(true);
    setSetupNewProfile(false);
  }

  async function analyze() {
    if (!photo) return;
    setAiBusy(true); setAiError(''); setAiFoods([]); setAiSelected([]);
    try {
      const prepared = await image.resizeIfNeeded(photo, { maxDimension: 1600, maxPixels: 2000000, quality: 0.82, mimeType: 'image/jpeg' });
      const r = await api.post('/api/analyze-food', { image: prepared.data, mimeType: prepared.mimeType });
      const foods = (r.data?.foods || []) as Food[];
      if (!foods.length) throw new Error('No pude identificar alimentos con suficiente seguridad.');
      setAiFoods(foods);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'No se pudo analizar la foto.');
    } finally {
      setAiBusy(false);
    }
  }

  async function addExercise() {
    if (!active || exerciseDuration <= 0) return;
    const baseMet = exerciseTypes.find(x => x[0] === exerciseType)?.[1] || 5;
    const intensityFactor = { suave: 0.8, moderada: 1, alta: 1.2 }[exerciseIntensity];
    const kcal = Math.round(baseMet * intensityFactor * active.weight * (exerciseDuration / 60));
    let attachment: string | undefined;
    if (exercisePhoto) {
      const prepared = await image.resizeIfNeeded(exercisePhoto, { maxDimension: 1000, maxPixels: 800000, quality: 0.65, mimeType: 'image/jpeg' });
      attachment = `data:${prepared.mimeType};base64,${prepared.data}`;
    }
    updateDay(d => d.exercises.push({ id: id(), type: exerciseType, duration: exerciseDuration, kcal, image: attachment }));
    setExercisePhoto(null);
    setExerciseOpen(false);
  }

  function deleteExercise(exerciseId: string) {
    updateDay(d => { d.exercises = d.exercises.filter(e => e.id !== exerciseId); });
  }

  function markFirstMilestone() {
    if (active?.seasonStartedAt) return;
    updateActiveProfile(p => { p.seasonStartedAt = today(); });
  }

  function changeAnimeTheme(theme: string) {
    updateActiveProfile(p => {
      p.animeTheme = theme;
      p.animeCharacter = defaultAnimeCharacter(theme);
    });
  }

  function changeAnimeCharacter(character: string) {
    updateActiveProfile(p => { p.animeCharacter = character; });
  }

  async function analyzeSupplement() {
    if (!supplementPhoto) return;
    setSupplementBusy(true); setSupplementError(''); setSupplementResult(null);
    try {
      const prepared = await image.resizeIfNeeded(supplementPhoto, { maxDimension: 1600, maxPixels: 2000000, quality: 0.8, mimeType: 'image/jpeg' });
      const r = await api.post('/api/analyze-supplement', { image: prepared.data, mimeType: prepared.mimeType });
      const result = r.data?.supplement;
      if (!result) throw new Error('No pude leer el suplemento. Intenta con una foto más clara de la etiqueta.');
      setSupplementResult({ ...result, id: id(), image: `data:${prepared.mimeType};base64,${prepared.data}` });
    } catch (e) {
      setSupplementError(e instanceof Error ? e.message : 'No se pudo analizar el suplemento.');
    } finally {
      setSupplementBusy(false);
    }
  }

  function addSupplement() {
    if (!supplementResult) return;
    updateDay(d => d.supplements.push(supplementResult));
    setSupplementOpen(false); setSupplementPhoto(null); setSupplementResult(null); setSupplementError('');
  }

  function deleteSupplement(supplementId: string) {
    updateDay(d => { d.supplements = d.supplements.filter(s => s.id !== supplementId); });
  }

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const x = active?.days[k] || blankDay();
    const t = Object.values(x.meals).flat().reduce((s, f) => s + f.kcal, 0);
    return { k, t, x };
  });

  const incomplete = !active?.setupComplete;

  return (
    <div className={`app theme-${active?.animeTheme || 'hajime'}`}>
      <aside className="sidebar">
        <div className="sidebarBrand"><span>🔥</span><div><b>NutriApp</b><small>DISCIPLINA HOY, RESULTADOS MAÑANA</small></div></div>
        <div className="sidebarTheme"><img src={currentThemeAsset.logo} alt={currentThemeAsset.alt} /><b>{animeThemes.find(([theme]) => theme === currentTheme)?.[1] || 'Anime'}</b></div>
        <nav className="sideNav">
          <button className={tab === 'hoy' ? 'active' : ''} onClick={() => setTab('hoy')}>⌂ <span>Inicio</span></button>
          <button onClick={() => { setTab('hoy'); setModal('Desayuno'); setAiFoods([]); setAiSelected([]); setAiError(''); setPhoto(null); }}>🍴 <span>Alimentación</span></button>
          <button onClick={() => { setTab('hoy'); setExerciseOpen(true); }}>🏋️ <span>Ejercicios</span></button>
          <button onClick={() => { setTab('hoy'); setSupplementOpen(true); setSupplementPhoto(null); setSupplementResult(null); setSupplementError(''); }}>💊 <span>Suplementos</span></button>
          <button onClick={() => { const v = Number(prompt('Agua en ml. Usa un número positivo para agregar y negativo para quitar:', '250') || 0); if (Number.isFinite(v) && v !== 0) addWater(v); }}>💧 <span>Agua</span></button>
          <button onClick={() => { setTab('hoy'); editSleep(); }}>◔ <span>Sueño</span></button>
          <button className={tab === 'semana' ? 'active' : ''} onClick={() => setTab('semana')}>▥ <span>Progreso</span></button>
          <button onClick={() => setTab('hoy')}>🏆 <span>Misiones</span></button>
          <button onClick={() => setTab('perfil')}>👥 <span>Familia</span></button>
          <button onClick={() => setTab('perfil')}>● <span>Perfil</span></button>
          <button onClick={() => setTab('perfil')}>⚙ <span>Configuración</span></button>
        </nav>
        <div className="sidebarQuote">Disciplina hoy,<br />resultados mañana.</div>
      </aside>
      <header>
        <div className="topbarTitle"><span className="brand">🔥 NutriApp</span><span className="sub">Tu historia, más fuerte · <b>{currentCharacterName}</b></span></div>
        <div className="profileBar">
          <span className="topbarAnime"><img src={currentThemeAsset.logo} alt={currentThemeAsset.alt} />{animeThemes.find(([theme]) => theme === currentTheme)?.[1] || 'Anime'}</span>
          <select value={active?.id || ''} onChange={e => switchProfile(e.target.value)}>
            {state.profiles.map(p => <option key={p.id} value={p.id}>{p.name}{p.setupComplete ? '' : ' · configurar'}</option>)}
          </select>
          <button onClick={addProfile}>＋ Familia</button>
        </div>
      </header>
      <main>
        <div className="dashboardLayout">
          <div className="dashboardPrimary">
            <section className="hero">
              <div className="heroBackdrop"><img src={proxiedImage(currentThemeBanner)} alt="" referrerPolicy="no-referrer" data-original-src={currentThemeBanner} onError={handleImageError} /></div>
              <div className="heroMain">                <div className="heroLogo"><img src={currentThemeAsset.logo} alt={currentThemeAsset.alt} /></div>
                <div className="eyebrow">{active?.seasonStartedAt ? `TEMPORADA ${seasonNumber(active.seasonStartedAt)}` : 'TEMPORADA SIN INICIAR'} · {animeThemes.find(([theme]) => theme === currentTheme)?.[1] || 'Anime'}</div>
                <h1>¡Hoy se pelea por el progreso!</h1>
                <p>{active?.seasonStartedAt ? 'Cada 3 meses comienza una nueva temporada.' : 'Marca tu primer hito cuando estés listo para comenzar tu temporada.'}</p>
                <div className="characterDialogue">
                  <div className={`characterPortrait ${currentCharacterStyle}`} aria-label={currentCharacterName}><img src={characterDisplayImage(currentCharacterImage)} alt={currentCharacterName} referrerPolicy="no-referrer" data-original-src={currentCharacterImage} data-character-key={currentCharacter} data-character-fallback={characterAvatarDataUri(currentCharacter)} onError={handleImageError} /><span>{currentCharacterIcon}</span></div>
                  <div><strong>{currentCharacterName}</strong><p>{characterMessage}</p></div>
                </div>
                {!active?.seasonStartedAt && <button className="milestoneButton" onClick={markFirstMilestone}>🏆 Marcar primer hito · comenzar temporada 1</button>}
              </div>
            </section>

            <nav>
          <button className={tab === 'hoy' ? 'active' : ''} onClick={() => setTab('hoy')}>Hoy</button>
          <button className={tab === 'semana' ? 'active' : ''} onClick={() => setTab('semana')}>Semana</button>
          <button className={tab === 'perfil' ? 'active' : ''} onClick={() => setTab('perfil')}>Perfil</button>
        </nav>

        {tab === 'hoy' && (
          <>
            <div className="date">
              <button onClick={() => setDate(today())}>Hoy</button>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              <button className="dangerOutline" onClick={resetDay}>🗑️ Borrar día</button>
            </div>

            <section className="stats">
              <div className="card metricCard"><span>🔥 CALORÍAS</span><b>{Math.round(totals.kcal)} / {targets.calories}</b><small>kcal</small><div className="bar"><i style={{ width: kcalPct + '%' }} /></div><em>{Math.round(kcalPct)}%</em></div>
              <div className="card metricCard"><span>💪 PROTEÍNA</span><b>{Math.round(totals.p)} / {targets.p}</b><small>gramos</small><div className="bar"><i style={{ width: Math.min(100, totals.p / targets.p * 100) + '%' }} /></div><em>{Math.round(Math.min(100, totals.p / targets.p * 100))}%</em></div>
              <div className="card metricCard"><span>🌾 CARBOHIDRATOS</span><b>{Math.round(totals.c)} / {targets.c}</b><small>gramos</small><div className="bar"><i style={{ width: Math.min(100, totals.c / targets.c * 100) + '%' }} /></div><em>{Math.round(Math.min(100, totals.c / targets.c * 100))}%</em></div>
              <div className="card metricCard"><span>🥑 GRASAS</span><b>{Math.round(totals.f)} / {targets.f}</b><small>gramos</small><div className="bar"><i style={{ width: Math.min(100, totals.f / targets.f * 100) + '%' }} /></div><em>{Math.round(Math.min(100, totals.f / targets.f * 100))}%</em></div>
              <div className="card metricCard"><span>💧 AGUA</span><b>{day.water / 1000} / {targets.water / 1000}</b><small>litros</small><div className="bar"><i style={{ width: Math.min(100, day.water / targets.water * 100) + '%' }} /></div><em>{Math.round(Math.min(100, day.water / targets.water * 100))}%</em></div>
              <div className="card metricCard"><span>🌙 SUEÑO</span><b>{day.sleep || 0} / {targets.sleep}</b><small>horas</small><div className="bar"><i style={{ width: Math.min(100, day.sleep / targets.sleep * 100) + '%' }} /></div><em>{Math.round(Math.min(100, day.sleep / targets.sleep * 100))}%</em><button onClick={editSleep}>{day.sleep ? 'Editar' : 'Registrar'}</button></div>
              <div className="card metricCard"><span>👟 EJERCICIO</span><b>{day.exercises.reduce((s,e) => s + e.duration, 0)} / 30</b><small>minutos</small><div className="bar"><i style={{ width: Math.min(100, day.exercises.reduce((s,e) => s + e.duration, 0) / 30 * 100) + '%' }} /></div><em>{Math.round(Math.min(100, day.exercises.reduce((s,e) => s + e.duration, 0) / 30 * 100))}%</em></div>
              <div className="card metricCard"><span>💊 SUPLEMENTOS</span><b>{day.supplements.length} / 3</b><small>registros</small><div className="bar"><i style={{ width: Math.min(100, day.supplements.length / 3 * 100) + '%' }} /></div><em>{Math.round(Math.min(100, day.supplements.length / 3 * 100))}%</em></div>
            </section>
            <section className="quickActions">
              <button onClick={() => { setModal('Desayuno'); setAiFoods([]); setAiSelected([]); setAiError(''); setPhoto(null); }}><span>＋</span><b>Añadir comida</b><small>Foto + IA</small></button>
              <button onClick={() => setExerciseOpen(true)}><span>＋</span><b>Registrar ejercicio</b><small>Entrenamiento</small></button>
              <button onClick={() => { setSupplementOpen(true); setSupplementPhoto(null); setSupplementResult(null); setSupplementError(''); }}><span>＋</span><b>Añadir suplemento</b><small>Vitaminas y micros</small></button>
              <button onClick={editSleep}><span>＋</span><b>Registrar sueño</b><small>Recuperación</small></button>
            </section>

            <section className="macro card">
              <h2>Macros del día</h2>
              <div className="macrogrid">
                <div>🥩<b>{Math.round(totals.p)} / {targets.p} g</b><small>Proteína</small></div>
                <div>🍚<b>{Math.round(totals.c)} / {targets.c} g</b><small>Carbohidratos</small></div>
                <div>🥑<b>{Math.round(totals.f)} / {targets.f} g</b><small>Grasas</small></div>
              </div>
            </section>

            <section className="card microCard">
              <div className="sectionTitle"><h2>Micronutrientes</h2><span>meta diaria orientativa</span></div>
              <div className="microgrid">
                {microLabels.map(([k, label, unit]) => {
                  const value = dailyMicros[k];
                  const target = targets.micros[k];
                  const pct = k === 'sodium' || k === 'sugar' ? Math.min(100, (value / target) * 100) : Math.min(100, (value / target) * 100);
                  return <div className="microItem" key={k}><div><b>{label}</b><small>{Math.round(value * 10) / 10} / {target} {unit}</small></div><div className="bar"><i style={{ width: pct + '%' }} /></div></div>;
                })}
              </div>
            </section>

            <section className="card exerciseCard">
              <div className="sectionTitle"><h2>Ejercicio</h2><button onClick={() => setExerciseOpen(true)}>＋ Registrar ejercicio</button></div>
              {day.exercises.length ? day.exercises.map(e => <div className="exerciseRow" key={e.id}><div><b>🏋️ {e.type}</b><small>{e.duration} min · ~{e.kcal} kcal</small>{e.image && <img className="attachmentThumb" src={e.image} alt="Registro del entrenamiento" />}</div><button className="iconDanger" onClick={() => deleteExercise(e.id)}>🗑️</button></div>) : <p className="muted">Sin ejercicio registrado hoy.</p>}
              {day.exercises.length > 0 && <div className="exerciseTotal">Total ejercicio: <b>{exerciseTotal} kcal</b></div>}
              <p className="attachmentHint">Puedes adjuntar una foto o pantallazo del entrenamiento del reloj/app.</p>
            </section>

            <section className="card supplementCard">
              <div className="sectionTitle"><h2>💊 Suplementos y vitaminas</h2><button onClick={() => { setSupplementOpen(true); setSupplementPhoto(null); setSupplementResult(null); setSupplementError(''); }}>＋ Añadir suplemento</button></div>
              {day.supplements.length ? day.supplements.map(s => <div className="supplementRow" key={s.id}><div><b>💊 {s.name}</b><small>{s.brand || ''}{s.serving ? ` · ${s.serving}` : ''}</small><small>{microLabels.filter(([k]) => Number(s.micros?.[k] || 0) > 0).slice(0,4).map(([k,label,unit]) => `${label} ${s.micros?.[k]} ${unit}`).join(' · ')}</small>{s.image && <img className="attachmentThumb" src={s.image} alt="Etiqueta del suplemento" />}</div><button className="iconDanger" onClick={() => deleteSupplement(s.id)}>🗑️</button></div>) : <p className="muted">Sin suplementos registrados hoy.</p>}
              {day.supplements.length > 0 && <div className="exerciseTotal">Los micronutrientes de los suplementos se suman al balance diario.</div>}
            </section>

            <div className="sectionTitle"><h2>Comidas</h2><span>{Math.round(totals.kcal)} / {targets.calories} kcal</span></div>
            <section className="meals">
              {meals.map(m => <div className="meal card" key={m}><div className="mealContent"><h3>{m}</h3>{day.meals[m].length ? <div className="foodList">{day.meals[m].map((f, i) => <div className="foodItem" key={i}><div><b>{f.name}</b><small>{Math.round(f.kcal)} kcal · P {Math.round(f.p)} g · C {Math.round(f.c)} g · G {Math.round(f.f)} g</small></div><button className="iconDanger" onClick={() => deleteFood(m, i)} title="Eliminar alimento">🗑️</button></div>)}</div> : <p>Sin registrar</p>}</div><button onClick={() => { setModal(m); setAiFoods([]); setAiSelected([]); setAiError(''); setPhoto(null); }}>＋ Añadir</button></div>)}
            </section>
          </>
        )}

        {tab === 'semana' && <section className="card"><h2>Últimos 7 días</h2>{week.map(w => <div className="week" key={w.k}><span>{new Date(w.k + 'T12:00').toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit' })}</span><div className="bar"><i style={{ width: Math.min(100, (w.t / targets.calories) * 100) + '%' }} /></div><b>{Math.round(w.t)} kcal</b></div>)}</section>}

        {tab === 'perfil' && (
          <section className="card profilePage">
            <h2>Perfil y configuración</h2>
            <div className="profileSummary"><b>{active.name}</b><span>{active.age} años · {active.height} cm · {active.weight} kg</span><span>Objetivo: {active.goal === 'perder' ? 'Perder grasa/peso' : active.goal === 'ganar' ? 'Ganar masa muscular' : 'Mantener peso'}</span></div>
            <div className="settingsGrid">
              <div><span>Objetivo diario</span><b>{targets.calories} kcal</b></div><div><span>Proteína</span><b>{targets.p} g</b></div><div><span>Carbohidratos</span><b>{targets.c} g</b></div><div><span>Grasas</span><b>{targets.f} g</b></div>
            </div>
            <div className="profileActions"><button onClick={() => openSetup(false)}>⚙️ Editar perfil y objetivos</button><button onClick={editWeight}>⚖️ {day.weight ? 'Editar peso' : 'Registrar peso'}</button>{day.weight > 0 && <button className="dangerOutline" onClick={() => updateDay(d => { d.weight = 0; })}>Quitar peso del día</button>}</div>
            <h3>🎨 Tema anime del perfil</h3>
            <p>Elige un anime real para personalizar la ambientación de este perfil. Los gráficos son originales y no usan material oficial del anime.</p>
            <div className="themeGrid">{animeThemes.map(([theme,name,desc]) => <button key={theme} className={active.animeTheme === theme ? 'themeActive' : ''} onClick={() => changeAnimeTheme(theme)}><div className="themeBanner"><img src={proxiedImage(themeBanners[theme])} alt={name} referrerPolicy="no-referrer" data-original-src={themeBanners[theme]} onError={handleImageError} /><div className="themeBannerShade" /><div className="themeBannerText"><b>{name}</b><small>{desc}</small><em>NUTRICONTROL · RPG SEASON</em></div></div></button>)}</div>
            <h3>🧑‍🎤 Personaje</h3>
            <p>Elige el personaje que representará este perfil. Puedes cambiarlo cuando quieras.</p>
            <div className="characterGrid">{(animeCharacters[active.animeTheme] || []).map(([characterId, name]) => <button key={characterId} className={active.animeCharacter === characterId ? 'characterActive' : ''} onClick={() => changeAnimeCharacter(characterId)}><span className="characterBadge"><CharacterAvatar characterId={characterId} name={name} /></span><b>{name}</b></button>)}</div>
            <div className="selectedCharacter"><img className="selectedThemeLogo" src={themeAssets[active.animeTheme]?.logo} alt={themeAssets[active.animeTheme]?.alt || 'Logo anime'} /><span>Personaje activo: <b>{animeCharacterName(active.animeTheme, active.animeCharacter)}</b><small>{themeAssets[active.animeTheme]?.credit}</small></span></div>
            <h3>🏆 Temporada</h3>
            {active.seasonStartedAt ? <div className="seasonBox"><b>Temporada {seasonNumber(active.seasonStartedAt)}</b><span>Iniciada el {new Date(active.seasonStartedAt + 'T12:00:00').toLocaleDateString('es-CL')}</span><small>{Math.round(seasonProgress(active.seasonStartedAt))}% del ciclo actual</small></div> : <div className="seasonBox"><b>Aún no iniciada</b><span>La temporada comenzará cuando marques tu primer hito.</span><button className="primary" onClick={markFirstMilestone}>🏆 Marcar primer hito</button></div>}
            <h3>Perfiles familiares</h3>
            <div className="familyList">{state.profiles.map(p => <div className="familyItem" key={p.id}><div><b>👤 {p.name}</b><small>{p.setupComplete ? `${p.age} años · ${p.weight} kg · ${p.height} cm` : 'Falta completar configuración'}</small></div><div><button onClick={() => switchProfile(p.id)}>Abrir</button>{state.profiles.length > 1 && <button className="dangerOutline" onClick={() => removeProfile(p.id)}>Eliminar</button>}</div></div>)}</div>
            <button onClick={addProfile}>＋ Agregar perfil familiar</button>
            <hr />
            <h3>Gestión de datos</h3>
            <div className="resetBox"><button className="dangerOutline" onClick={resetDay}>🗑️ Borrar datos del día</button><button className="danger" onClick={resetAll}>⚠️ Restablecer NutriControl completo</button></div>
            <p className="warning">Los perfiles y registros se guardan localmente en este dispositivo. Las metas son estimaciones orientativas y no sustituyen una evaluación profesional.</p>
          </section>
        )}

            {tab === 'hoy' && <section className="seasonProgressCard">
              <div className="seasonProgressHeader"><div><b>Tu progreso · Temporada {active?.seasonStartedAt ? seasonNumber(active.seasonStartedAt) : 1}</b><small>{active?.seasonStartedAt ? `Día ${seasonDays} de 90` : 'La temporada empieza con tu primer hito'}</small></div><span>{seasonPct}%</span></div>
              <div className="seasonTimeline">{Array.from({ length: 12 }, (_, i) => { const reached = seasonPct >= ((i + 1) * 100 / 12); return <div key={i} className={reached ? 'timelineStep reached' : 'timelineStep'}><i>{i === 0 && active?.seasonStartedAt ? '＋' : reached ? '✓' : ''}</i><small>{i === 0 ? 'Inicio' : i === 11 ? 'Gran Hito' : `Semana ${i + 1}`}</small></div>; })}</div>
              <div className="seasonProgressFooter"><span>🔥 Sigue construyendo tu racha.</span><button onClick={() => setTab('semana')}>Ver detalles de la temporada <b>›</b></button></div>
            </section>}
          </div>

          <aside className="rightRail">
            <div className="railDate"><span>🔔</span><b>{new Date(date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</b></div>
            <section className="profileRail">
              <div className="profileRailImage"><CharacterAvatar characterId={active?.animeCharacter || defaultAnimeCharacter(active?.animeTheme || 'hajime')} name={currentCharacterName} /><button onClick={() => setTab('perfil')} aria-label="Editar personaje">✎</button></div>
              <h3>{currentCharacterName}</h3><p>Miembro desde {active?.seasonStartedAt ? new Date(active.seasonStartedAt + 'T12:00:00').toLocaleDateString('es-CL') : 'hoy'}</p>
              <div className="railSeason"><b>TEMPORADA {active?.seasonStartedAt ? seasonNumber(active.seasonStartedAt) : 1}</b><span>Día {active?.seasonStartedAt ? seasonDays : 1} de 90</span></div>
              <div className="railBar"><i style={{ width: seasonPct + '%' }} /></div>
              <div className="railLevel"><b>NIVEL {level}</b><span>{levelXp} / 1.000 XP</span></div>
              <blockquote>“{characterMessage.split('. ')[0]}.”<small>✦ — {currentCharacterName}</small></blockquote>
            </section>
            <section className="railMissions"><h3>🎯 Misiones de hoy</h3>{missionItems.map(([icon,label,done]) => <div key={label} className={done ? 'mission done' : 'mission'}><span>{done ? '✓' : '□'}</span>{icon}<b>{label}</b></div>)}</section>
            <section className="railQuote"><CharacterAvatar characterId={active?.animeCharacter || defaultAnimeCharacter(active?.animeTheme || 'hajime')} name={currentCharacterName} /><b>LOS LÍMITES<br />SOLO EXISTEN<br />EN LA MENTE.</b></section>
          </aside>
        </div>
      </main>

      {modal && <div className="overlay"><div className="modal"><button className="close" onClick={() => setModal(null)}>×</button><h2>📸 Añadir a {modal}</h2><div className="drop"><label>📷 Tomar o elegir foto<input type="file" accept="image/*" capture="environment" onChange={e => setPhoto(e.target.files?.[0] || null)} /></label>{photo && <p>{photo.name}</p>}<button className="primary" disabled={!photo || aiBusy} onClick={analyze}>{aiBusy ? 'Analizando…' : '✨ Analizar con IA'}</button></div>{aiError && <div className="error">{aiError}</div>}{aiFoods.length > 0 && <><div className="aiHeader"><h3>Resultado de IA</h3><div className="aiBulkActions"><button onClick={addSelectedAiFoods} disabled={!aiSelected.length}>Añadir seleccionados ({aiSelected.length})</button><button className="primary" onClick={addAllAiFoods}>Añadir todos ({aiFoods.length})</button></div></div><p className="aiHint">Puedes añadir uno, seleccionar varios o incorporar todos los alimentos detectados de una vez.</p>{aiFoods.map((f, i) => { const selected = aiSelected.includes(i); return <div className={'airow' + (selected ? ' selected' : '')} key={i}><label className="aiSelect"><input type="checkbox" checked={selected} onChange={() => toggleAiFood(i)} /></label><div><b>{f.name}</b><small>{Math.round(f.grams)} g · confianza {Math.round((f.confidence || 0) * 100)}%</small></div><strong>{Math.round(f.kcal)} kcal</strong><button onClick={() => addFood(modal, f)}>Añadir</button></div>; })}</>}<div className="manual"><p>También puedes registrar alimentos manualmente.</p><button onClick={() => { const n = prompt('Alimento'); const k = Number(prompt('Calorías') || 0); const p = Number(prompt('Proteína (g)') || 0); const c = Number(prompt('Carbohidratos (g)') || 0); const f = Number(prompt('Grasas (g)') || 0); if (n && k > 0) addFood(modal, { name: n, grams: 0, kcal: k, p, c, f }); }}>Entrada manual</button></div></div></div>}

      {exerciseOpen && <div className="overlay"><div className="modal smallModal"><button className="close" onClick={() => setExerciseOpen(false)}>×</button><h2>🏃 Registrar ejercicio</h2><label className="formField"><span>Actividad</span><select value={exerciseType} onChange={e => setExerciseType(e.target.value)}>{exerciseTypes.map(([name]) => <option key={name}>{name}</option>)}</select></label><label className="formField"><span>Duración (minutos)</span><input type="number" min="1" max="600" value={exerciseDuration} onChange={e => setExerciseDuration(Number(e.target.value))} /></label><label className="formField"><span>Intensidad</span><select value={exerciseIntensity} onChange={e => setExerciseIntensity(e.target.value as any)}><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="alta">Alta</option></select></label><label className="formField"><span>Foto o pantallazo del entrenamiento (opcional)</span><input type="file" accept="image/*" capture="environment" onChange={e => setExercisePhoto(e.target.files?.[0] || null)} /></label><p className="muted">Calorías estimadas según peso, duración, actividad e intensidad. La imagen queda asociada al registro.</p><button className="primary fullButton" onClick={addExercise}>＋ Guardar ejercicio</button></div></div>}

      {supplementOpen && <div className="overlay"><div className="modal smallModal"><button className="close" onClick={() => setSupplementOpen(false)}>×</button><h2>💊 Añadir suplemento o vitamina</h2><div className="drop"><label>📷 Foto o pantallazo de la etiqueta<input type="file" accept="image/*" capture="environment" onChange={e => { setSupplementPhoto(e.target.files?.[0] || null); setSupplementResult(null); }} /></label>{supplementPhoto && <p>{supplementPhoto.name}</p>}<button className="primary" disabled={!supplementPhoto || supplementBusy} onClick={analyzeSupplement}>{supplementBusy ? 'Analizando etiqueta…' : '✨ Analizar suplemento con IA'}</button></div>{supplementError && <div className="error">{supplementError}</div>}{supplementResult && <div className="supplementResult"><h3>{supplementResult.name}</h3><p>{supplementResult.brand || ''}{supplementResult.serving ? ` · ${supplementResult.serving}` : ''}</p><div className="microgrid">{microLabels.filter(([k]) => Number(supplementResult.micros?.[k] || 0) > 0).map(([k,label,unit]) => <div className="microItem" key={k}><b>{label}</b><small>{supplementResult.micros?.[k]} {unit}</small></div>)}</div><button className="primary fullButton" onClick={addSupplement}>＋ Añadir y sumar al día</button></div>}</div></div>}


      {(setupOpen || incomplete) && <SetupModal profile={active} onClose={() => active?.setupComplete && setSetupOpen(false)} onSave={finishSetup} isNew={setupNewProfile} />}
    </div>
  );
}

function SetupModal({ profile, onClose, onSave, isNew }: { profile?: UserProfile; onClose: () => void; onSave: (form: { name: string; age: number; sex: 'hombre' | 'mujer'; height: number; weight: number; goal: UserProfile['goal']; activity: UserProfile['activity'] }) => void; isNew: boolean }) {
  const [name, setName] = useState(profile?.setupComplete ? profile.name : profile?.name === 'Yo' ? '' : profile?.name || '');
  const [age, setAge] = useState(profile?.age || 30);
  const [sex, setSex] = useState<'hombre' | 'mujer'>(profile?.sex || 'hombre');
  const [height, setHeight] = useState(profile?.height || 170);
  const [weight, setWeight] = useState(profile?.weight || 70);
  const [goal, setGoal] = useState<UserProfile['goal']>(profile?.goal || 'perder');
  const [activity, setActivity] = useState<UserProfile['activity']>(profile?.activity || 'moderado');

  return <div className="overlay"><div className="modal setupModal"><h2>{isNew ? '👨‍👩‍👧 Nuevo perfil familiar' : '👋 Configura tu perfil'}</h2><p className="muted">Con tu edad, sexo, peso, altura, actividad y objetivo calcularemos metas personalizadas de calorías, macros y micronutrientes.</p><div className="formGrid"><label className="formField"><span>Nombre</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Paulo" /></label><label className="formField"><span>Edad</span><input type="number" min="16" max="100" value={age} onChange={e => setAge(Number(e.target.value))} /></label><label className="formField"><span>Sexo</span><select value={sex} onChange={e => setSex(e.target.value as 'hombre' | 'mujer')}><option value="hombre">Hombre</option><option value="mujer">Mujer</option></select></label><label className="formField"><span>Altura (cm)</span><input type="number" min="120" max="230" value={height} onChange={e => setHeight(Number(e.target.value))} /></label><label className="formField"><span>Peso (kg)</span><input type="number" min="30" max="300" step="0.1" value={weight} onChange={e => setWeight(Number(e.target.value))} /></label><label className="formField"><span>Actividad habitual</span><select value={activity} onChange={e => setActivity(e.target.value as UserProfile['activity'])}><option value="sedentario">Sedentario</option><option value="ligero">Ligero</option><option value="moderado">Moderado</option><option value="alto">Alto</option></select></label></div><div className="goalGrid"><button className={goal === 'perder' ? 'goalActive' : ''} onClick={() => setGoal('perder')}>🔥 Perder peso/grasa</button><button className={goal === 'mantener' ? 'goalActive' : ''} onClick={() => setGoal('mantener')}>⚖️ Mantener</button><button className={goal === 'ganar' ? 'goalActive' : ''} onClick={() => setGoal('ganar')}>💪 Ganar masa muscular</button></div><div className="setupActions"><button onClick={onClose} disabled={!profile?.setupComplete}>Cancelar</button><button className="primary" disabled={!name.trim() || age < 16 || height < 120 || weight < 30} onClick={() => onSave({ name: name.trim(), age, sex, height, weight, goal, activity })}>✨ Calcular mis metas</button></div></div></div>;
}
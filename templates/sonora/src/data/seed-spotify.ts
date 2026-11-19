import type { AlbumItem, ArtistItem, EqPreset, GenreItem, LyricLine, PlaylistItem, TrackItem } from '@/types/spotify';

/** Music: Jason Shaw / Audionautix.com, CC BY 3.0, hosted on Wikimedia Commons (sends CORS headers, so the equalizer can process it). */
const WM = 'https://upload.wikimedia.org/wikipedia/commons/';
export const MUSIC_CREDIT = 'Music by Jason Shaw (Audionautix.com), licensed CC BY 3.0, via Wikimedia Commons.';

/** Spreads lyric lines evenly over the song: "line one / line two / ...". */
function lyr(duration: number, text: string): LyricLine[] {
  const lines = text.split('/').map((l) => l.trim());
  const start = Math.min(6, duration * 0.08);
  const step = (duration - start - 4) / lines.length;
  return lines.map((t, i) => ({ time: Math.round((start + i * step) * 10) / 10, text: t }));
}

export const ARTISTS: ArtistItem[] = [
  { id: 'crocbyte-beats', name: 'CrocByte Beats', cover: { color: '#2e7d32', accent: '#a5d6a7' }, monthlyListeners: 4823117, city: 'Bangkok, TH', bio: 'CrocByte Beats builds head-nodding boom-bap out of dusty samples, swamp-green synths and a drum machine that has seen too much. Every beat is cooked between midnight and sunrise.' },
  { id: 'synthwave-collective', name: 'SynthWave Collective', cover: { color: '#7b1fa2', accent: '#ff80ab' }, monthlyListeners: 3190442, city: 'Los Angeles, US', bio: 'A rotating crew of analog nerds chasing neon sunsets, chrome highways and the warm hum of tape. Headphones recommended, sunglasses optional.' },
  { id: 'lofi-dreamers', name: 'Lo-Fi Dreamers', cover: { color: '#5d4037', accent: '#ffcc80' }, monthlyListeners: 6012876, city: 'Osaka, JP', bio: 'Soft keys, vinyl crackle and rain on the window. Lo-Fi Dreamers soundtrack late study sessions and long coding nights for millions of listeners.' },
  { id: 'cyberpunk-orchestra', name: 'Cyberpunk Orchestra', cover: { color: '#c62828', accent: '#40c4ff' }, monthlyListeners: 1764301, city: 'Berlin, DE', bio: 'Brass, strings and distorted bass collide in cinematic tracks built for boss fights, heists and rooftop chases in the rain.' },
  { id: 'midnight-jazz', name: 'Midnight Jazz', cover: { color: '#1a237e', accent: '#ffd54f' }, monthlyListeners: 2255980, city: 'New Orleans, US', bio: 'A smoky late-night trio playing standards, bebop runs and slow-burn ballads. Best enjoyed after 11pm with the lights low.' },
  { id: 'future-bass-lab', name: 'Future Bass Lab', cover: { color: '#00838f', accent: '#ffff8d' }, monthlyListeners: 3987112, city: 'Seoul, KR', bio: 'Supersaws, big drops and sunny hooks. Future Bass Lab turns every chorus into a festival moment.' },
  { id: 'orbit-kids', name: 'Orbit Kids', cover: { color: '#4527a0', accent: '#80deea' }, monthlyListeners: 1402233, city: 'Houston, US', bio: 'Two friends, one telescope and a closet full of synths. Orbit Kids write space-age lullabies for long drives and longer nights.' },
  { id: 'deep-blue-drift', name: 'Deep Blue Drift', cover: { color: '#01579b', accent: '#b3e5fc' }, monthlyListeners: 2711904, city: 'Lisbon, PT', bio: 'Ambient piano and tidal field recordings. Deep Blue Drift makes music that breathes slower than you do.' },
  { id: 'heist-protocol', name: 'Heist Protocol', cover: { color: '#37474f', accent: '#ff6e40' }, monthlyListeners: 987650, city: 'London, UK', bio: 'Cinematic tension for detectives, gamers and anyone who reads the last page first.' },
  { id: 'radio-riot', name: 'Radio Riot', cover: { color: '#ad1457', accent: '#ffee58' }, monthlyListeners: 1890321, city: 'Melbourne, AU', bio: 'Loud guitars, sugar-rush choruses and a drummer who never sits down. Radio Riot was built for the open road.' },
];

const C = {
  neon: { color: '#8e24aa', accent: '#ff4081' },
  loops: { color: '#795548', accent: '#ffe0b2' },
  blue: { color: '#283593', accent: '#ffca28' },
  circuit: { color: '#b71c1c', accent: '#00e5ff' },
  single: { color: '#c0392b', accent: '#f5e6c8' },
  tape: { color: '#1b5e20', accent: '#c6ff00' },
  drop: { color: '#00838f', accent: '#fff176' },
  orbit: { color: '#311b92', accent: '#84ffff' },
  tide: { color: '#0277bd', accent: '#e1f5fe' },
  caseFile: { color: '#263238', accent: '#ff9e80' },
  riot: { color: '#c2185b', accent: '#fff59d' },
  ice: { color: '#0d47a1', accent: '#e3f2fd' },
};

type Seed = [id: string, title: string, artistId: string, albumId: string, path: string, duration: number, genres: string[], lyrics: string, explicit?: boolean];

const SEEDS: Seed[] = [
  // CrocByte Beats
  ['t-snap-back', 'Snap Back', 'crocbyte-beats', '68o70uKuUqEPwfFyWw4NxY', '0/08/Audionautix-com-ccby-hiphop1.mp3', 148, ['hip-hop'], 'Yeah, CrocByte on the beat / Snap back, we never fold / Green lights on the dashboard glow / Tape hiss like a summer storm / Count it in, one two, let it roll / Heads nod slow across the floor / Snap back, we came for more / Lights out, the city sings along', true],
  ['t-dat-groove', 'Dat Groove', 'crocbyte-beats', 'al-crocbyte-tape', '9/9a/Audionautix-com-ccby-datgroovefulltrack.mp3', 130, ['hip-hop', 'rnb'], 'Catch the groove before it leaves / Bassline walking down the street / Hands up high, the speakers breathe / Every step lands on the beat / Pocket full of midnight dreams / Nothing here is what it seems / Catch the groove, do not let go / Ride it all the way back home'],
  ['t-crushin', 'Crushin', 'crocbyte-beats', 'al-crocbyte-tape', '9/95/Audionautix-com-ccby-crushin.mp3', 255, ['hip-hop', 'rnb'], 'I keep on crushin on the way you move / Window down, playing something smooth / City lights in a purple hue / Every song reminds me of you / Turn it up, let the bass come through / Nothing old, everything new / Late night drive with the radio on / Crushin till the break of dawn / One more verse then we fade away / Same old feeling every day'],
  ['t-ice-cold', 'Ice Cold', 'crocbyte-beats', 'al-ice-cold', '5/5d/Audionautix-com-ccby-icecold.mp3', 162, ['hip-hop'], 'Ice cold, breath fog in the air / Snare crack echo everywhere / Frozen chain on a winter night / Keep it cool, keep it tight / Ice cold, never break a sweat / Best verse you have not heard yet / Freeze frame, now rewind / Ice cold, one of a kind', true],
  // SynthWave Collective
  ['t-alien-sunset', 'Alien Sunset', 'orbit-kids', 'al-low-orbit', '8/80/Audionautix-com-ccby-aliensunset.mp3', 116, ['synthwave', 'gaming'], 'Two suns sinking in the sky / Chrome reflections passing by / Engines hum a violet tune / Racing shadows of the moon / Alien sunset, burning bright / Drive with me into the night / Static whispers on the line / Every signal feels like mine'],
  ['t-view-from-earth', 'A View From Earth', 'orbit-kids', 'al-low-orbit', '0/0d/Audionautix-com-ccby-aviewfromearth.mp3', 307, ['synthwave'], 'Looking up from a quiet hill / All the stars are standing still / Satellites like fireflies / Drawing lines across the skies / Somewhere far a signal calls / Echoes bouncing off the walls / A view from earth, so small, so wide / Galaxies on either side / Hold my hand and count to ten / We will see this sky again / Floating home on silver light / Earth is glowing blue tonight'],
  ['t-dance-dubber', 'Dance Dubber', 'synthwave-collective', 'al-neon-nights', 'e/e1/Audionautix-com-ccby-dancedubber.mp3', 99, ['synthwave', 'pop'], 'Drop the needle, lift the floor / Dubbed out rhythm, give me more / Neon footsteps on the tile / Dance with me a little while / Echo, echo, fading slow / Strobe lights put on quite a show / Dance dubber, never stop / Spin it up and let it drop'],
  ['t-inner-journey', 'Inner Journey', 'synthwave-collective', 'al-neon-nights', '8/8a/Audionautix-com-ccby-innerjourney.mp3', 203, ['synthwave', 'lo-fi-coding'], 'Close your eyes and breathe it in / Let the inner journey begin / Waves of light behind your eyes / Colors that you recognize / Drifting deeper, sinking slow / Further than you thought you would go / Every thought a passing star / Coming back to where you are / Open up, the morning calls / Light is pouring down the walls'],
  // Lo-Fi Dreamers
  ['t-pensive-piano', 'Pensive Piano', 'lofi-dreamers', 'al-late-night-loops', 'f/f5/Audionautix-com-ccby-pensivepiano.mp3', 65, ['lo-fi-coding'], 'Rain against the window pane / Coffee cooling once again / Cursor blinking, thoughts in line / One more bug and we are fine / Pensive keys in minor tone / Never really feel alone'],
  ['t-lightning-bugs', 'Lightning Bugs', 'lofi-dreamers', 'al-late-night-loops', 'c/c0/Audionautix-com-ccby-lightningbugs.mp3', 95, ['lo-fi-coding'], 'Summer porch and fading light / Lightning bugs come out at night / Little lanterns in the grass / Watching all the hours pass / Jar of stars upon the sill / Holding time completely still / Grandma humming in the hall / Softest song of all'],
  ['t-time-passing-by', 'Time Passing By', 'lofi-dreamers', 'al-late-night-loops', '0/0d/Audionautix-com-ccby-timepassingby.mp3', 248, ['lo-fi-coding', 'rnb'], 'Tick tock on the kitchen wall / Afternoon begins to fall / Pages turning in the breeze / Shadows stretching through the trees / Time is passing, let it go / Some things only time can show / Hold the moment, let it stay / Tomorrow is another day / Write it down before it fades / Every memory we made / Time is passing, so are we / Floating gently out to sea'],
  ['t-river-meditation', 'River Meditation', 'deep-blue-drift', 'al-tidepool', '3/3b/Audionautix-com-ccby-rivermeditation.mp3', 167, ['lo-fi-coding'], 'Water running over stone / Find a place to call your own / Breathe in slowly, breathe out long / Let the river be your song / Every ripple, every bend / Leads you back to you again / Moss and pebbles, cool and clear / Nothing else you need right here'],
  ['t-ocean-floor', 'Ocean Floor', 'deep-blue-drift', 'al-tidepool', 'c/c9/Audionautix-com-ccby-oceanfloor.mp3', 228, ['lo-fi-coding', 'synthwave'], 'Sinking down to the ocean floor / Quiet like never before / Blue on blue on deeper blue / Sunlight barely breaking through / Whales are singing far away / Night is longer than the day / Bubbles rising to the sky / Watch the little fishes fly / Stay a while and drift with me / Down here in the silent sea'],
  // Cyberpunk Orchestra
  ['t-marauder', 'Marauder', 'cyberpunk-orchestra', 'al-circuit-symphony', '5/50/Audionautix-com-ccby-marauder.mp3', 246, ['gaming', 'rock'], 'Sirens wailing through the rain / Neon bleeding on the drain / Marauder running rooftop high / Searchlights sweeping through the sky / Brass is roaring, strings collide / Nowhere left for you to hide / Systems failing, alarms ring / Hear the circuit city sing / Final level, final boss / Count the winnings, count the loss / Marauder, gone without a trace / Vanished into cyberspace'],
  ['t-line-of-fire', 'Line Of Fire', 'cyberpunk-orchestra', 'al-circuit-symphony', 'd/d2/Audionautix-com-ccby-lineoffire.mp3', 69, ['gaming', 'rock'], 'Step into the line of fire / Climbing ever, climbing higher / Drums of war and chrome and steel / Tell me now the threat is real / Hold the line and do not run / This fight is not done'],
  ['t-great-unknown', 'The Great Unknown', 'heist-protocol', 'al-cold-case', 'a/a3/Audionautix-com-ccby-thegreatunknown.mp3', 154, ['gaming'], 'Maps run out beyond this gate / Nothing left but fate / Into the great unknown we go / Where the strange winds blow / Every step a new design / Every star a warning sign / Hold the torch and lead the way / Night will turn to day'],
  ['t-dark-mystery', 'Dark Mystery', 'heist-protocol', 'al-cold-case', 'a/a2/Audionautix-com-ccby-darkmystery.mp3', 131, ['gaming'], 'Footsteps in an empty hall / Shadows climbing up the wall / Clues are scattered on the floor / Someone knocking at the door / Dark mystery, who goes there / Whispers floating in the air / Solve the puzzle, find the key / Set the secret free'],
  // Midnight Jazz
  ['t-smooth-jazz-night', 'Smooth Jazz Night', 'midnight-jazz', 'al-blue-hour', '3/39/Audionautix-com-ccby-smoothjazznight.mp3', 110, ['rnb'], 'Candle low on the corner stage / Saxophone turns another page / Glasses clink and voices hush / No one here is in a rush / Smooth jazz night, the city sleeps / Every note is ours to keep / Brush on snare like falling rain / Play that melody again'],
  ['t-closer-to-jazz', 'Closer To Jazz', 'midnight-jazz', 'al-blue-hour', 'b/bd/Audionautix-com-ccby-closertojazz.mp3', 143, ['rnb', 'lo-fi-coding'], 'Come a little closer now / Let the music show you how / Walking bass and gentle keys / Swaying softly in the breeze / Closer to jazz, closer to you / Midnight colors, velvet blue / Hum it low and hum it sweet / Tapping time with dancing feet'],
  ['t-bebop-25', 'Bebop 25', 'midnight-jazz', 'al-blue-hour', 'b/b5/Audionautix-com-ccby-bebop25.mp3', 142, ['rnb'], 'Fingers flying, quick and bright / Bebop runs all through the night / Twenty five and counting more / Trumpet shaking every floor / Change the key and change the time / Every bar a brand new rhyme / Take a solo, take a bow / Bebop is happening now'],
  ['t-standard-jazz-bars', 'Standard Jazz Bars', 'midnight-jazz', 'al-blue-hour', '4/43/Audionautix-com-ccby-standardjazzbars.mp3', 182, ['rnb'], 'Twelve bars of the blues tonight / Dimmed down to amber light / Old standard, brand new feel / Every chord is something real / Pianist nods to the bass / Smile spreading on his face / Last call, but play one more / Standard jazz forevermore'],
  // Future Bass Lab
  ['t-summer-heat', 'Summer Heat', 'future-bass-lab', 'al-drop-zone', 'b/b3/Audionautix-com-ccby-summerheat.mp3', 65, ['pop'], 'Sun is burning on the sand / Summer heat in every hand / Turn it up and feel the drop / Never want this song to stop / Waves are crashing, hearts are too / Summer heat, me and you'],
  ['t-feels-good', 'Feels Good', 'future-bass-lab', 'al-drop-zone', 'c/cf/Audionautix-com-ccby-feelsgood2b.mp3', 171, ['pop', 'rock'], 'Woke up and it feels so good / Everything is like it should / Sunshine pouring through the blinds / Leave the worries all behind / Feels good, feels right / Feels like we could dance all night / Raise your hands up to the sky / Let the good times multiply'],
  ['t-pop-metal', 'Pop Metal', 'radio-riot', 'al-static-fades', '7/75/Audionautix-com-ccby-popmetal.mp3', 127, ['rock', 'pop', 'gaming'], 'Guitars loud and colors bright / Pop and metal in one night / Scream the chorus, jump the stage / Turn the volume, turn the page / Heavy hearts and candy hooks / Rewrite all the music books / Pop metal, here we go / Steal the show'],
  ['t-radio-rock', 'Radio Rock', 'radio-riot', 'al-static-fades', '1/19/Audionautix-com-ccby-radiorock.mp3', 177, ['rock', 'pop'], 'Turn the dial to the left / Find the station that is best / Radio rock on the open road / Drop the window, lighten the load / Every chorus singing loud / Lost inside a happy crowd / Static fades and then it plays / Soundtrack to our summer days'],
];

const ALBUM_COVER: Record<string, { color: string; accent: string }> = {
  '68o70uKuUqEPwfFyWw4NxY': C.single,
  'al-crocbyte-tape': C.tape,
  'al-neon-nights': C.neon,
  'al-late-night-loops': C.loops,
  'al-circuit-symphony': C.circuit,
  'al-blue-hour': C.blue,
  'al-drop-zone': C.drop,
  'al-low-orbit': C.orbit,
  'al-tidepool': C.tide,
  'al-cold-case': C.caseFile,
  'al-static-fades': C.riot,
  'al-ice-cold': C.ice,
};

export const ALBUMS: AlbumItem[] = [
  { id: '68o70uKuUqEPwfFyWw4NxY', title: 'Snap Back', artistId: 'crocbyte-beats', year: 2026, releaseDate: 'November 4, 2026', type: 'Single', cover: C.single, trackIds: [], copyright: '2026 CrocByte Records' },
  { id: 'al-crocbyte-tape', title: 'Swamp Tape Vol. 1', artistId: 'crocbyte-beats', year: 2025, releaseDate: 'June 13, 2025', type: 'EP', cover: C.tape, trackIds: [], copyright: '2025 CrocByte Records' },
  { id: 'al-ice-cold', title: 'Ice Cold', artistId: 'crocbyte-beats', year: 2025, releaseDate: 'December 5, 2025', type: 'Single', cover: C.ice, trackIds: [], copyright: '2025 CrocByte Records' },
  { id: 'al-neon-nights', title: 'Neon Nights', artistId: 'synthwave-collective', year: 2025, releaseDate: 'March 21, 2025', type: 'Album', cover: C.neon, trackIds: [], copyright: '2025 Chrome Tape Music' },
  { id: 'al-late-night-loops', title: 'Late Night Loops', artistId: 'lofi-dreamers', year: 2024, releaseDate: 'October 2, 2024', type: 'Album', cover: C.loops, trackIds: [], copyright: '2024 Dreamstate Audio' },
  { id: 'al-circuit-symphony', title: 'Circuit Symphony', artistId: 'cyberpunk-orchestra', year: 2025, releaseDate: 'August 8, 2025', type: 'Album', cover: C.circuit, trackIds: [], copyright: '2025 Gridlock Sound' },
  { id: 'al-blue-hour', title: 'Blue Hour Sessions', artistId: 'midnight-jazz', year: 2023, releaseDate: 'January 27, 2023', type: 'Album', cover: C.blue, trackIds: [], copyright: '2023 Velvet Room Records' },
  { id: 'al-drop-zone', title: 'Drop Zone', artistId: 'future-bass-lab', year: 2026, releaseDate: 'May 1, 2026', type: 'Album', cover: C.drop, trackIds: [], copyright: '2026 Lab Rat Music' },
  { id: 'al-low-orbit', title: 'Low Orbit', artistId: 'orbit-kids', year: 2025, releaseDate: 'September 12, 2025', type: 'EP', cover: C.orbit, trackIds: [], copyright: '2025 Liftoff Tapes' },
  { id: 'al-tidepool', title: 'Tidepool', artistId: 'deep-blue-drift', year: 2024, releaseDate: 'July 19, 2024', type: 'EP', cover: C.tide, trackIds: [], copyright: '2024 Shoreline Audio' },
  { id: 'al-cold-case', title: 'Cold Case', artistId: 'heist-protocol', year: 2026, releaseDate: 'February 6, 2026', type: 'EP', cover: C.caseFile, trackIds: [], copyright: '2026 Vault Nine Music' },
  { id: 'al-static-fades', title: 'Static Fades', artistId: 'radio-riot', year: 2026, releaseDate: 'April 17, 2026', type: 'EP', cover: C.riot, trackIds: [], copyright: '2026 Loud Garage Records' },
];

const artistName = (id: string) => ARTISTS.find((a) => a.id === id)?.name ?? 'Unknown';

export const TRACKS: TrackItem[] = SEEDS.map(([id, title, artistId, albumId, path, duration, genres, lyrics, explicit], i) => {
  const album = ALBUMS.find((a) => a.id === albumId)!;
  album.trackIds.push(id);
  return {
    id,
    title,
    artistId,
    artistName: artistName(artistId),
    albumId,
    albumName: album.title,
    duration,
    src: WM + path,
    cover: ALBUM_COVER[albumId],
    explicit,
    genres,
    lyrics: lyr(duration, lyrics),
    addedAt: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
    source: 'catalog',
    // the jazz album is a double: last two cuts sit on disc 2
    disc: albumId === 'al-blue-hour' && album.trackIds.length > 2 ? 2 : 1,
  };
});

export const PLAYLISTS: PlaylistItem[] = [
  { id: 'daily-mix-1', name: 'Daily Mix 1', description: 'CrocByte Beats, Midnight Jazz, Lo-Fi Dreamers and more', owner: 'Sonora', cover: { color: '#e91e63', accent: '#ffd180' }, trackIds: ['t-snap-back', 't-closer-to-jazz', 't-time-passing-by', 't-dat-groove', 't-smooth-jazz-night', 't-river-meditation'] },
  { id: 'lofi-coding-flow', name: 'Lo-Fi Coding Flow', description: 'Beats to debug, refactor and ship to.', owner: 'Sonora', cover: { color: '#6d4c41', accent: '#b2dfdb' }, trackIds: ['t-pensive-piano', 't-lightning-bugs', 't-river-meditation', 't-ocean-floor', 't-inner-journey', 't-closer-to-jazz'] },
  { id: 'neon-drive', name: 'Neon Drive', description: 'Retro synths for a midnight highway.', owner: 'Sonora', cover: { color: '#6a1b9a', accent: '#18ffff' }, trackIds: ['t-alien-sunset', 't-dance-dubber', 't-view-from-earth', 't-inner-journey', 't-marauder'] },
  { id: 'top-beats', name: "Today's Top Beats", description: 'The hottest tracks on Sonora right now.', owner: 'Sonora', cover: { color: '#1e88e5', accent: '#ffeb3b' }, trackIds: ['t-snap-back', 't-summer-heat', 't-feels-good', 't-crushin', 't-alien-sunset', 't-pop-metal', 't-radio-rock'] },
  { id: 'late-night-jazz', name: 'Late Night Jazz', description: 'Smoky standards for the small hours.', owner: 'Sonora', cover: { color: '#303f9f', accent: '#ffb74d' }, trackIds: ['t-smooth-jazz-night', 't-closer-to-jazz', 't-bebop-25', 't-standard-jazz-bars'] },
  { id: 'boss-battle', name: 'Boss Battle', description: 'Epic, loud and fast. For gaming marathons.', owner: 'Sonora', cover: { color: '#d32f2f', accent: '#212121' }, trackIds: ['t-line-of-fire', 't-marauder', 't-great-unknown', 't-dark-mystery', 't-pop-metal'] },
];

export const GENRES: GenreItem[] = [
  { slug: 'pop', name: 'Pop', color: '#e8115b', accent: '#ffd54f' },
  { slug: 'hip-hop', name: 'Hip-Hop', color: '#ba5d07', accent: '#1b5e20' },
  { slug: 'lo-fi-coding', name: 'Lo-Fi & Coding', color: '#477d95', accent: '#ffe0b2' },
  { slug: 'synthwave', name: 'Synthwave', color: '#8d67ab', accent: '#ff4081' },
  { slug: 'rock', name: 'Rock', color: '#e91429', accent: '#212121' },
  { slug: 'rnb', name: 'R&B', color: '#dc148c', accent: '#283593' },
  { slug: 'gaming', name: 'Gaming', color: '#e8115b', accent: '#00e5ff' },
  { slug: 'podcasts', name: 'Podcasts', color: '#006450', accent: '#c6ff00' },
];

/** The podcast hub keeps the address the original site uses. */
export const PODCAST_HUB: GenreItem = { slug: 'podcasts-web', name: 'Podcasts', color: '#27856a', accent: '#c6ff00' };

export const PODCAST_CATEGORIES: { name: string; color: string; accent: string; href: string }[] = [
  { name: 'Educational', color: '#477d95', accent: '#e91e63', href: '/genre/lo-fi-coding' },
  { name: 'Documentary', color: '#503750', accent: '#eeeeee', href: '/genre/gaming' },
  { name: 'Comedy', color: '#af2896', accent: '#ff9800', href: '/genre/pop' },
  { name: 'Pop Culture', color: '#dc148c', accent: '#ffb300', href: '/genre/pop' },
  { name: 'Fitness & Nutrition', color: '#27856a', accent: '#27856a', href: '/genre/rock' },
  { name: 'Celebrities', color: '#777777', accent: '#ffd54f', href: '/genre/rnb' },
  { name: 'True Crime', color: '#8d67ab', accent: '#212121', href: '/genre/synthwave' },
  { name: 'Music Stories', color: '#e1118c', accent: '#80deea', href: '/genre/hip-hop' },
  { name: 'Tech Talk', color: '#1e3264', accent: '#69f0ae', href: '/genre/lo-fi-coding' },
];

/** shortcut: a static export can only serve pre-built pages, so custom playlists use these reserved ids; raise the count if people need more. */
export const CUSTOM_SLOTS = Array.from({ length: 24 }, (_, i) => `custom-${i + 1}`);

export const TRENDING_SECTION_ID = '0JQ5DB5E8N831KzFzsBBQ2';

export const SECTIONS: { id: string; title: string; kind: 'tracks' | 'artists' | 'albums' | 'playlists' }[] = [
  { id: TRENDING_SECTION_ID, title: 'Trending songs', kind: 'tracks' },
  { id: 'popular-artists', title: 'Popular artists', kind: 'artists' },
  { id: 'popular-albums', title: 'Popular albums and singles', kind: 'albums' },
  { id: 'made-for-you', title: 'Made For You', kind: 'playlists' },
];

export const EQ_BANDS = [60, 230, 910, 3600, 14000] as const;
export const EQ_LABELS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'] as const;
export const EQ_PRESETS: EqPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [8, 5, 0, 0, 1] },
  { name: 'Electronic', gains: [5, 2, -2, 3, 6] },
  { name: 'Vocal', gains: [-3, -1, 4, 5, 2] },
  { name: 'Acoustic', gains: [4, 2, 1, 3, 3] },
];

export const getTrack = (id: string) => TRACKS.find((t) => t.id === id);
export const getAlbum = (id: string) => ALBUMS.find((a) => a.id === id);
export const getArtist = (id: string) => ARTISTS.find((a) => a.id === id);
export const getPlaylist = (id: string) => PLAYLISTS.find((p) => p.id === id);
export const genreBySlug = (slug: string) => (slug === PODCAST_HUB.slug ? PODCAST_HUB : GENRES.find((g) => g.slug === slug));

/** Fallback streams used when an imported link cannot be resolved to audio. */
export const FALLBACK_STREAMS = TRACKS.map((t) => t.src);

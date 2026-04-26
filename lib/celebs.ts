export type Celeb = {
  id: string
  name: string
  vibe: string
  tags: string[]
  image: string
}

export const CELEBS: Celeb[] = [
  {
    id: "taylor",
    name: "Taylor Swift",
    vibe: "All-American Pop Royalty",
    tags: ["blonde wavy hair", "fair skin", "red lipstick", "pop princess energy", "blue eyes"],
    image: "/celebs/taylor.jpg",
  },
  {
    id: "beyonce",
    name: "Beyoncé",
    vibe: "Untouchable Icon Energy",
    tags: ["honey blonde curls", "warm glowing skin", "regal aura", "fierce confidence", "diva queen"],
    image: "/celebs/beyonce.jpg",
  },
  {
    id: "zendaya",
    name: "Zendaya",
    vibe: "Effortless It-Girl",
    tags: ["curly auburn hair", "freckles", "elegant minimalist", "soft features", "editorial face"],
    image: "/celebs/zendaya.jpg",
  },
  {
    id: "timothee",
    name: "Timothée Chalamet",
    vibe: "Indie Heartthrob",
    tags: ["dark curly hair", "sharp cheekbones", "moody artsy vibe", "soft features", "delicate jawline"],
    image: "/celebs/timothee.jpg",
  },
  {
    id: "rihanna",
    name: "Rihanna",
    vibe: "Bad Gal Boss",
    tags: ["sleek dark hair", "smoky eyes", "bold red lips", "edgy glam", "warm olive skin"],
    image: "/celebs/rihanna.jpg",
  },
  {
    id: "gaga",
    name: "Lady Gaga",
    vibe: "Avant Garde Art Pop",
    tags: ["platinum blonde", "bold dark eye makeup", "intense gaze", "theatrical glam", "high drama"],
    image: "/celebs/gaga.jpg",
  },
  {
    id: "drake",
    name: "Drake",
    vibe: "Brooding Hitmaker",
    tags: ["short dark beard", "warm brown skin", "contemplative", "luxe casual", "soft eyes"],
    image: "/celebs/drake.jpg",
  },
  {
    id: "kendrick",
    name: "Kendrick Lamar",
    vibe: "Cerebral Lyricist",
    tags: ["braided hair", "intense focused gaze", "minimalist style", "warm brown skin", "artistic depth"],
    image: "/celebs/kendrick.jpg",
  },
  {
    id: "margot",
    name: "Margot Robbie",
    vibe: "Hollywood Bombshell",
    tags: ["platinum blonde wavy", "bright smile", "blue eyes", "fair skin", "classic glam"],
    image: "/celebs/margot.jpg",
  },
  {
    id: "florence",
    name: "Florence Pugh",
    vibe: "Indie Power Player",
    tags: ["platinum buzz cut", "soft features", "fierce gaze", "fair skin", "avant garde fashion"],
    image: "/celebs/florence.jpg",
  },
]

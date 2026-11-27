window.CONFIG = {
  images: [
    "images/spiderman.jpg",
    "images/sonic-movie.jpg",
    "images/sonic-tails.jpg",
    "images/bluey.jpg",
    "images/ice-age.jpg",
  ],
  memoryImages: [
    "images/memory/01.png","images/memory/02.png","images/memory/03.png","images/memory/04.png",
    "images/memory/05.png","images/memory/06.png","images/memory/07.png","images/memory/08.png",
    "images/memory/09.png","images/memory/10.png","images/memory/11.png","images/memory/12.png",
    "images/memory/13.png","images/memory/14.png","images/memory/15.png","images/memory/16.png",
    "images/memory/17.png","images/memory/18.png","images/memory/19.png","images/memory/20.png"
  ],
  maxMemoryCards: 40,
  minMemoryCard: 110,
  minPuzzlePiece: 105,
  maxPuzzlePieces: 24,
  storySteps: 20,
  maxHearts: 5,
  bonusEvery: 5,

  mainStoryPlayers: [
    { id: "shai",  name: "שי",    src: "family/shai.mp4",  icon: "🕷️" },
    { id: "emma",  name: "אמה",   src: "family/emma.mp4",  icon: "💖" },
    { id: "ariel", name: "אריאל", src: "family/ariel.mp4", icon: "⚡" },
    { id: "tia",   name: "טיה",   src: "family/tia.mp4",   icon: "🌟" },
    { id: "ari",   name: "ארי",   src: "family/ari.mp4",   icon: "🦁" },
    { id: "ilan",  name: "אילן",  src: "family/ilan.mp4",  icon: "🚀" },
    { id: "itay",  name: "איתי",  src: "family/itay.mp4",  icon: "🥁" },
    { id: "atai",  name: "עתי",   src: "family/atai.mp4",  icon: "🦸" }
  ],

  mainStoryArt: {
    intro: [
      { img: "images/story/01_castle.jpg", text: "בלילה סוער, מעל הטירה האפלה של מיקונוס הרשע, הבזיקו ברקים ורעמים..." },
      { img: "images/story/03_idea.jpg",   text: "במעבדה הסודית הבריק במוחו של מיקונוס רעיון מרושע חדש!" },
      { img: "images/story/04_plan.jpg",   text: "הוא זמם לתפוס ולכלוא את כל החיות החמודות!" },
      { img: "images/story/05_run.jpg",    text: "מיקונוס רץ החוצה מהטירה עם רשת וכלוב..." },
      { img: "images/story/06_catch.jpg",  text: "הוא לכד גור כלבים חמוד ועצוב..." },
      { img: "images/story/07_cage.jpg",   text: "ונעל את הגור המסכן בתוך כלוב במעבדה!" },
      { img: "images/story/08_laugh.jpg",  text: "מיקונוס צחק צחוק מרושע מול הברקים והרעמים!" }
    ],
    heroHill:  "images/story/09_hill.jpg",
    winCry:    "images/story/win_cry.jpg",
    loseLaugh: "images/story/lose_laugh.jpg",

    stages: [
      {
        id: 1,
        animalName: "גור הכלבים",
        animalEmoji: "🐶",
        foeImg: "images/story/07_cage.jpg",
        winHillImg: "images/story/win_puppy.jpg",
        winBubble: "הצלנו את גור הכלבים! כל הכבוד גיבורים! 🐶❤️",
        transitionIntro: null
      },
      {
        id: 2,
        animalName: "הקיפוד החמוד",
        animalEmoji: "🦔",
        foeImg: "images/story/stage2_hedgehog_cage.jpg",
        winHillImg: "images/story/stage2_win_hedgehog.jpg",
        winBubble: "הצלנו את הקיפוד החמוד! איזה אלופים! 🦔❤️",
        transitionIntro: [
          { img: "images/story/05_run.jpg", text: "מיקונוס לא מוותר! הוא רץ החוצה מהטירה לצוד שוב..." },
          { img: "images/story/stage2_hedgehog_cage.jpg", text: "והפעם הוא כלא קיפוד קטן וחמוד בתוך כלוב במעבדה! 🦔" }
        ]
      },
      {
        id: 3,
        animalName: "הפינגווין החמוד",
        animalEmoji: "🐧",
        foeImg: "images/story/stage3_penguin_cage.jpg",
        winHillImg: "images/story/stage3_win_all.png",
        winBubble: "כל החיות ניצלו! כל הכבוד לגיבורים! 🐶🦔🐧🏆",
        transitionIntro: [
          { img: "images/story/05_run.jpg", text: "מיקונוס הרשע יוצא לצוד פעם נוספת..." },
          { img: "images/story/stage3_penguin_cage.jpg", text: "עכשיו הוא נעל פינגווין קטן וחמוד בכלוב! בואו נציל גם אותו! 🐧" }
        ]
      }
    ]
  },

familyHeroes: [
  { id: "ari",   name: "ארי",   icon: "🦁", title: "גיבור על", type: "video", src: "family/ari.mp4" },
  { id: "ariel", name: "אריאל", icon: "⚡", title: "גיבור על", type: "video", src: "family/ariel.mp4" },
  { id: "emma",  name: "אמה",   icon: "🌟", title: "גיבורת על", type: "video", src: "family/emma.mp4" },
  { id: "ilan",  name: "אילן",  icon: "🔥", title: "גיבור על", type: "video", src: "family/ilan.mp4" },
  { id: "shai",  name: "שי",    icon: "🚀", title: "גיבור על", type: "video", src: "family/shai.mp4" },
  { id: "tia",   name: "טיה",   icon: "💫", title: "גיבורת על", type: "video", src: "family/tia.mp4" },
  { id: "atai",  name: "עתי",   icon: "🦸", title: "גיבור על", type: "video", src: "family/atai.mp4" }
],

  heroes: [
    { name: "הגיבור האדום", img: null, kind: "red" },
    { name: "גיבור הלילה",  img: null, kind: "night" },
    { name: "איש הקוביות",  img: null, kind: "blocks" }
  ],

  villain: { name: "איש החול", img: null }
};

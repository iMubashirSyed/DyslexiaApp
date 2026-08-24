const fs = require('fs');

const raw = `
cat dog bird fish frog duck bear lion wolf deer goat sheep horse mouse snake tiger zebra whale shark eagle owl crow swan crab ant bee bug cow pig hen pup kit cub foal lamb calf pony mule toad newt bat rat hare fox elk mink seal clam moth wasp gnat lark wren dove kite finch
sun moon star sky cloud rain snow wind storm leaf tree grass flower rose seed soil rock sand dirt hill lake river ocean wave beach stone fire flame smoke ash ice frost fog mist dew pond creek brook field meadow forest wood path road trail cliff cave peak valley island shore bay reef coral moss fern vine bark root stem bloom petal thorn bush pine oak elm maple birch
eye ear nose mouth lip chin cheek face head hair neck arm hand finger thumb leg foot toe knee elbow wrist back chest heart bone skin blood brain tooth teeth tongue nail palm heel ankle hip rib lung throat shoulder
apple banana grape lemon melon peach pear plum berry mango orange cherry bread toast cake cookie pie pizza pasta rice soup salad cheese butter milk cream yogurt egg meat beef pork chicken shrimp bean corn pea carrot onion potato tomato pepper garlic salt sugar honey jam syrup juice water tea coffee soda snack fruit food meal lunch dinner breakfast candy chocolate
home house room door window wall floor roof bed sofa chair table desk lamp light clock phone book pen pencil paper bag box cup plate bowl fork spoon knife pan pot oven sink bath shower toilet mirror towel soap brush comb shirt pants dress skirt coat hat shoe sock boot glove scarf belt button zipper pocket key lock map ball toy game doll block bike car bus truck train plane boat ship van taxi rail street city town farm park shop store school class chalk crayon marker glue tape ruler eraser notebook backpack
red blue green yellow purple pink brown black white gray gold silver big small large tiny tall short long wide thin thick fat heavy soft hard smooth rough hot cold warm cool wet dry clean dirty new old young fast slow quick loud quiet bright dark happy sad angry scared brave kind nice mean good bad best worst true false right wrong open closed full empty rich poor free busy tired sick well safe danger pretty ugly smart silly funny calm wild strong weak early late first last next same other many few more less most least all none some any each both only
run walk jump skip hop sit stand lie sleep wake eat drink cook bake wash clean sweep mop dust fold hang cut chop mix pour stir push pull lift carry throw catch kick hit bounce roll spin turn twist bend reach touch feel hold drop pick find lose hide seek look see watch stare hear listen smell taste speak talk say tell ask answer call yell sing hum read write draw paint color trace erase count add spell learn teach study think know guess remember forget hope wish want need like love hate help hurt fix break build make create start stop begin end finish wait hurry go come leave stay arrive enter exit move live die grow change become seem appear happen play work rest try use give take bring send get put set keep let have being
word letter sound name number shape circle square line dot point side corner angle page story poem song music note beat drum flute piano guitar dance party gift card photo movie show score win lose tie team rule chance prize fun joy peace dream idea plan goal task job time day week month year hour minute second morning night noon evening today tomorrow yesterday now then soon later always never often sometimes again once twice space place thing part piece whole group pair list order sort match copy test quiz mark grade level step stage round
mom dad mother father parent baby child boy girl kid son daughter brother sister uncle aunt cousin friend neighbor teacher student doctor nurse driver farmer baker pilot sailor soldier police firefighter artist singer dancer writer reader player worker owner guest host king queen prince princess hero villain wizard witch fairy giant dragon knight pirate robot alien monster ghost angel person people man woman adult teen crowd family
mall market bank library museum zoo circus theater cinema hotel motel tent cabin castle bridge tower tunnel garage barn shed yard garden porch patio fence gate sidewalk crosswalk airport station harbor port factory office hospital clinic church temple mosque gym pool stadium arena court track playground classroom hallway closet attic basement kitchen bedroom bathroom
jacket sweater hoodie jeans shorts blouse suit uniform pajamas sandals slippers sneakers heels cap beanie helmet mask glasses watch ring necklace bracelet earring wallet purse suitcase umbrella
spring summer autumn fall winter season weather thunder lightning rainbow sunny cloudy rainy snowy windy stormy freezing boiling drizzle hail sleet breeze gust tornado flood drought sunrise sunset dawn dusk midnight
feeling emotion smile laugh cry tears frown grin hug kiss wave nod shake share care worry fear anger pride shame guilt trust doubt respect polite rude honest truth secret promise apology thanks please sorry excuse welcome hello goodbye okay maybe sure
hammer nail screw bolt wrench pliers saw drill axe shovel rake hoe broom bucket ladder rope wire chain magnet battery plug switch knob hinge wheel axle gear spring lever pulley engine motor pump fan heater cooler fridge freezer washer dryer vacuum iron toaster blender mixer kettle teapot mug glass jar bottle can carton package parcel envelope stamp postcard calendar diary journal album poster sticker label tag ticket receipt coin bill cash money price cost sale deal tax tip change
computer laptop tablet screen keyboard click type print scan file folder email message text chat video audio camera picture image icon app website internet wifi password login download upload save delete edit undo search filter zoom focus flash charge cable usb bluetooth speaker headphone earbud microphone projector
adventure quest treasure compass jungle desert mountain volcano crystal magic spell potion sword shield armor dungeon unicorn phoenix griffin mermaid centaur goblin troll ogre dwarf sorcerer archer ranger thief rogue bard cleric paladin warrior heroine beast creature spirit skeleton zombie vampire werewolf pixie sprite nymph genie djinn oracle prophet legend myth fable tale saga epic
about above across after again against almost alone along already also although among another anyone anything anywhere around because before behind below beside between beyond during either enough every everyone everything everywhere except finally following forward further however instead itself myself nearby neither nothing nowhere outside perhaps probably rather really several should someone something somewhere still suddenly therefore though through toward under until upon usually whatever whenever whether while within without would could might shall ought having doing going coming looking trying working playing reading writing drawing painting singing dancing running walking jumping swimming flying driving riding cooking cleaning helping learning teaching thinking feeling believing remembering forgetting beginning ending winning losing sharing caring hoping wishing dreaming smiling laughing crying listening watching waiting moving changing growing building creating fixing breaking opening closing starting stopping finishing practicing studying spelling tracing matching sorting counting adding
simple complex easy hard harder hardest easier easiest better worse greater smaller higher lower closer farther nearest farthest inside subtract multiply divide equal total half quarter double triple single apple butter cheese dinner morning evening animal elephant giraffe monkey rabbit turtle squirrel hamster parrot penguin dolphin octopus giraffe tomato potato banana orange yellow purple
practice exercise lesson chapter chapter subject language spelling writing reading math science history geography music art sports soccer baseball basketball tennis volleyball skating skiing surfing climbing hiking camping fishing hunting gardening shopping traveling visiting exploring discovering inventing designing coding programming solving puzzling
family friends parents children teachers students animals flowers gardens forests oceans rivers mountains valleys islands beaches clouds storms seasons holidays birthdays presents parties balloons candles cakes cookies sandwiches hamburgers french toast pancakes waffles muffins cupcakes brownies
dragon castle princess knight wizard treasure adventure forest mountain river ocean rainbow unicorn fairy magic crystal sword shield armor castle dungeon
`.trim().split(/\s+/);

const unique = [...new Set(
  raw
    .map(w => w.trim().toLowerCase().replace(/[^a-z]/g, ''))
    .filter(w => w.length >= 3 && w.length <= 8),
)].sort();

const content = `/**
 * Local word dictionary for Letter Trace.
 * ${unique.length} common English words (3–8 letters), letters A–Z only.
 * No network required.
 */
export const TRACE_WORDS: readonly string[] = Object.freeze([
${unique.map(w => `  '${w}',`).join('\n')}
]);

export type TraceDifficulty = 'easy' | 'medium' | 'hard' | 'any';

const LEN: Record<Exclude<TraceDifficulty, 'any'>, [number, number]> = {
  easy: [3, 4],
  medium: [5, 5],
  hard: [6, 8],
};

export function wordsForDifficulty(level: TraceDifficulty): string[] {
  if (level === 'any') {
    return [...TRACE_WORDS];
  }
  const [min, max] = LEN[level];
  return TRACE_WORDS.filter(w => w.length >= min && w.length <= max);
}

export function pickRandomWord(
  level: TraceDifficulty = 'any',
  avoid?: string,
): string {
  const pool = wordsForDifficulty(level).filter(w => w !== avoid);
  const list = pool.length ? pool : wordsForDifficulty(level);
  return list[Math.floor(Math.random() * list.length)] ?? 'cat';
}

export const TRACE_WORD_COUNT = TRACE_WORDS.length;
`;

fs.writeFileSync(
  'D:/UMAIR_WORK/Umair_Fyp/FYP/Frontend/dyslexia/src/data/traceWordDictionary.ts',
  content,
);
console.log('Wrote', unique.length, 'words');

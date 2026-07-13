import { mkdir, writeFile } from "node:fs/promises";

const groups = {
  geometric: [
    ["heart", "爱心", "a plump rounded heart"], ["star", "星星", "a five-point rounded star"],
    ["moon", "月亮", "a thick crescent moon with the inner gap merged into a solid compact body"], ["sun", "太阳", "a round sun with short thick rounded rays connected to the center"],
    ["lightning", "闪电", "a bold compact lightning bolt"], ["shield", "盾牌", "a broad rounded medieval shield"],
    ["gem", "宝石", "a chunky faceted gemstone outer shape without facet lines"], ["clover", "四叶草", "a compact four-leaf clover with thick connected leaves"],
    ["flower-symbol", "花形符号", "a simple six-petal flower symbol with all petals connected"], ["drop", "水滴", "a large rounded water droplet"],
    ["flame", "火焰", "a compact cartoon flame with no inner flame hole"], ["spiral-shell", "旋涡", "a compact rounded swirl outer silhouette without internal spiral lines"],
    ["bow", "蝴蝶结", "a chunky cute bow tie with connected loops and no holes"], ["crown-symbol", "皇冠符号", "a wide three-point cartoon crown with a solid base"],
    ["spark", "闪光", "a rounded four-point sparkle symbol"], ["hexagon", "六边形", "a softly rounded hexagon"],
    ["pentagon", "五边形", "a softly rounded pentagon"], ["blob", "软糖形", "an asymmetrical rounded jelly blob"],
    ["badge", "徽章", "a scalloped award badge circle without ribbons or holes"], ["rainbow-arch", "彩虹拱形", "a thick solid rainbow arch with the inner opening completely filled"],
  ],
  animals: [
    ["cat-head", "猫头", "a cute front-facing cat head with short thick ears"], ["rabbit-head", "兔子头", "a cute rabbit head with short thick rounded ears"],
    ["bear-head", "熊头", "a cute bear head with round connected ears"], ["fox-head", "狐狸头", "a cute fox head with broad cheeks and thick ears"],
    ["panda-head", "熊猫头", "a cute panda head outer silhouette with round connected ears, no face markings"], ["dog-head", "小狗头", "a cute dog head with thick floppy ears connected to the head"],
    ["owl", "猫头鹰", "a compact front-facing owl body with connected wing shapes and no eyes"], ["penguin", "企鹅", "a compact standing penguin outer silhouette with short connected flippers"],
    ["whale", "鲸鱼", "a cute chunky whale with a short thick tail connected to the body"], ["fish", "小鱼", "a plump fish with a thick connected tail"],
    ["turtle", "乌龟", "a compact top-view turtle with short thick legs connected to its shell"], ["frog-head", "青蛙头", "a cute frog head with two rounded eye bumps but no facial details"],
    ["elephant-head", "大象头", "a front-facing elephant head with broad ears and a short thick trunk"], ["lion-head", "狮子头", "a cute lion head with a compact scalloped mane"],
    ["monkey-head", "猴子头", "a cute monkey head with large round connected ears"], ["koala-head", "考拉头", "a cute koala head with fluffy round connected ears"],
    ["chick", "小鸡", "a plump baby chick side silhouette with short feet merged into the body"], ["duck", "小鸭", "a plump duck side silhouette with a short broad bill"],
    ["snail", "蜗牛", "a compact snail with a large solid shell and thick body, no internal spiral"], ["butterfly", "蝴蝶", "a compact symmetric butterfly with all four wings connected and no holes"],
  ],
  nature: [
    ["cloud", "云朵", "a fluffy compact cloud with a flat rounded base"], ["mountain", "山峰", "a compact group of three connected rounded mountain peaks"],
    ["leaf", "树叶", "a broad simple leaf with a short thick stem and no veins"], ["maple-leaf", "枫叶", "a simplified chunky maple leaf with broad lobes and a thick short stem"],
    ["flower", "花朵", "a cute flower with six broad connected petals and a filled center"], ["mushroom", "蘑菇", "a cute mushroom with a wide rounded cap and thick stem"],
    ["tree", "大树", "a compact round-canopy tree with a thick trunk connected to the crown"], ["cactus", "仙人掌", "a chunky saguaro cactus with thick short arms"],
    ["pine-tree", "松树", "a simplified compact pine tree with broad layered branches and a thick trunk"], ["island", "小岛", "a compact tropical island silhouette with a short palm tree fused to a rounded island base"],
    ["wave", "海浪", "a single thick rounded ocean wave with no enclosed curl hole"], ["snowflake", "雪花", "a simplified chunky six-arm snowflake with thick connected branches"],
    ["acorn", "橡果", "a plump acorn with a broad cap and short stem, no internal line"], ["pumpkin", "南瓜", "a round pumpkin outer silhouette with a short thick stem and no segment lines"],
    ["pinecone", "松果", "a compact oval pinecone outer silhouette with no scale details"], ["shell", "贝壳", "a broad fan-shaped seashell outer silhouette without internal ridges"],
    ["coral", "珊瑚", "a compact branching coral with thick rounded branches"], ["volcano", "火山", "a broad volcano silhouette with a short connected smoke puff and no crater hole"],
    ["comet", "彗星", "a rounded comet head with a thick connected flowing tail"], ["planet", "行星", "a solid round planet with a thick ring fused to the planet, no holes"],
  ],
  objects: [
    ["rocket", "火箭", "a cute chunky upright rocket with short fins and no windows"], ["castle", "城堡", "a compact cartoon castle with three broad towers and a solid base, no doors or windows"],
    ["house", "小屋", "a cute compact house with a broad roof and solid body, no doors or windows"], ["gift", "礼物", "a wrapped gift box with a chunky bow fused to the box, no ribbon lines"],
    ["umbrella", "雨伞", "a broad rounded umbrella canopy with a short thick curved handle connected to it"], ["key", "钥匙", "a chunky antique key with the handle opening completely filled"],
    ["bell", "铃铛", "a broad cartoon bell with a connected clapper"], ["cup", "杯子", "a chunky mug with the handle opening completely filled"],
    ["teapot", "茶壶", "a cute round teapot with a thick spout and handle, all openings filled"], ["lamp", "台灯", "a compact desk lamp with a broad shade and thick connected base"],
    ["lightbulb", "灯泡", "a plump light bulb with a thick screw base and no internal filament"], ["camera", "相机", "a compact camera body with a round lens bump but no internal hole"],
    ["backpack", "背包", "a rounded school backpack with short straps merged into the body"], ["shoe", "鞋子", "a chunky side-view sneaker with no lace details"],
    ["hat", "帽子", "a cute broad-brim hat with a rounded crown"], ["chair", "椅子", "a compact cartoon armchair with thick legs and no gaps"],
    ["clock", "闹钟", "a round alarm clock with bells and legs connected, no clock-face details"], ["boat", "帆船", "a compact sailboat with a thick sail fused to a broad hull, no gaps"],
    ["train", "小火车", "a chunky side-view toy locomotive with wheels fused to the body"], ["guitar", "吉他", "a compact acoustic guitar with a thick neck and no sound hole"],
  ],
  food: [
    ["apple", "苹果", "a plump apple with a short thick stem and one broad connected leaf"], ["pear", "梨", "a plump pear with a short thick stem"],
    ["strawberry", "草莓", "a broad strawberry with a thick leafy crown and no seed details"], ["cherry-pair", "樱桃", "two plump cherries connected by thick joined stems"],
    ["pineapple", "菠萝", "a compact pineapple with a broad chunky leaf crown and no surface pattern"], ["watermelon", "西瓜", "a thick watermelon slice outer silhouette with no rind or seed details"],
    ["banana", "香蕉", "a thick curved banana with rounded ends"], ["grape", "葡萄", "a compact bunch of large connected grapes with a short thick leaf"],
    ["orange", "橙子", "a round orange with a short stem and broad connected leaf"], ["peach", "桃子", "a plump peach outer silhouette with a broad connected leaf and no center groove"],
    ["cake", "蛋糕", "a compact birthday cake with one thick layer and connected frosting, no candles"], ["cupcake", "纸杯蛋糕", "a cupcake with a broad swirled frosting outer silhouette and solid wrapper"],
    ["ice-cream", "冰淇淋", "a large rounded ice cream scoop fused to a broad cone with no pattern"], ["candy", "糖果", "a wrapped candy with chunky wrapper ends and no internal twist lines"],
    ["cookie", "饼干", "a round cookie with a small bite shape on one edge but no chip details"], ["donut", "甜甜圈", "a plump round donut with the center hole completely filled"],
    ["bread", "面包", "a rounded loaf of bread with no scoring lines"], ["cheese", "奶酪", "a chunky cheese wedge with no holes"],
    ["carrot", "胡萝卜", "a thick short carrot with a broad connected leafy top"], ["pumpkin-food", "南瓜果实", "a plump squat pumpkin with a short thick stem and no internal segment lines"],
  ],
} as const;

const common = "single solid pure black silhouette, centered on a pure white square background, one connected compact shape, simple rounded outer contour, no eyes, no mouth, no internal details, no internal lines, no holes, no cutouts, no outlines, no shading, no gradients, no texture, no text, no disconnected parts, thick sturdy features, high contrast, icon-like, instantly recognizable at thumbnail size, suitable for conversion to a 16 by 24 mobile puzzle grid";

const records = Object.entries(groups).flatMap(([category, items]) => items.map(([id, name, subject], index) => ({
  id: `${category}-${String(index + 1).padStart(2, "0")}-${id}`,
  category,
  name,
  subject,
  prompt: `${subject}, ${common}`,
  negativePrompt: "gray pixels, anti-aliased gray background, facial features, internal decoration, thin limbs, thin tail, antenna, isolated fragments, line art, hollow ring, realistic style, complex scene",
  output: `assets/silhouettes/raw/${category}-${String(index + 1).padStart(2, "0")}-${id}.png`,
})));

await mkdir("assets/silhouettes", { recursive: true });
await writeFile("assets/silhouettes/prompts.json", `${JSON.stringify(records, null, 2)}\n`);
console.log(`Wrote ${records.length} prompts`);

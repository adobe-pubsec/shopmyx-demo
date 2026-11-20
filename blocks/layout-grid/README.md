# Layout Grid

Arrange linked promotional images without nested blocks. Choose a named layout,
then add one image per row. All promotional text belongs in the artwork.

## Choose a Layout

Choose a class-based variant in the block heading, for example
**Layout Grid (Feature Left)**. Images start on the first content row; no layout
property row is needed. **Layout Grid** without a variant uses Three Columns.

| Variant label | CSS class | Images | Desktop arrangement |
| --- | --- | --- | --- |
| Equal Tiles: Two Columns | two-columns | Any | Two equal tiles per row |
| Equal Tiles: Three Columns | three-columns | Any | Three equal tiles per row; the default |
| Equal Tiles: Four Columns | four-columns | Any | Four equal tiles per row |
| Feature Left | feature-left | Five | One large square left, four small squares right |
| Feature Right | feature-right | Five | Four small squares left, one large square right |
| Wide Left | wide-left | Three | One wide tile left, two square tiles right |
| Wide Right | wide-right | Three | Two square tiles left, one wide tile right |

The Block Inspector's Variant control lists variants from the configured Blocks
library. Each library example must use the matching variant in its block heading.
Switching variants changes the classes, not the image count, order, or artwork.
Use the Blocks library to replace the entire template when those need to change.
Layout Grid does not need an entry in the options sheet.

Each library template, including the default without a variant, includes a
`fields` property in Library Metadata. Its nested table has a **Fields** header
spanning two columns, followed by one item row labeled **Image** and **Link**.
The library index's `editor` sheet must contain `block: layout-grid` and
`property: multi`. This makes the schema reusable for adding, removing, and
reordering image rows instead of defining fields separately for every sample.

Older layout property rows remain accepted as a fallback when no recognized
variant class is present. An explicit variant class takes precedence, and the
legacy row is hidden. Empty or unrecognized legacy values use Three Columns.

Layout sketches use numbers matching the image rows in the document:

```text
Feature Left         Feature Right
+-------+---+---+    +---+---+-------+
|       | 2 | 3 |    | 1 | 2 |       |
|   1   +---+---+    +---+---+   5   |
|       | 4 | 5 |    | 3 | 4 |       |
+-------+---+---+    +---+---+-------+

Wide Left            Wide Right
+-------+---+---+    +---+---+-------+
|   1   | 2 | 3 |    | 1 | 2 |   3   |
+-------+---+---+    +---+---+-------+
```

The kitchen example is **Feature Left**: KitchenAid, Instant Pot, Food Storage,
Paper & Plastic, Cleaning Supplies. The electronics example is **Feature Right**:
Amazon, Apple, Acer, Cameras, LG.

## Add Images and Links

| Layout Grid (Feature Left) | |
| --- | --- |
| KitchenAid image | [KitchenAid](https://www.shopmyexchange.com/) |
| Instant Pot image | [Instant Pot](https://www.shopmyexchange.com/) |
| Food Storage image | [Food Storage](https://www.shopmyexchange.com/) |
| Paper & Plastic image | [Paper & Plastic](https://www.shopmyexchange.com/) |
| Cleaning Supplies image | [Cleaning Supplies](https://www.shopmyexchange.com/) |

Replace the example destinations with the real category links. An image may
instead be linked directly in a single cell; a second link cell is optional.
Images without links are supported. Blank rows are ignored.

Use square artwork for equal tiles and large features, and 2:1 artwork for wide
features. Images are never cropped, so offers and small print remain visible.
Provide meaningful image alt text including the offer and destination. Descriptive
link text is used as the accessible name when an image has no alt text.

## Responsive Behavior

Below 900px, tiles use two columns. The feature spans the full width in its authored
position: Feature Left first, Feature Right after its four supporting images.
Reading order, tab order, and mobile order always match the document.

Equal layouts accept any number of images. Feature layouts are designed for five
images and wide layouts for three. Extra images continue as equal tiles after the
chosen arrangement; use another block to start a new arrangement. Missing images
do not produce empty cards, but may leave an incomplete arrangement.